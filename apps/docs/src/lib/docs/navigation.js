import { normalizePathname } from '$lib/utils.js';

const docsPages = import.meta.glob('/src/routes/docs/**/+page.svx', { eager: true });
const docsSources = import.meta.glob('/src/routes/docs/**/+page.svx', { eager: true, query: '?raw', import: 'default' });

const titleCase = (value = '') =>
  value
    .split('-')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');

const routeFromPath = (path) => {
  const route =
    path
      .replace('/src/routes', '')
      .replace('/+page.svx', '')
      .replace(/\/index$/, '') || '/docs';
  return route === '/' ? route : route.endsWith('/') ? route : `${route}/`;
};

const getSegments = (href) =>
  href
    .replace(/^\/docs\/?/, '')
    .split('/')
    .filter(Boolean);

const getDefaults = (href) => {
  const segments = getSegments(href);
  return {
    title: segments.length ? titleCase(segments.at(-1)) : 'Introduction',
    group: segments.length > 1 ? titleCase(segments[0]) : 'General'
  };
};

const stripMarkup = (source = '') =>
  source
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/[>#*_~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const rawPageRecords = Object.entries(docsPages).map(([path, mod]) => {
  const metadata = mod.metadata ?? {};
  const href = routeFromPath(path);
  const defaults = getDefaults(href);
  const rawSource = docsSources[path] ?? '';
  const content = stripMarkup(rawSource).slice(0, 6000);
  return {
    href,
    title: metadata.title ?? defaults.title,
    badge: typeof metadata.badge === 'string' ? metadata.badge.trim() : null,
    icon: typeof metadata.icon === 'string' ? metadata.icon.trim() : null,
    order: metadata.order ?? 999,
    group: metadata.group ?? defaults.group,
    groupOrder: Number.isFinite(metadata.groupOrder) ? metadata.groupOrder : null,
    content
  };
});

const firstSeenGroupOrder = new Map();
const explicitGroupOrder = new Map();
for (const record of rawPageRecords) {
  if (!firstSeenGroupOrder.has(record.group)) {
    firstSeenGroupOrder.set(record.group, firstSeenGroupOrder.size);
  }
  if (record.groupOrder !== null) {
    const current = explicitGroupOrder.get(record.group);
    if (current === undefined || record.groupOrder < current) {
      explicitGroupOrder.set(record.group, record.groupOrder);
    }
  }
}

const pageRecords = rawPageRecords.sort((a, b) => {
  const aGroupOrder = explicitGroupOrder.get(a.group) ?? firstSeenGroupOrder.get(a.group) ?? Number.MAX_SAFE_INTEGER;
  const bGroupOrder = explicitGroupOrder.get(b.group) ?? firstSeenGroupOrder.get(b.group) ?? Number.MAX_SAFE_INTEGER;
  if (aGroupOrder !== bGroupOrder) return aGroupOrder - bGroupOrder;
  if (a.group === 'Components' && b.group === 'Components') return a.title.localeCompare(b.title);
  if (a.order !== b.order) return a.order - b.order;
  return a.title.localeCompare(b.title);
});

const sidebar = Object.values(
  pageRecords.reduce((acc, page) => {
    acc[page.group] ??= { title: page.group, items: [] };
    acc[page.group].items.push({ title: page.title, href: page.href, badge: page.badge, icon: page.icon });
    return acc;
  }, {})
);

const searchIndex = pageRecords.map((page) => ({
  href: page.href,
  title: page.title,
  group: page.group,
  order: page.order,
  icon: page.icon,
  content: page.content
}));

export const getDocsPageRecords = () => pageRecords;
export const getDocsSidebar = () => sidebar;
export const getDocsSearchIndex = () => searchIndex;

export const getDocsNavigation = (url) => {
  const currentPath = normalizePathname(url.pathname);
  const currentPage = pageRecords.find((page) => normalizePathname(page.href) === currentPath) ?? null;
  const currentIndex = currentPage ? pageRecords.findIndex((page) => page.href === currentPage.href) : -1;
  const previousPage = currentIndex > 0 ? pageRecords[currentIndex - 1] : null;
  const nextPage = currentIndex >= 0 && currentIndex < pageRecords.length - 1 ? pageRecords[currentIndex + 1] : null;
  const breadcrumbs = [{ title: 'Docs', href: '/docs/' }];

  if (currentPage) breadcrumbs.push({ title: currentPage.title });

  const pageTitle = currentPage ? `${currentPage.title} | Design System Docs` : 'Docs | Design System Docs';
  return { sidebar, breadcrumbs, pageTitle, previousPage, nextPage, searchIndex, currentPage };
};
