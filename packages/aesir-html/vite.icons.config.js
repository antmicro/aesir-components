import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { readdir, readFile } from 'node:fs/promises';
import { basename } from 'node:path';

const packageRoot = fileURLToPath(new URL('.', import.meta.url));
const lucideIconsDirectory = fileURLToPath(new URL('../../node_modules/@lucide/svelte/dist/icons/', import.meta.url));
const virtualModuleId = 'virtual:aesir-lucide-icon-nodes';
const resolvedVirtualModuleId = `\0${virtualModuleId}`;

const lucideIconNodes = {
  name: 'aesir-lucide-icon-nodes',
  resolveId(source) {
    if (source === virtualModuleId) return resolvedVirtualModuleId;
  },
  async load(id) {
    if (id !== resolvedVirtualModuleId) return;
    const files = (await readdir(lucideIconsDirectory)).filter((file) => file.endsWith('.svelte'));
    const entries = await Promise.all(
      files.map(async (file) => {
        const source = await readFile(`${lucideIconsDirectory}${file}`, 'utf8');
        const iconDataMatch = source.match(/const iconData = (\{[^\n]+\});/);
        const legacyIconNodeMatch = source.match(/const iconNode = (\[[^;]+\]);/);
        const iconNode = iconDataMatch ? JSON.stringify(JSON.parse(iconDataMatch[1]).node) : legacyIconNodeMatch?.[1];
        if (!iconNode) throw new Error(`Could not extract icon node from ${file}`);
        return `${JSON.stringify(basename(file, '.svelte'))}:${iconNode}`;
      })
    );
    return `export default {${entries.join(',')}};`;
  }
};

export default defineConfig({
  root: packageRoot,
  plugins: [lucideIconNodes],
  build: {
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    emptyOutDir: false,
    lib: {
      entry: fileURLToPath(new URL('./src/icons.js', import.meta.url)),
      formats: ['es'],
      fileName: () => 'aesir-icons.min.js'
    },
    minify: 'esbuild',
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
