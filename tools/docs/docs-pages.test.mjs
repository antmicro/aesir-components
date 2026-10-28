import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { docsBase, remarkDocsLinks } from './paths.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const docsRoot = join(repositoryRoot, 'apps/docs/src/routes/docs');
const staticRoot = join(repositoryRoot, 'apps/docs/static');
const routesRoot = join(repositoryRoot, 'apps/docs/src/routes');
const iconRegistry = readFileSync(join(repositoryRoot, 'packages/aesir-svelte/src/icons/registry.js'), 'utf8');

const walk = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });

const pages = walk(docsRoot).filter((path) => path.endsWith('+page.svx'));
const pageName = (path) => relative(repositoryRoot, path);
const authoredContent = (source) => source.replace(/^```[^\n]*\n[\s\S]*?^```$/gm, '');

test('production markdown links include the deployment base and HTML routes', () => {
  const urls = ['/docs/installation/', '/docs/theming/#accent-color', '/exports/penpot/$themes.json', 'https://example.com', '#local'];
  const tree = { type: 'root', children: urls.map((url) => ({ type: 'link', url })) };
  remarkDocsLinks()(tree);
  assert.deepEqual(
    tree.children.map((node) => node.url),
    [`${docsBase}/docs/installation.html`, `${docsBase}/docs/theming.html#accent-color`, `${docsBase}/exports/penpot/$themes.json`, 'https://example.com', '#local']
  );
});

test('every docs page has matching metadata and one H1', () => {
  for (const path of pages) {
    const source = readFileSync(path, 'utf8');
    const content = authoredContent(source);
    const title = content.match(/^title:\s*(.+)$/m)?.[1];
    const headings = [...content.matchAll(/^# (.+)$/gm)].map((match) => match[1]);

    assert.ok(title, `${pageName(path)} is missing a frontmatter title`);
    assert.equal(headings.length, 1, `${pageName(path)} must contain exactly one H1`);
    assert.equal(headings[0], title, `${pageName(path)} H1 must match its frontmatter title`);
  }
});

test('docs pages use the shared example viewer', () => {
  for (const path of pages) {
    const source = authoredContent(readFileSync(path, 'utf8'));
    assert.doesNotMatch(source, /<(?:Preview|CodeExample)(?:\s|>)/, `${pageName(path)} uses a legacy example component`);
    assert.doesNotMatch(source, /^<script>.*\bimport\b/m, `${pageName(path)} has an unformatted one-line script block`);

    if (path.includes('/components/') && !path.endsWith('/navbar/+page.svx')) {
      assert.match(source, /<DocsExample(?:\s|>)/, `${pageName(path)} must show component source through DocsExample`);
    }
  }
});

test('internal markdown links resolve to a docs route or static file', () => {
  for (const path of pages) {
    const source = authoredContent(readFileSync(path, 'utf8'));
    const links = [...source.matchAll(/\]\((\/[^)\s#]+)(?:#[^)]+)?\)/g)].map((match) => decodeURI(match[1]));

    for (const href of links) {
      const target = href.startsWith('/docs/') ? join(repositoryRoot, 'apps/docs/src/routes', href, '+page.svx') : join(staticRoot, href);
      assert.ok(existsSync(target), `${pageName(path)} links to missing ${href}`);
    }
  }
});

test('docs navigation data stays behind server route boundaries', () => {
  assert.ok(existsSync(join(routesRoot, '+layout.server.ts')), 'root navigation must load on the server');
  assert.ok(existsSync(join(routesRoot, '+page.server.js')), 'home page navigation must load on the server');
  assert.ok(existsSync(join(docsRoot, '+layout.server.js')), 'docs navigation must load on the server');

  for (const path of walk(routesRoot).filter((file) => /\+(?:layout|page)\.(?:js|ts)$/.test(file))) {
    assert.doesNotMatch(readFileSync(path, 'utf8'), /\$lib\/docs\/navigation/, `${pageName(path)} must not bundle the eager docs registry into the browser`);
  }
});

test('every docs navigation icon exists in the Svelte icon registry', () => {
  for (const path of pages) {
    const source = readFileSync(path, 'utf8');
    const icon = source.match(/^icon:\s*(.+)$/m)?.[1]?.trim();
    if (!icon) continue;

    const exportName = icon
      .split('-')
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join('');
    assert.match(iconRegistry, new RegExp(`\\b${exportName}\\b`), `${pageName(path)} uses an icon missing from the Svelte registry: ${icon}`);
  }
});
