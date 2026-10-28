import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import TagInput from '../src/components/aesir-tag-input/aesir-tag-input.svelte';

test('submits selected tag values under the field name and omits them when disabled', async () => {
  const user = userEvent.setup();
  const form = document.createElement('form');
  document.body.append(form);
  const props = {
    label: 'Topics',
    name: 'topics',
    options: [
      { label: 'Alpha', value: 'a' },
      { label: 'Beta', value: 2 }
    ],
    value: ['a']
  };

  try {
    const { rerender } = render(TagInput, { target: form, props });
    expect(new FormData(form).getAll('topics')).toEqual(['a']);

    await user.click(screen.getByRole('combobox', { name: 'Topics' }));
    await user.click(screen.getByRole('option', { name: 'Beta' }));
    expect(new FormData(form).getAll('topics')).toEqual(['a', '2']);

    await rerender({ ...props, disabled: true });
    expect(new FormData(form).getAll('topics')).toEqual([]);
  } finally {
    form.remove();
  }
});

test('restores the initial tags after a native form reset', async () => {
  const user = userEvent.setup();
  const form = document.createElement('form');
  document.body.append(form);

  try {
    render(TagInput, {
      target: form,
      props: {
        label: 'Topics',
        name: 'topics',
        options: [
          { label: 'Alpha', value: 'a' },
          { label: 'Beta', value: 'b' }
        ],
        value: ['a']
      }
    });

    await user.click(screen.getByRole('combobox', { name: 'Topics' }));
    await user.click(screen.getByRole('option', { name: 'Beta' }));
    expect(new FormData(form).getAll('topics')).toEqual(['a', 'b']);

    form.reset();

    await waitFor(() => expect(new FormData(form).getAll('topics')).toEqual(['a']));
    expect(screen.queryByRole('button', { name: 'Remove Beta' })).toBeNull();
  } finally {
    form.remove();
  }
});
