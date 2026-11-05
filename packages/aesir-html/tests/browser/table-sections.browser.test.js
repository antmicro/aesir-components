import '../../dist/aesir-html.min.js';
import { expect, test, afterEach } from 'vitest';
import { mount } from './test-utils.js';

afterEach(() => document.body.replaceChildren());

const columns = [
  { key: 'metric', label: 'Metric', sortable: true },
  { key: 'value', label: 'Value', align: 'end' }
];
const sections = [
  {
    label: 'Synthesis',
    sections: [
      { label: 'Modules', rows: [{ metric: 'Wires', value: '250' }] },
      { label: 'Design', rows: [{ metric: 'Area', value: '4736.72' }] }
    ]
  }
];

test('vanilla accepts nested sections as JSON and selects only data rows', async () => {
  await mount(`<aesir-table selectable copyable columns='${JSON.stringify(columns)}' sections='${JSON.stringify(sections)}'></aesir-table>`);
  const table = document.querySelector('aesir-table');
  const root = table.shadowRoot;
  expect(root.querySelectorAll('table')).toHaveLength(1);
  expect([...root.querySelectorAll('th[scope="rowgroup"]')].map((cell) => cell.colSpan)).toEqual([4, 4, 4]);
  expect(root.querySelectorAll('tbody input[type="checkbox"]')).toHaveLength(2);
  const selected = [];
  table.addEventListener('selectionchange', (event) => selected.push(event.detail.value));
  root.querySelector('thead input[type="checkbox"]').click();
  await expect.poll(() => selected.at(-1)).toEqual([0, 1]);
  await expect.poll(() => root.querySelectorAll('tbody tr[data-selected]').length).toBe(2);
});

test('vanilla updates sections through the property and emits controlled sort requests', async () => {
  await mount('<aesir-table></aesir-table>');
  const table = document.querySelector('aesir-table');
  table.columns = columns;
  table.sections = sections;
  await expect.poll(() => table.shadowRoot.querySelectorAll('th[scope="rowgroup"]').length).toBe(3);
  const requests = [];
  table.addEventListener('sortchange', (event) => requests.push(event.detail));
  table.shadowRoot.querySelector('.aesir-table__sort').click();
  await expect.poll(() => requests.at(-1)).toEqual({ key: 'metric', direction: 'ascending' });
  table.sections = [{ id: 'new', label: 'Updated', rows: [{ id: 'ports', metric: 'Ports', value: '3' }] }];
  await expect.poll(() => table.shadowRoot.querySelector('th[scope="rowgroup"]').textContent.trim()).toBe('Updated');
  expect(table.shadowRoot.textContent).not.toContain('Wires');
  table.sections = [];
  table.rows = [{ id: 'flat', metric: 'Flat row', value: '2' }];
  await expect.poll(() => table.shadowRoot.querySelectorAll('th[scope="rowgroup"]').length).toBe(0);
  expect(table.shadowRoot.textContent).toContain('Flat row');
});
