import { base } from '$app/paths';

export const usesStaticHtmlRoutes = Boolean(base);

const EXTERNAL_OR_SPECIAL_HREF_RE = /^(?:[a-z][a-z\d+\-.]*:|\/\/|#)/i;
const HAS_FILE_EXTENSION_RE = /\/[^/?#]+\.[^/?#]+$/;

const splitHref = (href) => {
  const hashIndex = href.indexOf('#');
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const queryIndex = withoutHash.indexOf('?');
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex) : '';
  const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  return { pathname, query, hash };
};

const withBase = (pathname) => {
  if (!pathname.startsWith('/')) return pathname;
  if (!base) return pathname;
  if (pathname === base || pathname.startsWith(`${base}/`)) return pathname;
  return `${base}${pathname}`;
};

export function resolveInternalHref(href) {
  if (!href || EXTERNAL_OR_SPECIAL_HREF_RE.test(href)) return href;
  const { pathname, query, hash } = splitHref(href);
  const withBasePath = withBase(pathname);
  if (HAS_FILE_EXTENSION_RE.test(withBasePath)) return `${withBasePath}${query}${hash}`;

  const directoryPath = withBasePath.endsWith('/') ? withBasePath : `${withBasePath}/`;
  const normalizedPath = usesStaticHtmlRoutes ? (pathname === '/' ? `${directoryPath}index.html` : `${withBasePath.replace(/\/$/, '')}.html`) : directoryPath;
  return `${normalizedPath}${query}${hash}`;
}

export function normalizePathname(pathname = '') {
  let normalized = pathname;
  if (base && (normalized === base || normalized.startsWith(`${base}/`))) {
    normalized = normalized.slice(base.length) || '/';
  }
  if (normalized.endsWith('/index.html')) {
    normalized = normalized.slice(0, -'/index.html'.length) || '/';
  } else if (normalized.endsWith('.html')) {
    normalized = normalized.slice(0, -'.html'.length) || '/';
  }
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized || '/';
}
