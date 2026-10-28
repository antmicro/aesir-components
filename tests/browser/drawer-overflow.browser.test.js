import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import DrawerOverflowFixture from '../fixtures/drawer-overflow-fixture.svelte';

test('keeps long drawer content scrollable inside the viewport', async () => {
  await render(DrawerOverflowFixture);
  await expect.element(page.getByRole('dialog', { name: 'Long drawer' })).toBeInTheDocument();

  const body = document.querySelector('.aesir-drawer__body');
  expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
  expect(getComputedStyle(body).overflowY).toBe('auto');
  expect(body.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
});
