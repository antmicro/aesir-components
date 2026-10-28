import { getDocsPageRecords } from '$lib/docs/navigation';

export function load() {
  return {
    docsLinks: getDocsPageRecords().map(({ title, group, order, href, icon }) => ({ title, group, order, href, icon }))
  };
}
