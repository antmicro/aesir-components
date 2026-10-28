import { execFileSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createReleaseBranch } from './release-tree.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const packagePath = 'integrations/flutter';
const outputDirectory = path.join(repositoryRoot, packagePath, 'dist');
const branchName = 'distribution/flutter';
const excludedPaths = [/^\.dart_tool\//, /^pubspec\.lock$/];
const requiredFiles = ['pubspec.yaml', 'lib/aesir.dart'];

const git = (...args) => execFileSync('git', args, { cwd: repositoryRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();

const listPackageFiles = async () => {
  const entries = await readdir(outputDirectory, { recursive: true, withFileTypes: true }).catch(() => {
    throw new Error(`Missing ${packagePath}/dist. Run "npm run build --workspace @aesir/flutter" first.`);
  });
  const files = entries
    .filter((entry) => !entry.isDirectory())
    .map((entry) => path.relative(outputDirectory, path.join(entry.parentPath, entry.name)))
    .filter((file) => !excludedPaths.some((pattern) => pattern.test(file)))
    .sort();
  const missing = requiredFiles.filter((file) => !files.includes(file));
  if (missing.length) throw new Error(`Flutter package is missing generated files: ${missing.join(', ')}`);
  return files;
};

const updateBranch = async ({ push }) => {
  const outputFiles = await listPackageFiles();
  const status = git('status', '--porcelain', '--', packagePath, 'packages/tokens');
  if (status) {
    throw new Error(`Commit changes in ${packagePath} and packages/tokens before generating ${branchName}.`);
  }

  const files = new Map(outputFiles.map((file) => [file, path.join(outputDirectory, file)]));
  files.set('LICENSE', path.join(repositoryRoot, 'LICENSE'));

  await createReleaseBranch({
    repositoryRoot,
    branchName,
    files,
    message: (sourceCommit) => `Build aesir-flutter from ${sourceCommit}`,
    push
  });
};

const [command = 'list', ...flags] = process.argv.slice(2);

try {
  if (command === 'list') {
    console.log([...(await listPackageFiles()), 'LICENSE'].sort().join('\n'));
  } else if (command === 'branch') {
    await updateBranch({ push: flags.includes('--push') });
  } else {
    throw new Error(`Unknown command "${command}". Use "list" or "branch".`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
