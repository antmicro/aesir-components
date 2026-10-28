import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const routesDirectory = resolve(repositoryRoot, 'apps/docs/src/routes');
const buildDirectory = resolve(repositoryRoot, process.argv[2] ?? 'apps/docs/build');

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const path = resolve(directory, entry.name);
        return entry.isDirectory() ? walk(path) : [path];
      })
    )
  ).flat();
};

const sourcePages = (await walk(routesDirectory)).filter((path) => /\+page\.(?:svelte|svx)$/.test(path));
const expectedPages = sourcePages
  .map((path) => relative(routesDirectory, dirname(path)).split(sep))
  .filter((segments) => segments.every((segment) => !segment.startsWith('[')))
  .map((segments) => resolve(buildDirectory, segments[0] ? `${segments.join('/')}.html` : 'index.html'));

for (const path of expectedPages) {
  if (!existsSync(path)) throw new Error(`Static docs build is missing ${relative(buildDirectory, path)}`);
}

const htmlFiles = (await walk(buildDirectory)).filter((path) => path.endsWith('.html'));
const missingTargets = [];

for (const path of htmlFiles) {
  const pagePath = relative(buildDirectory, path);
  const source = await readFile(path, 'utf8');
  if (!/^<!doctype html>/i.test(source)) throw new Error(`${pagePath} is missing a doctype`);
  if (!/<title>[^<]+<\/title>/i.test(source)) throw new Error(`${pagePath} is missing a title`);
  if (!existsSync(`${path}__data.json`)) throw new Error(`${pagePath} is missing route data for client-side navigation`);

  const references = [...source.matchAll(/\b(?:href|src)=(['"])(.*?)\1/gi)].map((match) => match[2]);
  for (const reference of references) {
    if (!reference || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference)) continue;
    const pathname = decodeURI(reference.split(/[?#]/, 1)[0]);
    if (!pathname) continue;
    if (pagePath.startsWith(`examples${sep}`) || pathname.endsWith('/missing-avatar.png')) continue;
    const target = resolve(dirname(path), pathname);
    if (!existsSync(target)) missingTargets.push(`${pagePath} -> ${reference}`);
  }
}

if (missingTargets.length) throw new Error(`Static docs contain missing local targets:\n${missingTargets.join('\n')}`);

console.log(`Checked ${htmlFiles.length} static pages and ${expectedPages.length} authored routes.`);
