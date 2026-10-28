import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import AesirTable from '../../src/components/aesir-table/aesir-table.svelte';
import { applyTheme } from './setup.js';

const columns = [{ key: 'name', label: 'Name', rowHeader: true, sortable: true }];
const rows = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' }
];
const sizes = [
  ['xs', 24],
  ['sm', 32],
  ['md', 40],
  ['lg', 48],
  ['xl', 64],
  ['compact', 32],
  ['default', 48],
  [undefined, 48]
];

test.each(sizes)('density %s gives header and body rows a %ipx minimum height, including controls', async (density, height) => {
  applyTheme('light');
  const { container } = await render(AesirTable, { columns, rows, density, selectable: true, copyable: true });
  for (const row of container.querySelectorAll('tr')) {
    expect(Math.abs(row.getBoundingClientRect().height - height)).toBeLessThanOrEqual(1);
  }
  await page.elementLocator(page.getByRole('checkbox', { name: 'Select all rows on this page' }).element().closest('label')).click();
  await expect.element(page.getByRole('checkbox', { name: 'Select row: Alpha' })).toBeChecked();
  await page.getByRole('button', { name: 'Name', exact: true }).click();
  await expect.element(page.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'ascending');
});

test.each([
  ['default', 'lg'],
  ['compact', 'sm']
])('%s renders identically to its %s alias', async (legacy, size) => {
  applyTheme('light');
  const props = { columns, rows, selectable: true, copyable: true };
  const rendered = await render(AesirTable, { ...props, density: legacy });
  const measure = () =>
    [...rendered.container.querySelectorAll('th, td, .aesir-table__copy')].map((cell) => {
      const style = getComputedStyle(cell);
      return [cell.getBoundingClientRect().height, style.padding, style.fontSize, style.lineHeight];
    });
  const before = measure();
  await rendered.rerender({ ...props, density: size });
  expect(measure()).toEqual(before);
});

test('tall content expands a dense row instead of being clipped', async () => {
  applyTheme('light');
  const { container } = await render(AesirTable, { columns, rows, density: 'xs' });
  const cell = container.querySelector('tbody th');
  const content = document.createElement('div');
  content.style.height = '100px';
  content.textContent = 'Tall content';
  cell.append(content);
  expect(cell.getBoundingClientRect().height).toBeGreaterThanOrEqual(100);
});
