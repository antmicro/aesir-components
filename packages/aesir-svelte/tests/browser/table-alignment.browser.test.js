import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { describe, expect, test } from 'vitest';
import { AesirTable } from '../../src/index.js';

describe('table column alignment', () => {
  test('applies the documented start and end column alignment', async () => {
    await render(AesirTable, {
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status', align: 'start' },
        { key: 'amount', label: 'Amount', align: 'end' }
      ],
      rows: [{ id: 1, name: 'Alpha', status: 'Ready', amount: '42' }]
    });

    const nameHeading = page.getByRole('columnheader', { name: 'Name' }).element();
    const statusHeading = page.getByRole('columnheader', { name: 'Status' }).element();
    const amountHeading = page.getByRole('columnheader', { name: 'Amount' }).element();
    const nameCell = page.getByRole('cell', { name: 'Alpha' }).element();
    const statusCell = page.getByRole('cell', { name: 'Ready' }).element();
    const amountCell = page.getByRole('cell', { name: '42' }).element();

    for (const element of [nameHeading, nameCell, statusHeading, statusCell]) expect(getComputedStyle(element).textAlign).toBe('left');
    for (const element of [amountHeading, amountCell]) expect(getComputedStyle(element).textAlign).toBe('right');
  });

  test('keeps the selected background visible on even striped rows', async () => {
    await render(AesirTable, {
      variant: 'striped',
      selectable: true,
      selected: [2],
      style: '--ds-accent-surface: rgb(10, 20, 30); --ds-accent-surface-hover: rgb(20, 30, 40); --ds-background-secondary: rgb(40, 50, 60); --ds-surface-hover: rgb(50, 60, 70);',
      columns: [{ key: 'name', label: 'Name' }],
      rows: [
        { id: 1, name: 'First' },
        { id: 2, name: 'Selected' },
        { id: 3, name: 'Third' }
      ]
    });

    const selectedRow = page.getByRole('row', { name: /Selected/ }).element();
    expect(selectedRow.hasAttribute('data-selected')).toBe(true);
    expect(getComputedStyle(selectedRow).backgroundColor).toBe('rgb(10, 20, 30)');

    await page.getByRole('row', { name: /Selected/ }).hover();
    expect(getComputedStyle(selectedRow).backgroundColor).toBe('rgb(20, 30, 40)');
  });

  test('keeps selected minimal rows visible while hovered', async () => {
    await render(AesirTable, {
      variant: 'minimal',
      selectable: true,
      selected: [1],
      style: '--ds-accent-surface: rgb(10, 20, 30); --ds-accent-surface-hover: rgb(20, 30, 40); --ds-surface: rgb(50, 60, 70);',
      columns: [{ key: 'name', label: 'Name' }],
      rows: [{ id: 1, name: 'Selected minimal' }]
    });

    const selectedRow = page.getByRole('row', { name: /Selected minimal/ }).element();
    expect(getComputedStyle(selectedRow).backgroundColor).toBe('rgb(10, 20, 30)');
    await page.getByRole('row', { name: /Selected minimal/ }).hover();
    expect(getComputedStyle(selectedRow).backgroundColor).toBe('rgb(20, 30, 40)');
  });
});
