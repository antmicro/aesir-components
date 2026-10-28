import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { AesirTable } from '../src/components/aesir-table/index.js';

test('renders a configured link inside a row header', () => {
  render(AesirTable, {
    columns: [{ key: 'name', label: 'Project', rowHeader: true, linkKey: 'url' }],
    rows: [{ id: 1, name: 'Alpha', url: '/projects/alpha' }]
  });

  const rowHeader = screen.getByRole('rowheader', { name: 'Alpha' });
  expect(within(rowHeader).getByRole('link', { name: 'Alpha' }).getAttribute('href')).toBe('/projects/alpha');
});

test('exposes accessible controlled sorting without mutating the supplied rows', async () => {
  const user = userEvent.setup();
  const onsortchange = vi.fn();
  const rows = [
    { id: 2, name: 'Zeta' },
    { id: 1, name: 'Alpha' }
  ];
  const { container } = render(AesirTable, { columns: [{ key: 'name', label: 'Name', sortable: true, rowHeader: true, width: '12rem' }], rows, caption: 'Projects', layout: 'fixed', onsortchange });

  const header = screen.getByRole('columnheader', { name: 'Name' });
  const button = within(header).getByRole('button');
  const sortIcon = button.querySelector('.aesir-table__sort-icon');
  expect(container.querySelector('colgroup col')?.getAttribute('style')).toContain('12rem');
  expect(sortIcon?.hasAttribute('data-active')).toBe(false);
  expect(header.getAttribute('aria-sort')).toBe('none');
  await user.click(button);
  expect(sortIcon?.hasAttribute('data-active')).toBe(true);
  expect(header.getAttribute('aria-sort')).toBe('ascending');
  expect(onsortchange).toHaveBeenLastCalledWith({ key: 'name', direction: 'ascending' });
  await user.click(button);
  expect(header.getAttribute('aria-sort')).toBe('descending');
  expect(onsortchange).toHaveBeenLastCalledWith({ key: 'name', direction: 'descending' });
  expect(rows.map((row) => row.name)).toEqual(['Zeta', 'Alpha']);
});

test('does not select an empty page and enables selection when rows arrive', async () => {
  const user = userEvent.setup();
  const onselectionchange = vi.fn();
  const columns = [{ key: 'name', label: 'Name' }];
  const { rerender } = render(AesirTable, { columns, rows: [], selectable: true, onselectionchange });
  const selectAll = screen.getByRole('checkbox', { name: 'Select all rows on this page' });

  expect(selectAll.disabled).toBe(true);
  await user.click(selectAll);
  expect(selectAll.checked).toBe(false);
  expect(onselectionchange).not.toHaveBeenCalled();

  await rerender({ columns, rows: [{ id: 1, name: 'Alpha' }], selectable: true, onselectionchange });
  expect(selectAll.disabled).toBe(false);
  await user.click(selectAll);
  expect(onselectionchange).toHaveBeenLastCalledWith([1]);
});

test('does not mark changed row content as copied when only its key stays the same', async () => {
  const user = userEvent.setup();
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const columns = [{ key: 'code', label: 'Code' }];
  const { rerender } = render(AesirTable, { columns, rows: [{ id: 1, code: 'ALPHA' }], copyable: true, copyColumn: 'code' });

  await user.click(screen.getByRole('button', { name: 'Copy value: ALPHA' }));
  expect(writeText).toHaveBeenCalledWith('ALPHA');
  expect(screen.getByRole('button', { name: 'Copy value: ALPHA' }).dataset.copied).toBe('true');

  await rerender({ columns, rows: [{ id: 1, code: 'BETA' }], copyable: true, copyColumn: 'code' });
  const changedCopyButton = screen.getByRole('button', { name: 'Copy value: BETA' });
  expect(changedCopyButton.hasAttribute('data-copied')).toBe(false);
  expect(changedCopyButton.getAttribute('title')).toBe('Copy value');
});
