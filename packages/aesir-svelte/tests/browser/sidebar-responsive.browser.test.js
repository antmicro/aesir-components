import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test, vi } from 'vitest';
import Sidebar from '../../src/components/aesir-sidebar/aesir-sidebar.svelte';

test('a collapsed desktop sidebar fills the mobile header after the viewport narrows', async () => {
  await page.viewport(1200, 700);
  await render(Sidebar, { items: [], mode: 'responsive', collapsible: true, collapsed: true });
  const sidebar = document.querySelector('.aesir-sidebar');
  expect(sidebar.getBoundingClientRect().width).toBe(0);

  await page.viewport(800, 700);
  await vi.waitFor(() => {
    expect(sidebar.getBoundingClientRect().width).toBeGreaterThan(0);
    expect(sidebar.getBoundingClientRect().width).toBeCloseTo(sidebar.parentElement.getBoundingClientRect().width, 0);
  });
});
