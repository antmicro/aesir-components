const branch = process.env.CI_COMMIT_REF_NAME || 'main';
const repository = process.env.CI_PROJECT_NAME || 'aesir-components';

export const docsBase = `/git/repositories/${repository}/branch/${branch}/docs`;

export function remarkDocsLinks() {
  return (tree) => {
    const visit = (node) => {
      if (node.type === 'link' && node.url?.startsWith('/') && !node.url.startsWith('//')) {
        const suffixIndex = node.url.search(/[?#]/);
        const pathname = suffixIndex === -1 ? node.url : node.url.slice(0, suffixIndex);
        const suffix = suffixIndex === -1 ? '' : node.url.slice(suffixIndex);
        const route = pathname.startsWith('/docs/') || pathname === '/docs';
        const htmlPath = route ? `${pathname.replace(/\/$/, '')}.html` : pathname;
        node.url = `${docsBase}${htmlPath}${suffix}`;
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}
