import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const htmlSourceRoot = path.resolve(import.meta.dirname, '../../packages/aesir-html/src');
const htmlPackageRoot = path.resolve(import.meta.dirname, '../../packages/aesir-html');
const docsSourceRoot = path.resolve(import.meta.dirname, '../../apps/docs/src');
const cssBuildRoot = path.resolve(import.meta.dirname, '../../packages/aesir-css/scripts');
const packageRoots = [
  path.resolve(import.meta.dirname, '../../packages/aesir-css'),
  path.resolve(import.meta.dirname, '../../packages/aesir-html'),
  path.resolve(import.meta.dirname, '../../packages/aesir-svelte'),
  path.resolve(import.meta.dirname, '../../packages/tokens')
];
const integrationRoots = ['figma', 'flutter', 'penpot'].map((root) => path.resolve(import.meta.dirname, `../../integrations/${root}`));
const toolsRoot = path.resolve(import.meta.dirname, '..');
const sveltePackageRoot = path.resolve(import.meta.dirname, '../../packages/aesir-svelte');
const svelteDistributionPath = String.raw`(?:packages/aesir-svelte|node_modules/@aesir/svelte)/dist`;
const resolvesToSvelteDistribution = (relativePath) => new RegExp(`^file:.*\\/${svelteDistributionPath}\\/${relativePath}$`);
const cssDistributionPath = String.raw`(?:packages/aesir-css|node_modules/@aesir/css)/dist`;
const resolvesToCssDistribution = (relativePath) => new RegExp(`^file:.*\\/${cssDistributionPath}\\/${relativePath}$`);
const tokensPackagePath = String.raw`(?:packages/tokens|node_modules/@aesir/tokens)`;
const resolvesToTokensPackage = (relativePath, protocol = true) => new RegExp(`${protocol ? '^file:' : ''}.*\\/${tokensPackagePath}\\/${relativePath}$`);

const collectSourceFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory() && ['.svelte-kit', 'build', 'dist', 'node_modules'].includes(entry.name)) return [];
      return entry.isDirectory() ? collectSourceFiles(entryPath) : [entryPath];
    })
  );
  return files.flat().filter((file) => ['.js', '.mjs', '.svelte', '.svx', '.ts'].includes(path.extname(file)));
};

test('HTML consumes Svelte through declared package exports', async () => {
  const files = await collectSourceFiles(htmlSourceRoot);
  const specifiers = new Set();

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /(?:\.\.\/)+aesir-svelte\/src\//, `${path.relative(htmlSourceRoot, file)} bypasses the @aesir/svelte package boundary`);
    for (const match of source.matchAll(/from\s+['"](@aesir\/svelte[^'"]*)['"]/g)) specifiers.add(match[1]);
  }

  assert.ok(specifiers.size > 0, 'Expected HTML to consume at least one @aesir/svelte export');
  for (const specifier of specifiers) {
    assert.match(import.meta.resolve(specifier), resolvesToSvelteDistribution('.*'), `${specifier} does not resolve into the built Svelte package`);
  }
});

test('HTML build consumes workspace dependencies through package exports', async () => {
  const files = await collectSourceFiles(htmlPackageRoot);
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /(?:\.\.\/)+aesir-(?:css|svelte)\//, `${path.relative(htmlPackageRoot, file)} bypasses a workspace package boundary`);
  }

  assert.match(import.meta.resolve('@aesir/css/aesir-global.css'), resolvesToCssDistribution(String.raw`aesir-global\.css`));
  assert.match(import.meta.resolve('@aesir/css/fonts/Inter.woff2'), resolvesToCssDistribution(String.raw`fonts/Inter\.woff2`));
});

test('design-tool integrations consume token sources through package exports', async () => {
  for (const integrationRoot of integrationRoots) {
    const files = await collectSourceFiles(integrationRoot);
    for (const file of files) {
      const source = await readFile(file, 'utf8');
      assert.doesNotMatch(source, /(?:\.\.\/)+packages\/tokens\//, `${path.relative(integrationRoot, file)} bypasses the @aesir/tokens package boundary`);
    }
  }

  assert.match(import.meta.resolve('@aesir/tokens/internal/source'), resolvesToTokensPackage(String.raw`scripts/source\.js`));
});

test('CSS consumes token inputs through declared package exports', async () => {
  const files = await collectSourceFiles(cssBuildRoot);
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /(?:\.\.\/)+tokens\/(?:src|build)\//, `${path.relative(cssBuildRoot, file)} bypasses the @aesir/tokens package boundary`);
  }

  const { tokenBuildArtifact, tokenSource } = await import('@aesir/tokens/internal/source');
  assert.match(tokenSource('composites/styles.json'), resolvesToTokensPackage(String.raw`src/composites/styles\.json`, false));
  assert.match(tokenBuildArtifact('token-fragments/light.css'), resolvesToTokensPackage(String.raw`build/token-fragments/light\.css`, false));
});

test('docs consume Svelte through declared package exports', async () => {
  const files = await collectSourceFiles(docsSourceRoot);
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /(?:\.\.\/)+packages\/aesir-svelte\//, `${path.relative(docsSourceRoot, file)} bypasses the @aesir/svelte package boundary`);
    assert.doesNotMatch(source, /['"]\$aesir(?:\/|['"])/, `${path.relative(docsSourceRoot, file)} uses the removed $aesir source alias`);
  }

  assert.match(import.meta.resolve('@aesir/svelte/icons/python'), resolvesToSvelteDistribution(String.raw`icons/python\.svelte`));
  assert.match(import.meta.resolve('@aesir/svelte/utilities/overlay'), resolvesToSvelteDistribution(String.raw`components/overlay/overlay\.js`));
});

test('Svelte keeps its icon registry private and static', async () => {
  const packageMetadata = JSON.parse(await readFile(path.join(sveltePackageRoot, 'package.json'), 'utf8'));
  const registry = await readFile(path.join(sveltePackageRoot, 'src/icons/registry.js'), 'utf8');

  assert.equal(packageMetadata.exports['./icons/registry'], null);
  assert.throws(() => import.meta.resolve('@aesir/svelte/icons/registry'), /not defined by "exports"/);
  assert.doesNotMatch(registry, /globalThis|registerIcons|aesir-icons-registered/);
});

test('Svelte public source paths use kebab-case names', async () => {
  const iconEntries = await readdir(path.join(sveltePackageRoot, 'src/icons'), { withFileTypes: true });
  for (const entry of iconEntries) {
    if (!entry.isFile() || !entry.name.endsWith('.svelte')) continue;
    assert.match(entry.name, /^[a-z0-9]+(?:-[a-z0-9]+)*\.svelte$/, `Icon source ${entry.name} must use kebab-case`);
  }

  const componentsRoot = path.join(sveltePackageRoot, 'src/components');
  const componentEntries = await readdir(componentsRoot, { withFileTypes: true });
  const entryFileExceptions = new Map([['aesir-toast', 'aesir-toaster.svelte']]);
  for (const entry of componentEntries) {
    if (!entry.isDirectory() || !entry.name.startsWith('aesir-')) continue;
    const files = await readdir(path.join(componentsRoot, entry.name));
    const expectedEntryFile = entryFileExceptions.get(entry.name) ?? `${entry.name}.svelte`;
    assert.ok(files.includes(expectedEntryFile), `${entry.name} must contain ${expectedEntryFile}`);
  }
});

test('Svelte exposes intentional component and utility subpaths', async () => {
  const packageIndex = await readFile(path.join(sveltePackageRoot, 'dist/index.js'), 'utf8');

  assert.match(packageIndex, /AesirAnimate/);
  assert.match(packageIndex, /AesirContextMenu/);
  assert.doesNotMatch(packageIndex, /\bRoot\b/);
  assert.doesNotMatch(packageIndex, /\bTrigger\b/);
  assert.match(import.meta.resolve('@aesir/svelte/components/aesir-animate'), resolvesToSvelteDistribution(String.raw`components/aesir-animate/index\.js`));
  assert.match(import.meta.resolve('@aesir/svelte/components/aesir-context-menu'), resolvesToSvelteDistribution(String.raw`components/aesir-context-menu/index\.js`));
  assert.match(import.meta.resolve('@aesir/svelte/utilities/merge-props'), resolvesToSvelteDistribution(String.raw`utils/merge-props\.js`));
  assert.match(import.meta.resolve('@aesir/svelte/utilities/overlay'), resolvesToSvelteDistribution(String.raw`components/overlay/overlay\.js`));
  assert.throws(() => import.meta.resolve('@aesir/svelte/components/animate'), /not defined by "exports"/);
  assert.throws(() => import.meta.resolve('@aesir/svelte/components/context-menu'), /not defined by "exports"/);
  assert.throws(() => import.meta.resolve('@aesir/svelte/internal/command-search'), /not defined by "exports"/);
});

test('package builds do not write into applications', async () => {
  for (const packageRoot of packageRoots) {
    const files = await collectSourceFiles(packageRoot);
    for (const file of files) {
      const source = await readFile(file, 'utf8');
      assert.doesNotMatch(source, /apps\/docs\//, `${path.relative(packageRoot, file)} writes across the package boundary into docs`);
    }
  }
});

test('repository tests consume workspaces through package exports', async () => {
  const files = (await collectSourceFiles(toolsRoot)).filter((file) => file.endsWith('.test.mjs'));
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /from\s+['"](?:\.\.\/)+packages\//, `${path.relative(toolsRoot, file)} imports workspace implementation by path`);
  }

  assert.match(import.meta.resolve('@aesir/svelte/utilities/merge-props'), resolvesToSvelteDistribution(String.raw`utils/merge-props\.js`));
});
