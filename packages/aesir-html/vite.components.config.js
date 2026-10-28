import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { elementRoot, packageRoot, transformAesirHtml, useExternalIconRegistry } from './vite.shared.js';
import packageMetadata from './package.json' with { type: 'json' };

const registerModule = fileURLToPath(new URL('./src/register.js', import.meta.url));
const virtualPrefix = 'virtual:aesir-html-component/';
const resolvedVirtualPrefix = `\0${virtualPrefix}`;
const storeFacadeId = '\0virtual:aesir-html-svelte-store';
const runtimeEntryId = '\0virtual:aesir-html-runtime';
const runtimeImport = './runtime/aesir-runtime.min.js';
const runtimeSourceModules = ['svelte', 'svelte/attachments', 'svelte/easing', 'svelte/motion', 'svelte/reactivity', 'svelte/transition', 'svelte/store', 'svelte/internal/client'];
const availableRuntimeExports = new Set((await Promise.all(runtimeSourceModules.map((source) => import(source)))).flatMap((module) => Object.keys(module)).concat('storeDerived', 'storeGet'));

const tags = readdirSync(elementRoot)
  .filter((file) => file.endsWith('.svelte'))
  .map((file) => file.slice(0, -'.svelte'.length))
  .sort();

const inlineElements = new Set([
  'aesir-avatar',
  'aesir-badge',
  'aesir-button',
  'aesir-button-group',
  'aesir-checkbox',
  'aesir-dropdown',
  'aesir-icon',
  'aesir-icon-swap',
  'aesir-kbd',
  'aesir-loader',
  'aesir-pill',
  'aesir-popover',
  'aesir-quantity-stepper',
  'aesir-radio',
  'aesir-switch',
  'aesir-toggle',
  'aesir-tooltip'
]);
const contentsElements = new Set(['aesir-portal']);
const positionedElements = new Set([
  'aesir-autocomplete-box',
  'aesir-command-menu',
  'aesir-context-menu',
  'aesir-date-picker',
  'aesir-dialog',
  'aesir-drawer',
  'aesir-dropdown',
  'aesir-menubar',
  'aesir-popover',
  'aesir-toaster',
  'aesir-tooltip'
]);
const zIndexes = {
  'aesir-dropdown': '--aesir-overlay-z-popover',
  'aesir-popover': '--aesir-overlay-z-popover',
  'aesir-tooltip': '--aesir-overlay-z-tooltip',
  'aesir-dialog': '--aesir-overlay-z-dialog',
  'aesir-drawer': '--aesir-overlay-z-dialog',
  'aesir-command-menu': '--aesir-overlay-z-dialog',
  'aesir-toaster': '--aesir-overlay-z-toast'
};

const componentEntry = (selectedTag) => ({
  name: 'aesir-html-component-entries',
  enforce: 'pre',
  resolveId(source) {
    if (source === `${virtualPrefix}${selectedTag}`) return `${resolvedVirtualPrefix}${selectedTag}`;
  },
  load(id) {
    if (id !== `${resolvedVirtualPrefix}${selectedTag}`) return;
    const tag = selectedTag;
    const options = {
      display: contentsElements.has(tag) ? 'contents' : inlineElements.has(tag) ? 'inline-block' : 'block',
      ...(positionedElements.has(tag) ? { position: 'relative' } : {}),
      ...(zIndexes[tag] ? { zIndex: zIndexes[tag] } : {})
    };
    return `import ${JSON.stringify(`${elementRoot}${tag}.svelte`)};
      import { registerAesirComponent } from ${JSON.stringify(registerModule)};
      registerAesirComponent(${JSON.stringify(tag)}, ${JSON.stringify(options)});`;
  }
});

const externalSvelteRuntime = {
  name: 'aesir-html-external-svelte-runtime',
  enforce: 'pre',
  resolveId(source) {
    if (source === 'svelte/store') return storeFacadeId;
    if (source === storeFacadeId) return storeFacadeId;
    if (source === runtimeImport) return { id: runtimeImport, external: true };
    if (source === 'svelte' || source.startsWith('svelte/')) return { id: runtimeImport, external: true };
  },
  load(id) {
    if (id !== storeFacadeId) return;
    return `export { storeDerived as derived, fromStore, storeGet as get, readable, readonly, toStore, writable } from ${JSON.stringify(runtimeImport)};`;
  }
};

function collectRuntimeExports(requiredExports) {
  const runtimeSources = new Set([...runtimeSourceModules, runtimeImport]);
  return {
    name: 'aesir-html-collect-runtime-exports',
    enforce: 'post',
    transform(code, id) {
      const ast = this.parse(code);
      const namespaceImports = new Set();

      for (const node of ast.body) {
        if (!runtimeSources.has(node.source?.value)) continue;
        if (node.type === 'ImportDeclaration') {
          for (const specifier of node.specifiers) {
            if (specifier.type === 'ImportNamespaceSpecifier') namespaceImports.add(specifier.local.name);
            if (specifier.type === 'ImportSpecifier') requiredExports.add(specifier.imported.name ?? specifier.imported.value);
          }
        }
        if (node.type === 'ExportNamedDeclaration') {
          for (const specifier of node.specifiers) requiredExports.add(specifier.local.name ?? specifier.local.value);
        }
      }

      const visit = (node) => {
        if (!node || typeof node !== 'object') return;
        if (node.type === 'MemberExpression' && node.object.type === 'Identifier' && namespaceImports.has(node.object.name)) {
          const name = node.computed ? node.property.value : node.property.name;
          if (typeof name !== 'string') throw new Error(`Unsupported computed Svelte runtime access in ${id}`);
          requiredExports.add(name);
        }
        for (const value of Object.values(node)) {
          if (Array.isArray(value)) value.forEach(visit);
          else if (value && typeof value === 'object' && typeof value.type === 'string') visit(value);
        }
      };
      visit(ast);
    }
  };
}

export function createComponentConfig(tag, requiredRuntimeExports) {
  if (!tags.includes(tag)) throw new Error(`Unknown Aesir HTML component: ${tag}`);
  return defineConfig({
    configFile: false,
    root: packageRoot,
    logLevel: 'warn',
    define: { __AESIR_VERSION__: JSON.stringify(packageMetadata.version) },
    plugins: [
      useExternalIconRegistry,
      externalSvelteRuntime,
      componentEntry(tag),
      transformAesirHtml,
      svelte({
        emitCss: false,
        dynamicCompileOptions: ({ filename }) => ({ customElement: filename.startsWith(elementRoot) })
      }),
      collectRuntimeExports(requiredRuntimeExports)
    ],
    build: {
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      emptyOutDir: false,
      minify: 'esbuild',
      outDir: fileURLToPath(new URL('./dist/components/', import.meta.url)),
      rollupOptions: {
        input: `${virtualPrefix}${tag}`,
        output: {
          format: 'es',
          entryFileNames: `${tag}.min.js`,
          inlineDynamicImports: true
        }
      }
    }
  });
}

const exportSources = new Map();
for (const name of [
  'afterUpdate',
  'beforeUpdate',
  'createContext',
  'createEventDispatcher',
  'createRawSnippet',
  'flushSync',
  'fork',
  'getAbortSignal',
  'getAllContexts',
  'getContext',
  'hasContext',
  'hydratable',
  'hydrate',
  'mount',
  'onDestroy',
  'onMount',
  'setContext',
  'settled',
  'unmount'
])
  exportSources.set(name, 'svelte');
for (const name of ['createAttachmentKey', 'fromAction']) exportSources.set(name, 'svelte/attachments');
for (const name of [
  'backIn',
  'backInOut',
  'backOut',
  'bounceIn',
  'bounceInOut',
  'bounceOut',
  'circIn',
  'circInOut',
  'circOut',
  'cubicIn',
  'cubicInOut',
  'cubicOut',
  'elasticIn',
  'elasticInOut',
  'elasticOut',
  'expoIn',
  'expoInOut',
  'expoOut',
  'linear',
  'quadIn',
  'quadInOut',
  'quadOut',
  'quartIn',
  'quartInOut',
  'quartOut',
  'quintIn',
  'quintInOut',
  'quintOut',
  'sineIn',
  'sineInOut',
  'sineOut'
])
  exportSources.set(name, 'svelte/easing');
for (const name of ['Spring', 'Tween', 'prefersReducedMotion', 'spring', 'tweened']) exportSources.set(name, 'svelte/motion');
for (const name of ['MediaQuery', 'SvelteDate', 'SvelteMap', 'SvelteSet', 'SvelteURL', 'SvelteURLSearchParams', 'createSubscriber']) exportSources.set(name, 'svelte/reactivity');
for (const name of ['blur', 'crossfade', 'draw', 'fade', 'fly', 'scale', 'slide']) exportSources.set(name, 'svelte/transition');
for (const name of ['fromStore', 'readable', 'readonly', 'toStore', 'writable']) exportSources.set(name, 'svelte/store');

function runtimeSource(requiredExports) {
  const exportsBySource = new Map();
  const unavailableExports = [...requiredExports].filter((name) => !availableRuntimeExports.has(name));
  if (unavailableExports.length > 0) throw new Error(`Unable to provide Svelte runtime exports: ${unavailableExports.sort().join(', ')}`);

  for (const name of requiredExports) {
    if (name === 'storeDerived' || name === 'storeGet') continue;
    const source = exportSources.get(name) ?? 'svelte/internal/client';
    const names = exportsBySource.get(source) ?? [];
    names.push(name);
    exportsBySource.set(source, names);
  }
  const lines = [...exportsBySource].map(([source, names]) => `export { ${names.sort().join(', ')} } from ${JSON.stringify(source)};`);
  if (requiredExports.has('storeDerived')) lines.push(`export { derived as storeDerived } from 'svelte/store';`);
  if (requiredExports.has('storeGet')) lines.push(`export { get as storeGet } from 'svelte/store';`);
  return lines.join('\n');
}

export function createRuntimeConfig(requiredRuntimeExports) {
  return defineConfig({
    configFile: false,
    root: packageRoot,
    logLevel: 'warn',
    plugins: [
      transformAesirHtml,
      {
        name: 'aesir-html-runtime-entry',
        resolveId(source) {
          if (source === runtimeEntryId) return runtimeEntryId;
        },
        load(id) {
          if (id === runtimeEntryId) return runtimeSource(requiredRuntimeExports);
        }
      }
    ],
    build: {
      emptyOutDir: false,
      minify: 'esbuild',
      outDir: fileURLToPath(new URL('./dist/components/runtime/', import.meta.url)),
      rollupOptions: {
        input: runtimeEntryId,
        preserveEntrySignatures: 'strict',
        output: {
          format: 'es',
          entryFileNames: 'aesir-runtime.min.js',
          inlineDynamicImports: true
        }
      }
    }
  });
}
