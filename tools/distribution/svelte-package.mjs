import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createReleaseBranch } from './release-tree.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const packagePath = 'packages/aesir-svelte';
const packageRoot = path.join(repositoryRoot, packagePath);
const cssOutputRoot = path.join(repositoryRoot, 'packages/aesir-css/dist');
const branchName = 'distribution/svelte';
const distributionAssets = new Map([
  ['aesir-global.css', 'src/styles/aesir-global.css'],
  ['aesir-motion.css', 'src/styles/aesir-motion.css'],
  ['aesir-typography.css', 'src/styles/aesir-typography.css'],
  ['fonts/Inter.woff2', 'src/styles/fonts/Inter.woff2'],
  ['fonts/Mono.woff2', 'src/styles/fonts/Mono.woff2']
]);
const textExtensions = new Set(['.css', '.js', '.json', '.md', '.svelte', '.ts']);
const ignoredDirectories = new Set(['.svelte-kit', 'dist', 'node_modules']);
const forbiddenPatterns = [
  { pattern: /\$app(?:\/|['"])/, label: '$app import' },
  { pattern: /\$lib(?:\/|['"])/, label: '$lib import' },
  { pattern: /\bclsx\b/, label: 'clsx dependency' },
  { pattern: /\bcn\s*\(/, label: 'cn helper' },
  { pattern: /src\/routes\//, label: 'docs route reference' },
  { pattern: /src\/lib\/components\/docs/, label: 'docs component reference' }
];

const collectFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries
      .filter((entry) => !entry.isDirectory() || !ignoredDirectories.has(entry.name))
      .map((entry) => {
        const entryPath = path.join(directory, entry.name);
        return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
      })
  );
  return nested.flat();
};

const checkPackage = async () => {
  const files = (await collectFiles(packageRoot)).filter((file) => textExtensions.has(path.extname(file)));
  const failures = [];

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const { pattern, label } of forbiddenPatterns) {
      if (pattern.test(source)) failures.push(`${path.relative(repositoryRoot, file)}: ${label}`);
    }
  }

  if (failures.length) {
    throw new Error(`Svelte distribution is coupled to the docs app:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
  }

  console.log(`Checked ${files.length} source files in ${packagePath}.`);
};

const checkDistributionAssets = async () => {
  await Promise.all([...distributionAssets].map(([source]) => readFile(path.join(cssOutputRoot, source))));
  console.log(`Checked ${distributionAssets.size} CSS assets for ${branchName}.`);
};

const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options
  }).trim();

const git = (...args) => run('git', args);
const listPackageFiles = async () => (await collectFiles(packageRoot)).map((file) => path.relative(packageRoot, file)).sort();

const listDistributionFiles = async () => [...(await listPackageFiles()), ...distributionAssets.values()].sort();

const updateBranch = async ({ push }) => {
  await checkPackage();
  await checkDistributionAssets();
  const status = git('status', '--porcelain', '--', packagePath, 'packages/aesir-css');
  if (status) {
    throw new Error(`Commit changes in ${packagePath} and packages/aesir-css before generating ${branchName}.`);
  }

  const files = new Map((await listPackageFiles()).map((file) => [file, path.join(packageRoot, file)]));
  for (const [source, destination] of distributionAssets) files.set(destination, path.join(cssOutputRoot, source));

  await createReleaseBranch({
    repositoryRoot,
    branchName,
    files,
    message: (sourceCommit) => `Build aesir-svelte from ${sourceCommit}`,
    push
  });
};

const [command = 'check', ...flags] = process.argv.slice(2);

try {
  if (command === 'check') {
    await checkPackage();
    await checkDistributionAssets();
  } else if (command === 'list') {
    await checkPackage();
    await checkDistributionAssets();
    console.log((await listDistributionFiles()).join('\n'));
  } else if (command === 'branch') {
    await updateBranch({ push: flags.includes('--push') });
  } else {
    throw new Error(`Unknown command "${command}". Use "check", "list", or "branch".`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
