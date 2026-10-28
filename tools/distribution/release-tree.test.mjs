import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createReleaseBranch } from './release-tree.mjs';

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

test('creates a release branch from an explicit file map without changing checkout', async () => {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), 'aesir-release-tree-test-'));

  try {
    git(repositoryRoot, 'init', '--initial-branch=main');
    git(repositoryRoot, 'config', 'user.name', 'Aesir Test');
    git(repositoryRoot, 'config', 'user.email', 'aesir@example.test');
    await writeFile(path.join(repositoryRoot, 'source.txt'), 'source\n');
    await writeFile(path.join(repositoryRoot, '.ci.yml'), 'internal: configuration\n');
    git(repositoryRoot, 'add', 'source.txt', '.ci.yml');
    git(repositoryRoot, 'commit', '-m', 'Initial source');

    await writeFile(path.join(repositoryRoot, 'asset.css'), 'body { color: black; }\n');
    await writeFile(path.join(repositoryRoot, 'component.js'), 'export const component = true;\n');

    await createReleaseBranch({
      repositoryRoot,
      branchName: 'distribution/test',
      files: new Map([
        ['styles/asset.css', path.join(repositoryRoot, 'asset.css')],
        ['component.js', path.join(repositoryRoot, 'component.js')]
      ]),
      message: (sourceCommit) => `Build test distribution from ${sourceCommit}`,
      push: false
    });

    assert.equal(git(repositoryRoot, 'branch', '--show-current'), 'main');
    assert.equal(git(repositoryRoot, 'show', 'distribution/test:styles/asset.css'), 'body { color: black; }');
    assert.equal(git(repositoryRoot, 'show', 'distribution/test:component.js'), 'export const component = true;');
    assert.deepEqual(git(repositoryRoot, 'ls-tree', '-r', '--name-only', 'distribution/test').split('\n'), ['component.js', 'styles/asset.css']);
    assert.match(git(repositoryRoot, 'show', '-s', '--format=%s', 'distribution/test'), /^Build test distribution from [a-f\d]{12}$/);

    const publicRoot = git(repositoryRoot, 'rev-parse', 'distribution/test');
    git(repositoryRoot, 'update-ref', 'refs/remotes/origin/public-snapshot', publicRoot);
    const privateHead = git(repositoryRoot, 'rev-parse', 'main');
    const snapshot = await createReleaseBranch({
      repositoryRoot,
      branchName: 'public-snapshot',
      tree: 'HEAD^{tree}',
      exclude: ['.ci.yml'],
      message: () => 'Update public sources',
      push: false
    });
    assert.equal(git(repositoryRoot, 'rev-parse', `${snapshot}^`), publicRoot);
    assert.equal(git(repositoryRoot, 'show', `${snapshot}:source.txt`), git(repositoryRoot, 'show', 'main:source.txt'));
    assert.equal(git(repositoryRoot, 'ls-tree', '--name-only', snapshot, '.ci.yml'), '');
    assert.equal(git(repositoryRoot, 'show', 'main:.ci.yml'), 'internal: configuration');
    assert.equal(git(repositoryRoot, 'rev-list', '--count', snapshot), '2');
    assert.ok(!git(repositoryRoot, 'rev-list', snapshot).split('\n').includes(privateHead));
    git(repositoryRoot, 'update-ref', 'refs/remotes/origin/public-snapshot', snapshot);
    const unchanged = await createReleaseBranch({
      repositoryRoot,
      branchName: 'public-snapshot',
      tree: 'HEAD^{tree}',
      exclude: ['.ci.yml'],
      message: () => 'Update public sources',
      push: false
    });
    assert.equal(unchanged, snapshot);
    assert.equal(git(repositoryRoot, 'branch', '--show-current'), 'main');
  } finally {
    await rm(repositoryRoot, { recursive: true, force: true });
  }
});
