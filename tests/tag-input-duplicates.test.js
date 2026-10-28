import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import TagInput from '../src/components/aesir-tag-input/aesir-tag-input.svelte';

test('does not offer options whose labels duplicate an already selected tag', async () => {
  const user = userEvent.setup();
  render(TagInput, {
    label: 'Topics',
    options: [
      { label: 'Alpha', value: 'a' },
      { label: 'ALPHA', value: 'another-alpha' },
      { label: 'Beta', value: 'b' }
    ],
    closeOnSelect: false
  });

  await user.click(screen.getByRole('combobox', { name: 'Topics' }));
  await user.click(screen.getByRole('option', { name: 'Alpha', exact: true }));

  expect(screen.getByRole('button', { name: 'Remove Alpha' })).toBeTruthy();
  expect(screen.queryByRole('option', { name: 'ALPHA', exact: true })).toBeNull();
  expect(screen.getByRole('option', { name: 'Beta' })).toBeTruthy();
});

test('counts equivalent external values once and removes the whole duplicate selection', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(TagInput, {
    label: 'Topics',
    options: [
      { label: 'One', value: 1 },
      { label: 'One as text', value: '1' },
      { label: 'Two', value: 2 }
    ],
    value: [1, '1'],
    max: 2,
    onchange: onChange
  });

  expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(1);
  expect(screen.getByRole('combobox', { name: 'Topics' }).readOnly).toBe(false);

  await user.click(screen.getByRole('button', { name: 'Remove One' }));
  expect(screen.queryByRole('button', { name: /^Remove / })).toBeNull();
  expect(onChange).toHaveBeenCalledWith([]);
});
