import { mdsvex, escapeSvelte } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';
import { createDocsHighlighter } from '../../tools/docs/highlighter.js';
import { docsBase, remarkDocsLinks } from '../../tools/docs/paths.mjs';

const isProduction = process.env.NODE_ENV === 'production';

const generateHtml = await createDocsHighlighter();

const encodeCopyValue = (value = '') => Buffer.from(value, 'utf8').toString('base64');
const getCopyButtonHtml = (encoded) =>
  `<button type="button" class="docs-copy-button" data-copy-b64="${encoded}" data-copy-state="idle" aria-label="Copy code" title="Copy code"><svg class="docs-copy-icon docs-copy-icon-idle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><svg class="docs-copy-icon docs-copy-icon-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg></button>`;

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    experimental: {
      handleRenderingErrors: false
    },
    adapter: adapter(),
    prerender: {
      crawl: false,
      entries: ['*']
    },
    paths: {
      base: isProduction ? docsBase : '',
      relative: isProduction
    }
  },
  onwarn: (warning, handler) => {
    // mdsvex 0.12 generates a legacy module script for frontmatter metadata.
    // Keep the exception limited to generated `.svx` output so authored Svelte
    // files still surface `script_context_deprecated` during the build.
    if (warning.code === 'script_context_deprecated' && warning.filename?.endsWith('.svx')) return;
    handler(warning);
  },
  preprocess: [
    mdsvex({
      remarkPlugins: isProduction ? [remarkDocsLinks] : [],
      highlight: {
        highlighter: (code, lang = 'text') => {
          const lightHtml = escapeSvelte(generateHtml(code, lang, 'github-light'));
          const darkHtml = escapeSvelte(generateHtml(code, lang, 'github-dark-high-contrast'));
          const encoded = encodeCopyValue(code);
          const copyButton = getCopyButtonHtml(encoded);
          return `{@html \`<div class="docs-code-block">${copyButton}<div class="docs-code-theme-light">${lightHtml}</div><div class="docs-code-theme-dark">${darkHtml}</div></div>\` }`;
        }
      }
    })
  ],
  extensions: ['.svelte', '.svx']
};

export default config;
