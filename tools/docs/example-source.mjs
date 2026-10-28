export const trimExampleSource = (source) => source.trim();

const htmlStylePattern = /<style(?:\s[^>]*)?>[\s\S]*?<\/style>/i;
const svelteStylePattern = /<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi;

export const htmlExampleWithStyles = (htmlSource, svelteSource = '') => {
  const html = trimExampleSource(htmlSource);
  if (!svelteSource || htmlStylePattern.test(html)) return html;

  const styles = [...svelteSource.matchAll(svelteStylePattern)]
    .map((match) => match[1].trim().replace(/:global\(([^)]+)\)/g, '$1'))
    .filter(Boolean)
    .join('\n\n');

  return styles ? `${html}\n\n<style>\n${styles}\n</style>` : html;
};
