import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';
import EmptyState from '../../src/components/aesir-empty-state/aesir-empty-state.svelte';
import { applyTheme } from './setup.js';

test('keeps an unbroken title and description inside a narrow empty state', async () => {
  applyTheme('light');
  await render(EmptyState, { title: 'UnbrokenWorkspaceIdentifier'.repeat(8), description: 'UnbrokenDocumentIdentifier'.repeat(8) });
  const root = document.querySelector('.aesir-empty-state');
  root.style.width = '220px';

  expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  expect(root.querySelector('.aesir-empty-state__copy').scrollWidth).toBeLessThanOrEqual(root.querySelector('.aesir-empty-state__copy').clientWidth);
});
