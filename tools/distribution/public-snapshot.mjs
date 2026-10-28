import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createReleaseBranch } from './release-tree.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const git = (...args) => execFileSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' }).trim();

// The public branch must already exist: never use main as its parent.
git('rev-parse', '--verify', 'refs/remotes/origin/public-snapshot');
await createReleaseBranch({
  repositoryRoot,
  branchName: 'public-snapshot',
  tree: git('rev-parse', 'HEAD^{tree}'),
  exclude: ['.ci.yml'],
  message: () => 'Update public sources',
  push: process.argv.includes('--push')
});
