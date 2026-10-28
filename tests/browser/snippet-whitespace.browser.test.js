import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import { AesirSnippet } from '../../src/components/aesir-snippet/index.js';

test('shows the exact whitespace in a snippet value after a live update', async () => {
  const rendered = await render(AesirSnippet, { text: 'echo ready' });
  const code = page.getByRole('region', { name: 'Snippet value' }).element().querySelector('code');

  await rendered.rerender({ text: '  echo  ready  ' });

  expect(code.textContent).toBe('  echo  ready  ');
  expect(code.innerText).toBe('  echo  ready  ');
});
