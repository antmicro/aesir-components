const STATIC_INDEX_SUFFIX = '/index.html';
const STATIC_HTML_SUFFIX = '.html';

export const reroute = ({ url }) => {
  if (url.pathname.endsWith(STATIC_INDEX_SUFFIX)) {
    return url.pathname.slice(0, -STATIC_INDEX_SUFFIX.length);
  }
  if (url.pathname.endsWith(STATIC_HTML_SUFFIX)) {
    return url.pathname.slice(0, -STATIC_HTML_SUFFIX.length);
  }
};
