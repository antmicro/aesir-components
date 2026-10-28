import { getDocsSidebar } from '$lib/docs/navigation';

export const prerender = true;
export const trailingSlash = 'never';

export const load = () => ({
  docsSidebar: getDocsSidebar()
});
