import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const packageRoot = fileURLToPath(new URL('.', import.meta.url));
export const elementRoot = fileURLToPath(new URL('./src/elements/', import.meta.url));
const sveltePackageEntry = fileURLToPath(import.meta.resolve('@aesir/svelte'));
const svelteIconRegistryPath = resolve(dirname(sveltePackageEntry), 'icons/registry.js');
export const htmlIconRegistry = fileURLToPath(new URL('./src/icons/registry.js', import.meta.url));

const globalCssPath = fileURLToPath(import.meta.resolve('@aesir/css/aesir-global.css'));
const coreCssId = 'virtual:aesir-html-core-css';
const resolvedCoreCssId = `\0${coreCssId}`;

export const aesirHtmlCoreCss = {
  name: 'aesir-html-core-css',
  resolveId(source) {
    if (source === coreCssId) return resolvedCoreCssId;
  },
  load(id) {
    if (id !== resolvedCoreCssId) return;
    const css = readFileSync(globalCssPath, 'utf8').replaceAll(/@font-face\s*\{[^}]+\}\s*/gs, '');
    return `export default ${JSON.stringify(css)};`;
  }
};

export const useExternalIconRegistry = {
  name: 'aesir-html-external-icon-registry',
  enforce: 'pre',
  resolveId(source, importer) {
    if (!importer) return;
    const cleanImporter = importer.split('?')[0];
    const resolvedSource = source.startsWith('.') ? resolve(dirname(cleanImporter), source) : source;
    if (resolvedSource === svelteIconRegistryPath) return htmlIconRegistry;
  }
};

export const transformAesirHtml = {
  name: 'transform-aesir-html',
  transform(code, id) {
    if (!id.split('?')[0].startsWith(elementRoot)) return;
    const reset = `:host, :global(*), :global(*::before), :global(*::after) { box-sizing: border-box; }`;
    return { code: code.includes('<style>') ? code.replace('<style>', `<style>${reset}`) : `${code}<style>${reset}</style>`, map: null };
  },
  generateBundle(_options, bundle) {
    const emDash = String.fromCodePoint(0x2014);
    const whitespaceLiteral = `\` \t\n\\r\\f${String.fromCodePoint(0xa0)}\\v\\uFEFF\``;
    const escapedWhitespaceLiteral = '` \\t\\n\\r\\f\\u00a0\\v\\uFEFF`';
    for (const output of Object.values(bundle)) {
      if (output.type !== 'chunk') continue;
      output.code = output.code.replaceAll(emDash, '-').replaceAll(whitespaceLiteral, escapedWhitespaceLiteral);
    }
  }
};
