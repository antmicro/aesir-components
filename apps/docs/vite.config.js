import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import { readFile } from 'node:fs/promises';
import { load as parseYaml } from 'js-yaml';
import { createDocsHighlighter } from '../../tools/docs/highlighter.js';
import { htmlExampleWithStyles, trimExampleSource } from '../../tools/docs/example-source.mjs';

const highlightCode = await createDocsHighlighter();
const docsExamplePrefix = '\0docs-example:';
const docsHighlightPrefix = '\0docs-highlight:';
const yamlData = () => ({
  name: 'yaml-data',
  enforce: 'pre',
  transform(source, id) {
    if (!id.endsWith('.yml')) return null;
    return { code: `export default ${JSON.stringify(parseYaml(source))};`, map: null };
  }
});
const svelteRuntimeChunk = (id) => {
  const normalizedId = id.replaceAll('\\', '/');
  if (normalizedId.includes('/node_modules/svelte/')) return 'svelte-runtime';
};

const docsExampleSource = () => ({
  name: 'docs-example-source',
  enforce: 'pre',
  async resolveId(source, importer) {
    if (source.endsWith('?highlight')) {
      const request = source.slice(0, -'?highlight'.length);
      const resolved = await this.resolve(request, importer, { skipSelf: true });
      return resolved ? `${docsHighlightPrefix}${resolved.id}.js` : null;
    }
    if (!source.endsWith('?example')) return null;

    const request = source.slice(0, -'?example'.length);
    const resolved = await this.resolve(request, importer, { skipSelf: true });
    return resolved ? `${docsExamplePrefix}${resolved.id}.js` : null;
  },
  async load(id) {
    if (id.startsWith(docsHighlightPrefix)) {
      const filename = id.slice(docsHighlightPrefix.length, -'.js'.length);
      this.addWatchFile(filename);
      const code = trimExampleSource(await readFile(filename, 'utf8'));
      const language = filename.endsWith('.ts') ? 'typescript' : 'javascript';
      return `export default ${JSON.stringify({
        code,
        lightLines: highlightCode.lines(code, language, 'github-light'),
        darkLines: highlightCode.lines(code, language, 'github-dark-high-contrast')
      })};`;
    }
    if (!id.startsWith(docsExamplePrefix)) return null;

    const filename = id.slice(docsExamplePrefix.length, -'.js'.length);
    this.addWatchFile(filename);
    const rawCode = await readFile(filename, 'utf8');
    const language = filename.endsWith('.html') ? 'html' : 'svelte';
    let code = trimExampleSource(rawCode);
    let htmlSource;

    if (filename.endsWith('.svelte')) {
      const htmlFilename = filename.replace(/\.svelte$/, '.html');
      try {
        const htmlCode = htmlExampleWithStyles(await readFile(htmlFilename, 'utf8'), rawCode);
        this.addWatchFile(htmlFilename);
        htmlSource = {
          code: htmlCode,
          lightHtml: highlightCode(htmlCode, 'html', 'github-light'),
          darkHtml: highlightCode(htmlCode, 'html', 'github-dark-high-contrast')
        };
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
    } else if (filename.endsWith('.html')) {
      const svelteFilename = filename.replace(/\.html$/, '.svelte');
      try {
        const svelteCode = await readFile(svelteFilename, 'utf8');
        this.addWatchFile(svelteFilename);
        code = htmlExampleWithStyles(rawCode, svelteCode);
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
    }

    return `export default ${JSON.stringify({
      code,
      lightHtml: highlightCode(code, language, 'github-light'),
      darkHtml: highlightCode(code, language, 'github-dark-high-contrast'),
      htmlSource
    })};`;
  }
});

export default defineConfig({
  plugins: [yamlData(), docsExampleSource(), sveltekit(), devtoolsJson()],
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(import.meta.dirname)]
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: svelteRuntimeChunk
      }
    }
  }
});
