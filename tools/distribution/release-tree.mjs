import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';

const run = (repositoryRoot, command, args, options = {}) =>
  execFileSync(command, args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options
  }).trim();

export async function createReleaseBranch({ repositoryRoot, branchName, files = new Map(), tree, exclude = [], message, push }) {
  const git = (...args) => run(repositoryRoot, 'git', args);
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'aesir-release-index-'));
  const indexPath = path.join(temporaryDirectory, 'index');
  const gitWithIndex = (...args) =>
    run(repositoryRoot, 'git', args, {
      env: {
        ...process.env,
        GIT_INDEX_FILE: indexPath
      }
    });

  try {
    gitWithIndex('read-tree', ...(tree ? [tree] : ['--empty']));

    for (const [destination, source] of files) {
      const blob = git('hash-object', '-w', source);
      gitWithIndex('update-index', '--add', '--cacheinfo', `100644,${blob},${destination}`);
    }

    if (exclude.length) gitWithIndex('update-index', '--force-remove', '--', ...exclude);

    const releaseTree = gitWithIndex('write-tree');
    const sourceCommit = git('rev-parse', '--short=12', 'HEAD');
    const sourceAuthorName = git('show', '-s', '--format=%an', 'HEAD');
    const sourceAuthorEmail = git('show', '-s', '--format=%ae', 'HEAD');
    const sourceAuthorDate = git('show', '-s', '--format=%aI', 'HEAD');
    const remoteRef = `refs/remotes/origin/${branchName}`;
    const parent = (() => {
      try {
        git('show-ref', '--verify', '--quiet', remoteRef);
        return git('rev-parse', '--verify', remoteRef);
      } catch {
        return undefined;
      }
    })();
    const commitArguments = ['commit-tree', releaseTree, '-m', message(sourceCommit)];
    if (parent && git('rev-parse', `${parent}^{tree}`) === releaseTree) {
      console.log(`${branchName} is unchanged.`);
      return parent;
    }
    if (parent) commitArguments.push('-p', parent);

    const commit = run(repositoryRoot, 'git', commitArguments, {
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: sourceAuthorName,
        GIT_AUTHOR_EMAIL: sourceAuthorEmail,
        GIT_AUTHOR_DATE: sourceAuthorDate,
        GIT_COMMITTER_NAME: sourceAuthorName,
        GIT_COMMITTER_EMAIL: sourceAuthorEmail
      }
    });

    git('branch', '-f', branchName, commit);
    console.log(`Updated local ${branchName} at ${commit}.`);

    if (push) {
      git('push', 'origin', `${commit}:refs/heads/${branchName}`);
      console.log(`Published ${branchName} to origin.`);
    }

    return commit;
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}
