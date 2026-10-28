import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { docsBase } from './paths.mjs';

const buildDirectory = resolve(process.argv[2] ?? 'apps/docs/build');
const externalOrSpecialHref = /^(?:[a-z][a-z\d+\-.]*:|\/\/|#)/i;
const fileExtension = /\/[^/?#]+\.[^/?#]+$/;
const assetDirectories = ['_app', 'assets', 'exports', 'images', 'vendor'];

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? walk(path) : path.endsWith('.html') ? [path] : [];
    })
  );
  return files.flat();
};

const splitSuffix = (href) => {
  const suffixIndex = href.search(/[?#]/);
  return suffixIndex === -1 ? { pathname: href, suffix: '' } : { pathname: href.slice(0, suffixIndex), suffix: href.slice(suffixIndex) };
};

const relativeBuildRoot = (filename) => {
  const path = relative(dirname(filename), buildDirectory).split(sep).join('/');
  return path ? `${path}/` : './';
};

const routeDataPath = (filename) => {
  const route = relative(buildDirectory, filename).split(sep).join('/');
  return route === 'index.html' ? resolve(buildDirectory, '__data.json') : resolve(buildDirectory, route.replace(/\.html$/, '/__data.json'));
};

const finalizeHref = (href, filename) => {
  if (!href || externalOrSpecialHref.test(href)) return href;

  const { pathname: originalPathname, suffix } = splitSuffix(href);
  const pathname = originalPathname.startsWith(`${docsBase}/`) ? originalPathname.slice(docsBase.length) : originalPathname;
  const assetDirectory = assetDirectories.find((candidate) => pathname === `/${candidate}` || pathname.includes(`/${candidate}/`));
  if (assetDirectory) {
    const marker = `/${assetDirectory}`;
    const assetPath = pathname.slice(pathname.indexOf(marker) + 1);
    return `${relativeBuildRoot(filename)}${assetPath}${suffix}`;
  }

  const rootedPath = pathname.startsWith('/') ? `${relativeBuildRoot(filename)}${pathname.slice(1)}` : pathname;
  if (fileExtension.test(rootedPath)) return `${rootedPath}${suffix}`;

  if (pathname === '/') return `${relativeBuildRoot(filename)}index.html${suffix}`;
  return `${rootedPath.replace(/\/$/, '')}.html${suffix}`;
};

const finalizeAssetUrl = (url, filename) => {
  if (!url || /^(?:data:|blob:|https?:|\/\/|#)/i.test(url)) return url;

  const { pathname, suffix } = splitSuffix(url);
  const directory = assetDirectories.find((candidate) => pathname === `/${candidate}` || pathname.includes(`/${candidate}/`));
  if (!directory && !pathname.startsWith('/')) return url;

  const marker = directory ? `/${directory}` : '/';
  const assetPath = pathname.slice(pathname.indexOf(marker) + 1);
  return `${relativeBuildRoot(filename)}${assetPath}${suffix}`;
};

const htmlFiles = await walk(buildDirectory);

await Promise.all(
  htmlFiles.map(async (filename) => {
    const source = await readFile(filename, 'utf8');
    const hrefOutput = source.replace(/href=(["'])(.*?)\1/g, (match, quote, href) => {
      const finalizedHref = finalizeHref(href, filename);
      return finalizedHref === href ? match : `href=${quote}${finalizedHref}${quote}`;
    });
    const assetOutput = hrefOutput.replace(/\b(src|poster)=(["'])(.*?)\2/g, (match, attribute, quote, url) => {
      const finalizedUrl = finalizeAssetUrl(url, filename);
      return finalizedUrl === url ? match : `${attribute}=${quote}${finalizedUrl}${quote}`;
    });
    if (assetOutput !== source) await writeFile(filename, assetOutput);
    await writeFile(`${filename}__data.json`, await readFile(routeDataPath(filename)));
  })
);

console.log(`Finalized ${htmlFiles.length} static HTML routes with relative assets, explicit .html links, and matching route data.`);
