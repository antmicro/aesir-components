import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import Select from '../src/components/aesir-select/aesir-select.svelte';
import NativeSelect from '../src/components/aesir-native-select/aesir-native-select.svelte';

test('native select renders repeated option values without a keyed-each error', async () => {
  const { rerender } = render(NativeSelect, {
    label: 'Destination',
    options: [{ value: 'shared', label: 'First destination' }]
  });

  await rerender({
    label: 'Destination',
    options: [
      { value: 'shared', label: 'First destination' },
      { value: 'shared', label: 'Second destination' }
    ]
  });

  expect(screen.getByRole('combobox', { name: 'Destination' }).querySelectorAll('option[value="shared"]')).toHaveLength(2);
});

test('native multi-select tolerates repeated grouped values when options change', async () => {
  const { rerender } = render(NativeSelect, {
    label: 'Regions',
    multiple: true,
    values: ['eu'],
    options: [{ label: 'Primary', options: [{ value: 'eu', label: 'Europe' }] }]
  });

  await rerender({
    label: 'Regions',
    multiple: true,
    values: ['eu'],
    options: [
      {
        label: 'Primary',
        options: [
          { value: 'eu', label: 'Europe' },
          { value: 'eu', label: 'Europe mirror' }
        ]
      },
      { label: 'Backup', options: [{ value: 'eu', label: 'Europe fallback' }] }
    ]
  });

  const select = screen.getByRole('listbox', { name: 'Regions' });
  expect(select.querySelectorAll('option[value="eu"]')).toHaveLength(3);
  expect(select.value).toBe('eu');
});

test('submits each selected option only once when external multi-values contain duplicates', () => {
  const { container } = render(Select, {
    label: 'Topics',
    name: 'topic',
    multiple: true,
    values: ['a', 'a', 'b'],
    options: [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' }
    ]
  });

  expect(screen.getByRole('combobox', { name: 'Topics' }).textContent).toContain('Alpha, Beta');
  expect([...container.querySelectorAll('input[type="hidden"][name="topic"]')].map((input) => input.value)).toEqual(['a', 'b']);
});

test('normalizes duplicate external values on the next multi-select change', async () => {
  const user = userEvent.setup();
  const onchange = vi.fn();
  render(Select, {
    label: 'Topics',
    multiple: true,
    values: ['a', 'a'],
    options: [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' }
    ],
    onchange
  });

  await user.click(screen.getByRole('combobox', { name: 'Topics' }));
  await user.click(screen.getByRole('option', { name: 'Beta' }));

  expect(onchange).toHaveBeenCalledWith(['a', 'b']);
});
