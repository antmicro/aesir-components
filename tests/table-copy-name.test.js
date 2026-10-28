import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { AesirTable } from '../src/components/aesir-table/index.js';

test('names the value that its copy button actually copies', async () => {
  const user = userEvent.setup();
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const { rerender } = render(AesirTable, {
    columns: [{ key: 'slug', displayKey: 'name', label: 'Project' }],
    rows: [{ id: 1, slug: 'project-one', name: 'Project One' }],
    copyable: true,
    copyColumn: 'slug'
  });

  await user.click(screen.getByRole('button', { name: 'Copy value: project-one' }));
  expect(writeText).toHaveBeenLastCalledWith('project-one');

  await rerender({
    columns: [{ key: 'slug', displayKey: 'name', label: 'Project' }],
    rows: [{ id: 1, slug: 'project-one', name: 'Project One' }],
    copyable: true,
    copyColumn: 'slug',
    getCopyValue: (row) => row.id
  });

  await user.click(screen.getByRole('button', { name: 'Copy value: 1' }));
  expect(writeText).toHaveBeenLastCalledWith('1');
});
