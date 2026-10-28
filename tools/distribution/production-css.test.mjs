import assert from 'node:assert/strict';
import test from 'node:test';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { build } from 'vite';

test('a production consumer retains the status bar layout and segment styles', async () => {
  const entry = '\0aesir-status-bar-production-check';
  const bundle = await build({
    configFile: false,
    logLevel: 'error',
    plugins: [
      {
        name: 'status-bar-production-consumer',
        resolveId: (id) => (id === entry ? entry : undefined),
        load: (id) =>
          id === entry
            ? `import { mount } from 'svelte';
               import { AesirStatusBar } from '@aesir/svelte';
               mount(AesirStatusBar, { target: document.body, props: { total: 90 } });`
            : undefined
      },
      svelte()
    ],
    build: {
      write: false,
      rollupOptions: { input: entry }
    }
  });
  const css = bundle.output
    .filter((output) => output.type === 'asset' && output.fileName.endsWith('.css'))
    .map((output) => String(output.source))
    .join('\n');

  for (const selector of ['.aesir-status-bar__segments', '.aesir-status-bar__item', '.aesir-status-bar__segment:before']) {
    assert.ok(css.includes(selector), `Production CSS is missing ${selector}`);
  }
});
