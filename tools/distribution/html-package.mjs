import { execFileSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createReleaseBranch } from './release-tree.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const packagePath = 'packages/aesir-html';
const outputDirectory = path.join(repositoryRoot, packagePath, 'dist');
const bundleCheck = path.join(repositoryRoot, 'tools/distribution/check-html-bundle.mjs');

const distributions = {
  'all-in-one': {
    branchName: 'distribution/html',
    readme: 'readmes/html.md',
    include: (file) => ['aesir-html.min.js', 'aesir-icons.min.js', 'aesir-typography.css'].includes(file)
  },
  modular: {
    branchName: 'distribution/html-modular',
    readme: 'readmes/html-modular.md',
    include: (file) => file !== 'aesir-html.min.js'
  }
};

const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options
  }).trim();

const git = (...args) => run('git', args);
const checkBundle = () => {
  run(process.execPath, [bundleCheck]);
};

const listOutputFiles = async (directory = outputDirectory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listOutputFiles(entryPath) : [path.relative(outputDirectory, entryPath)];
    })
  );
  return nestedFiles.flat().sort();
};

const checkCommittedSource = (outputFiles, branchName) => {
  git('cat-file', '-e', `HEAD:${packagePath}`);
  const generatedBundlePaths = new Set(outputFiles.map((file) => `${packagePath}/dist/${file}`));
  const changes = git('status', '--porcelain', '--', packagePath)
    .split('\n')
    .filter(Boolean)
    .filter((line) => {
      const changedPath = line.trimStart().replace(/^\S+\s+/, '');
      return !generatedBundlePaths.has(changedPath);
    });

  if (changes.length) {
    throw new Error(`Commit changes in ${packagePath} before generating ${branchName}:\n${changes.join('\n')}`);
  }
};

const updateBranch = async ({ push, distribution }) => {
  const { branchName, include, readme } = distributions[distribution];
  checkBundle();
  const allOutputFiles = await listOutputFiles();
  const outputFiles = allOutputFiles.filter(include);
  checkCommittedSource(allOutputFiles, branchName);

  const files = new Map(outputFiles.map((file) => [file, path.join(outputDirectory, file)]));
  files.set('README.md', path.join(import.meta.dirname, readme));

  await createReleaseBranch({
    repositoryRoot,
    branchName,
    files,
    message: (sourceCommit) => `Build aesir-html ${distribution} from ${sourceCommit}`,
    push
  });
};

const [command = 'check', ...flags] = process.argv.slice(2);

try {
  if (command === 'check') {
    checkBundle();
  } else if (command === 'list') {
    const distribution = flags.includes('--modular') ? 'modular' : 'all-in-one';
    checkBundle();
    const outputFiles = (await listOutputFiles()).filter(distributions[distribution].include);
    console.log(outputFiles.join('\n'));
  } else if (command === 'branch') {
    const distribution = flags.includes('--modular') ? 'modular' : 'all-in-one';
    await updateBranch({ push: flags.includes('--push'), distribution });
  } else {
    throw new Error(`Unknown command "${command}". Use "check", "list", or "branch".`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
