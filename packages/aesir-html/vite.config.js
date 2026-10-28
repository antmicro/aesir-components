import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { aesirHtmlCoreCss, elementRoot, packageRoot, transformAesirHtml, useExternalIconRegistry } from './vite.shared.js';
import packageMetadata from './package.json' with { type: 'json' };

const typographySource = fileURLToPath(import.meta.resolve('@aesir/css/aesir-typography.css'));
const typographyOutput = fileURLToPath(new URL('./dist/aesir-typography.css', import.meta.url));
const fontOutputDirectory = fileURLToPath(new URL('./dist/fonts/', import.meta.url));
const thirdPartyNoticesSource = fileURLToPath(new URL('../../THIRD_PARTY_NOTICES.md', import.meta.url));
const globalCssSource = fileURLToPath(import.meta.resolve('@aesir/css/aesir-global.css'));
const motionCssSource = fileURLToPath(import.meta.resolve('@aesir/css/aesir-motion.css'));
const copyOptionalTypography = {
  name: 'copy-aesir-typography',
  closeBundle() {
    copyFileSync(typographySource, typographyOutput);
    mkdirSync(fontOutputDirectory, { recursive: true });
    copyFileSync(thirdPartyNoticesSource, fileURLToPath(new URL('./dist/THIRD_PARTY_NOTICES.md', import.meta.url)));
    copyFileSync(fileURLToPath(import.meta.resolve('@aesir/css/fonts/Inter.woff2')), resolve(fontOutputDirectory, 'Inter.woff2'));
    copyFileSync(fileURLToPath(import.meta.resolve('@aesir/css/fonts/Mono.woff2')), resolve(fontOutputDirectory, 'Mono.woff2'));
    writeFileSync(
      fileURLToPath(new URL('./dist/aesir-fonts.css', import.meta.url)),
      `@font-face { font-family: 'Inter'; src: local('Inter'), local('Inter Regular'), url('./fonts/Inter.woff2') format('woff2'); font-weight: 100 900; font-style: normal; font-display: swap; }\n@font-face { font-family: 'Geist Mono'; src: local('Geist Mono'), local('GeistMono-Regular'), url('./fonts/Mono.woff2') format('woff2'); font-weight: 400 500; font-style: normal; font-display: swap; }\n`
    );
    const globalCss = readFileSync(globalCssSource, 'utf8').replaceAll(/@font-face\s*\{[^}]+\}\s*/gs, '');
    const motionCss = readFileSync(motionCssSource, 'utf8');
    writeFileSync(
      fileURLToPath(new URL('./dist/aesir-core.css', import.meta.url)),
      `${globalCss}\n${motionCss}\n:root {\n  --aesir-overlay-z-popover: 50;\n  --aesir-overlay-z-dialog: 70;\n  --aesir-overlay-z-tooltip: 80;\n  --aesir-overlay-z-toast: 90;\n}\n`
    );
  }
};

export default defineConfig({
  root: packageRoot,
  define: { __AESIR_VERSION__: JSON.stringify(packageMetadata.version) },
  plugins: [
    useExternalIconRegistry,
    aesirHtmlCoreCss,
    copyOptionalTypography,
    transformAesirHtml,
    svelte({
      emitCss: false,
      dynamicCompileOptions: ({ filename }) => ({ customElement: filename.startsWith(elementRoot) })
    })
  ],
  build: {
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    emptyOutDir: true,
    lib: {
      entry: fileURLToPath(new URL('./src/index.js', import.meta.url)),
      formats: ['es'],
      fileName: () => 'aesir-html.min.js'
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
