import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import TooltipFixture from '../fixtures/tooltip-fixture.svelte';
import { applyTheme } from './setup.js';

test.each([
  { content: 'Preview', anchorStyle: '' },
  { content: 'Copy URL', anchorStyle: '' },
  { content: 'Preview', anchorStyle: 'position: fixed; right: 8px; top: 80px;' },
  { content: 'Copy URL', anchorStyle: 'position: fixed; right: 8px; top: 80px;' }
])('keeps "$content" on one line (anchor: $anchorStyle)', async ({ content, anchorStyle }) => {
  applyTheme('light');
  await render(TooltipFixture, { content, anchorStyle });

  await page.getByRole('button', { name: 'Copy' }).hover();
  const tooltip = page.getByRole('tooltip');
  await expect.element(tooltip).toHaveAttribute('data-positioned');

  await expect
    .poll(() => {
      const range = document.createRange();
      range.selectNodeContents(tooltip.element());
      return range.getClientRects().length;
    })
    .toBe(1);

  const rect = tooltip.element().getBoundingClientRect();
  expect(rect.left).toBeGreaterThanOrEqual(7);
  expect(rect.right).toBeLessThanOrEqual(window.innerWidth - 7);
});

test('contains a long unbroken tooltip message within its bubble', async () => {
  applyTheme('light');
  await render(TooltipFixture, { content: 'UnbrokenTooltipMessage'.repeat(10) });

  await page.getByRole('button', { name: 'Copy' }).hover();
  const tooltip = page.getByRole('tooltip');
  await expect.element(tooltip).toBeVisible();

  const bubble = tooltip.element();
  expect(bubble.scrollWidth).toBeLessThanOrEqual(bubble.clientWidth);
  const range = document.createRange();
  range.selectNodeContents(bubble);
  expect(range.getClientRects().length).toBeGreaterThan(1);
});
