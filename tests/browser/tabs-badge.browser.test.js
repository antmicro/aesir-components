import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import Tabs from '../../src/components/aesir-tabs/aesir-tabs.svelte';
import { applyTheme } from './setup.js';

const items = [
  { value: 'requirements', label: 'Requirements', content: 'Requirement list' },
  { value: 'text', label: 'Text', content: 'Specification text' },
  { value: 'archived', label: 'Archived', disabled: true }
];

test.each(['default', 'sm'])('badge tabs keep their size while switching views (%s)', async (size) => {
  applyTheme('light');
  const rendered = await render(Tabs, { items, variant: 'badge', size, label: 'Specification views' });
  rendered.container.style.width = '320px';
  await document.fonts.ready;
  const requirements = page.getByRole('tab', { name: 'Requirements' });
  const text = page.getByRole('tab', { name: 'Text', exact: true });
  const list = page.getByRole('tablist', { name: 'Specification views' }).element();
  const originalSize = { width: requirements.element().offsetWidth, height: requirements.element().offsetHeight };
  const selectedStyle = getComputedStyle(requirements.element());
  const activeAppearance = { border: selectedStyle.borderTopColor, background: selectedStyle.backgroundColor };

  expect(originalSize.height).toBeGreaterThanOrEqual(size === 'sm' ? 32 : 36);
  expect(parseFloat(selectedStyle.borderTopLeftRadius)).toBeGreaterThanOrEqual(originalSize.height / 2);
  expect(getComputedStyle(list).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(list.querySelector('.aesir-tabs__indicator').getBoundingClientRect().width).toBe(0);

  await text.click();
  await expect.element(text).toHaveAttribute('aria-selected', 'true');
  await expect.element(page.getByRole('tabpanel', { name: 'Text', exact: true })).toHaveTextContent('Specification text');
  expect(requirements.element().offsetWidth).toBe(originalSize.width);
  expect(requirements.element().offsetHeight).toBe(originalSize.height);
  await expect.poll(() => getComputedStyle(text.element()).borderTopColor).toBe(activeAppearance.border);
  await expect.poll(() => getComputedStyle(text.element()).backgroundColor).toBe(activeAppearance.background);

  page.getByRole('tab', { name: 'Archived' }).element().click();
  await expect.element(text).toHaveAttribute('aria-selected', 'true');
  expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
});

test('switching out of badge tabs restores the indicator at the selected tab', async () => {
  applyTheme('dark');
  const props = { items, value: 'text', label: 'Specification views' };
  const rendered = await render(Tabs, { ...props, variant: 'badge' });
  await document.fonts.ready;
  const text = page.getByRole('tab', { name: 'Text', exact: true });
  const list = page.getByRole('tablist', { name: 'Specification views' }).element();
  const indicator = list.querySelector('.aesir-tabs__indicator');

  for (const variant of ['line', 'default']) {
    await rendered.rerender({ ...props, variant });
    await expect.element(text).toHaveAttribute('aria-selected', 'true');
    await expect.poll(() => indicator.getBoundingClientRect().width).toBeCloseTo(text.element().getBoundingClientRect().width, 1);
    expect(indicator.getBoundingClientRect().left).toBeCloseTo(text.element().getBoundingClientRect().left, 1);
  }

  await rendered.rerender({ ...props, variant: 'badge', width: 'full' });
  expect(indicator.getBoundingClientRect().width).toBe(0);
  const requirementsWidth = page.getByRole('tab', { name: 'Requirements' }).element().getBoundingClientRect().width;
  expect(text.element().getBoundingClientRect().width).toBeCloseTo(requirementsWidth, 1);
});
