import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test, vi } from 'vitest';
import AesirTable from '../../src/components/aesir-table/aesir-table.svelte';
import { applyTheme } from './setup.js';

const columns = [
  { key: 'metric', label: 'Metric', sortable: true, width: '60%' },
  { key: 'value', label: 'Value', align: 'end', width: '40%' }
];
const sections = [
  {
    id: 'synthesis',
    label: 'Synthesis',
    sections: [
      {
        id: 'module',
        label: 'Modules',
        rows: [
          { metric: 'Wires', value: '250' },
          { metric: 'Cells', value: '248' }
        ]
      },
      { id: 'design', label: 'Design', rows: [{ metric: 'Area', value: '4736.72' }] }
    ]
  }
];

test.each(['light', 'dark'])('section headers span every column and all groups stay aligned in %s', async (theme) => {
  applyTheme(theme);
  const { container } = await render(AesirTable, { columns, sections, selectable: true, copyable: true, layout: 'fixed', variant: 'striped', density: 'md' });
  expect(container.querySelectorAll('table')).toHaveLength(1);
  expect([...container.querySelectorAll('th[scope="rowgroup"]')].map((cell) => [cell.textContent.trim(), cell.colSpan])).toEqual([
    ['Synthesis', 4],
    ['Modules', 4],
    ['Design', 4]
  ]);
  expect(container.querySelectorAll('tbody input[type="checkbox"]')).toHaveLength(3);
  expect(container.querySelectorAll('.aesir-table__copy')).toHaveLength(3);
  const headings = [...container.querySelectorAll('thead th')];
  for (const row of container.querySelectorAll('tbody tr:not(.aesir-table__section)')) {
    for (const [index, cell] of [...row.children].entries()) {
      expect(Math.abs(cell.getBoundingClientRect().x - headings[index].getBoundingClientRect().x)).toBeLessThan(1);
    }
  }
  const groups = [...container.querySelectorAll('tbody')];
  expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual(['Synthesis', 'Synthesis / Modules', 'Synthesis / Design']);
  expect(groups[1].querySelectorAll('[data-striped]')).toHaveLength(1);
  expect(groups[2].querySelectorAll('[data-striped]')).toHaveLength(0);
  expect(getComputedStyle(groups[1].lastElementChild.firstElementChild).borderBottomWidth).toBe('1px');
  expect(getComputedStyle(groups[2].lastElementChild.firstElementChild).borderBottomWidth).toBe('0px');
});

test('selection uses unique flattened fallback indices and sorting stays controlled', async () => {
  const onselectionchange = vi.fn();
  const onsortchange = vi.fn();
  const { container } = await render(AesirTable, { columns, sections, selectable: true, rows: [{ metric: 'Ignored flat row' }], onselectionchange, onsortchange });
  expect(container.textContent).not.toContain('Ignored flat row');
  await page.elementLocator(page.getByRole('checkbox', { name: 'Select all rows on this page' }).element().closest('label')).click();
  expect(onselectionchange).toHaveBeenLastCalledWith([0, 1, 2]);
  expect(container.querySelectorAll('tbody tr[data-selected]')).toHaveLength(3);
  await page.elementLocator(page.getByRole('checkbox', { name: 'Select row: Area' }).element().closest('label')).click();
  expect(onselectionchange).toHaveBeenLastCalledWith([0, 1]);
  await page.getByRole('button', { name: 'Metric', exact: true }).click();
  expect(onsortchange).toHaveBeenLastCalledWith({ key: 'metric', direction: 'ascending' });
  expect([...container.querySelectorAll('tbody tr:not(.aesir-table__section)')].map((row) => row.children[1].textContent.trim())).toEqual(['Wires', 'Cells', 'Area']);
});

test('sections and column spans update reactively and empty sections preserve the flat API', async () => {
  const rendered = await render(AesirTable, { columns, sections });
  await rendered.rerender({ columns: [...columns, { key: 'change', label: 'Change' }], sections, copyable: true });
  expect([...rendered.container.querySelectorAll('th[scope="rowgroup"]')].every((cell) => cell.colSpan === 4)).toBe(true);
  await rendered.rerender({ columns, sections: [], rows: [{ id: 'flat', metric: 'Flat row', value: '3' }] });
  expect(rendered.container.querySelectorAll('th[scope="rowgroup"]')).toHaveLength(0);
  expect(rendered.container.querySelectorAll('tbody tr')).toHaveLength(1);
  expect(rendered.container.textContent).toContain('Flat row');
});
