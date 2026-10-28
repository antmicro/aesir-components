import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import { AesirTable } from '../src/components/aesir-table/index.js';

test('row selection names follow the displayed first-column value as rows change', async () => {
  const columns = [{ key: 'slug', displayKey: 'name', label: 'Project', rowHeader: true }];
  const { rerender } = render(AesirTable, {
    columns,
    rows: [{ id: 1, slug: 'project-one', name: 'Project One' }],
    selectable: true
  });

  expect(screen.getByRole('rowheader', { name: 'Project One' })).toBeTruthy();
  expect(screen.getByRole('checkbox', { name: 'Select row: Project One' })).toBeTruthy();

  await rerender({
    columns,
    rows: [{ id: 1, slug: 'project-one', name: 'Updated project' }],
    selectable: true
  });

  expect(screen.getByRole('checkbox', { name: 'Select row: Updated project' })).toBeTruthy();

  await rerender({
    columns: [{ key: 'slug', label: 'Slug' }],
    rows: [{ id: 1, slug: 'project-one', name: 'Updated project' }],
    selectable: true
  });

  expect(screen.getByRole('checkbox', { name: 'Select row: project-one' })).toBeTruthy();
});
