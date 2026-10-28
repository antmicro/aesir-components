import { getDocsNavigation } from '$lib/docs/navigation';

export function load({ url }) {
  return getDocsNavigation(url);
}
