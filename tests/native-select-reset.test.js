import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import NativeSelect from '../src/components/aesir-native-select/aesir-native-select.svelte';

test('reset restores the first native option when no value was supplied', async () => {
  const form = document.createElement('form');
  document.body.append(form);
  const { unmount } = render(NativeSelect, {
    target: form,
    props: {
      label: 'Region',
      name: 'region',
      options: [
        { value: 'eu', label: 'Europe' },
        { value: 'us', label: 'United States' }
      ]
    }
  });
  try {
    const select = screen.getByRole('combobox', { name: 'Region' });
    const user = userEvent.setup();

    expect(new FormData(form).get('region')).toBe('eu');
    await user.selectOptions(select, 'us');
    expect(new FormData(form).get('region')).toBe('us');

    form.reset();
    await waitFor(() => expect(select.value).toBe('eu'));
    expect(new FormData(form).get('region')).toBe('eu');
  } finally {
    unmount();
    form.remove();
  }
});

test('reset restores an initial placeholder after another option is selected', async () => {
  const form = document.createElement('form');
  document.body.append(form);
  const { unmount } = render(NativeSelect, {
    target: form,
    props: {
      label: 'Region',
      name: 'region',
      placeholder: 'Choose a region',
      options: [{ value: 'eu', label: 'Europe' }]
    }
  });
  try {
    const select = screen.getByRole('combobox', { name: 'Region' });
    const user = userEvent.setup();

    expect(select.selectedOptions[0].textContent).toBe('Choose a region');
    await user.selectOptions(select, 'eu');
    form.reset();

    await waitFor(() => expect(select.selectedOptions[0].textContent).toBe('Choose a region'));
  } finally {
    unmount();
    form.remove();
  }
});
