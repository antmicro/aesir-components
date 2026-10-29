import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createReleaseBranch } from './release-tree.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const git = (...args) => execFileSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' }).trim();

// The public branch must already exist: never use main as its parent.
git('rev-parse', '--verify', 'refs/remotes/origin/public-snapshot');
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'aesir-snapshot-'));
try {
  const manifest = JSON.parse(git('show', 'HEAD:package.json'));
  delete manifest.scripts['check:public'];
  const manifestPath = path.join(temporaryDirectory, 'package.json');
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  await createReleaseBranch({
    repositoryRoot,
    branchName: 'public-snapshot',
    tree: git('rev-parse', 'HEAD^{tree}'),
    files: new Map([['package.json', manifestPath]]),
    exclude: ['.ci.yml', 'tools/public-audit.mjs'],
    message: () => 'Update public sources',
    push: process.argv.includes('--push')
  });
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
