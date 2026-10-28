import '../../dist/aesir-html.min.js';
import { expect, test, afterEach } from 'vitest';
import { mount } from './test-utils.js';

afterEach(() => document.body.replaceChildren());

test.each([
  ['xs', 24],
  ['sm', 32],
  ['md', 40],
  ['lg', 48],
  ['xl', 64],
  ['compact', 32],
  ['default', 48]
])('HTML table density %s gives header and rows a %ipx height', async (density, height) => {
  await mount(`<aesir-table density="${density}" selectable copyable columns='[{"key":"name","label":"Name","sortable":true}]' rows='[{"id":1,"name":"Alpha"},{"id":2,"name":"Beta"}]'></aesir-table>`);
  const table = document.querySelector('aesir-table');
  for (const row of table.shadowRoot.querySelectorAll('tr')) {
    expect(Math.abs(row.getBoundingClientRect().height - height)).toBeLessThanOrEqual(1);
  }
  table.density = 'xl';
  await new Promise((resolve) => requestAnimationFrame(resolve));
  for (const row of table.shadowRoot.querySelectorAll('tr')) {
    expect(Math.abs(row.getBoundingClientRect().height - 64)).toBeLessThanOrEqual(1);
  }
});
