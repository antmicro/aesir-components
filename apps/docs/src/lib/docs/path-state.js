import { normalizePathname } from '$lib/utils.js';

export const isCurrentPath = (currentPathname, href) => normalizePathname(currentPathname) === normalizePathname(href);
