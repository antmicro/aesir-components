import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import ComboboxInputsFixture from './fixtures/combobox-inputs-fixture.svelte';
import TagInput from '../src/components/aesir-tag-input/aesir-tag-input.svelte';

describe('AesirAutocompleteBox', () => {
  test('connects the combobox to its listbox and skips disabled options', async () => {
    const user = userEvent.setup();
    render(ComboboxInputsFixture);

    const input = screen.getByRole('combobox', { name: 'City' });
    await user.click(input);
    const listbox = await screen.findByRole('listbox');

    expect(input.getAttribute('aria-controls')).toBe(listbox.id);
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'Warsaw' }).id);

    await user.keyboard('{ArrowDown}{Enter}');

    expect(screen.getByRole('status', { name: 'City value' }).textContent).toBe('prague');
    expect(screen.getByRole('status', { name: 'City query' }).textContent).toBe('Prague');
    expect(screen.getByRole('status', { name: 'City open state' }).textContent).toBe('closed');
    expect(document.activeElement).toBe(input);
  });

  test('filters options and clears the selected value', async () => {
    const user = userEvent.setup();
    render(ComboboxInputsFixture);

    const input = screen.getByRole('combobox', { name: 'City' });
    await user.type(input, 'war');

    expect(screen.getByRole('option', { name: 'Warsaw' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'Prague' })).toBeNull();
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByRole('status', { name: 'City value' }).textContent).toBe('none');
    expect(screen.getByRole('status', { name: 'City query' }).textContent).toBe('empty');
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });

  test('closes without selection on Escape', async () => {
    const user = userEvent.setup();
    render(ComboboxInputsFixture);

    const input = screen.getByRole('combobox', { name: 'City' });
    await user.click(input);
    await user.keyboard('{Escape}');

    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('status', { name: 'City value' }).textContent).toBe('none');
  });

  test('keeps the displayed query in sync with programmatic value changes', async () => {
    const user = userEvent.setup();
    render(ComboboxInputsFixture);
    const input = screen.getByRole('combobox', { name: 'City' });

    await user.click(screen.getByRole('button', { name: 'Select Prague externally' }));
    expect(input.value).toBe('Prague');
    expect(screen.getByRole('status', { name: 'City value' }).textContent).toBe('prague');

    await user.click(screen.getByRole('button', { name: 'Clear city externally' }));
    expect(input.value).toBe('');
    expect(screen.getByRole('status', { name: 'City value' }).textContent).toBe('none');
  });

  test('closes on Tab while preserving native focus movement', async () => {
    const user = userEvent.setup();
    render(ComboboxInputsFixture);
    const input = screen.getByRole('combobox', { name: 'City' });

    await user.click(input);
    await user.keyboard('{Tab}');

    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Select Prague externally' }));
  });

  test('keeps the current value when Enter has no active option', async () => {
    const user = userEvent.setup();
    render(ComboboxInputsFixture);
    const input = screen.getByRole('combobox', { name: 'City' });

    await user.type(input, 'No matching city');
    expect(screen.queryByRole('option')).toBeNull();
    await user.keyboard('{Enter}');

    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('status', { name: 'City value' }).textContent).toBe('No matching city');
  });
});

describe('AesirTagInput', () => {
  test('offers a duplicated option value only once', async () => {
    const user = userEvent.setup();
    render(TagInput, {
      label: 'Topics',
      options: [
        { label: 'Alpha', value: 'a' },
        { label: 'Alpha duplicate', value: 'a' }
      ]
    });

    await user.click(screen.getByRole('combobox', { name: 'Topics' }));
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'Alpha' })).toBeTruthy();
  });

  test('renders repeated external values once and counts visible tags toward the limit', async () => {
    const user = userEvent.setup();
    const options = [
      { label: 'Alpha', value: 'a' },
      { label: 'Beta', value: 'b' }
    ];
    render(TagInput, { label: 'Topics', options, value: ['a', 'a'], max: 2 });

    expect(screen.getAllByRole('button', { name: 'Remove Alpha' })).toHaveLength(1);
    const input = screen.getByRole('combobox', { name: 'Topics' });
    expect(input.readOnly).toBe(false);

    await user.click(input);
    await user.click(screen.getByRole('option', { name: 'Beta' }));

    expect(screen.getAllByRole('button', { name: 'Remove Alpha' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Remove Beta' })).toHaveLength(1);
    expect(input.readOnly).toBe(true);
  });

  test('closes an open list when the control becomes disabled', async () => {
    const user = userEvent.setup();
    const options = [{ label: 'Alpha', value: 'a' }];
    const { rerender } = render(TagInput, { label: 'Topics', options });
    const input = screen.getByRole('combobox', { name: 'Topics' });

    await user.click(input);
    expect(await screen.findByRole('listbox')).toBeTruthy();
    await rerender({ label: 'Topics', options, disabled: true });

    expect(input.disabled).toBe(true);
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  test('keeps a full tag input usable for removing the last tag', async () => {
    const user = userEvent.setup();
    const options = [
      { label: 'Alpha', value: 'a' },
      { label: 'Beta', value: 'b' }
    ];
    render(TagInput, { label: 'Topics', options, value: ['a'], max: 1 });
    const input = screen.getByRole('combobox', { name: 'Topics' });

    expect(input.disabled).toBe(false);
    expect(input.readOnly).toBe(true);
    await user.click(input);
    expect(document.activeElement).toBe(input);
    expect(screen.queryByRole('listbox')).toBeNull();

    await user.keyboard('{Backspace}');
    expect(screen.queryByRole('button', { name: 'Remove Alpha' })).toBeNull();
    expect(input.readOnly).toBe(false);

    await user.type(input, 'Bet');
    expect(screen.getByRole('option', { name: 'Beta' })).toBeTruthy();
  });

  test('closes an open list when an external selection reaches the limit', async () => {
    const user = userEvent.setup();
    const options = [
      { label: 'Alpha', value: 'a' },
      { label: 'Beta', value: 'b' }
    ];
    const { rerender } = render(TagInput, { label: 'Topics', options, max: 1, value: [] });
    const input = screen.getByRole('combobox', { name: 'Topics' });

    await user.click(input);
    expect(await screen.findByRole('listbox')).toBeTruthy();
    await rerender({ label: 'Topics', options, max: 1, value: ['a'] });

    expect(input.disabled).toBe(false);
    expect(input.readOnly).toBe(true);
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  test('keeps the highlighted option when the option list is reordered', async () => {
    const user = userEvent.setup();
    const first = { label: 'Alpha', value: 'a' };
    const second = { label: 'Beta', value: 'b' };
    const { rerender } = render(TagInput, { label: 'Topics', options: [first, second] });
    const input = screen.getByRole('combobox', { name: 'Topics' });

    await user.click(input);
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(document.getElementById(input.getAttribute('aria-activedescendant'))?.textContent).toContain('Beta');

    await rerender({ label: 'Topics', options: [second, first] });
    expect(document.getElementById(input.getAttribute('aria-activedescendant'))?.textContent).toContain('Beta');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Remove Beta' })).toBeTruthy();
  });

  test('adds enabled options with the keyboard and excludes selected values', async () => {
    const user = userEvent.setup();
    render(ComboboxInputsFixture);

    const input = screen.getByRole('combobox', { name: 'Topics' });
    await user.click(input);
    expect(screen.queryByRole('option', { name: 'Accessibility' })).toBeNull();

    await user.keyboard('{ArrowDown}');
    const activeOption = document.getElementById(input.getAttribute('aria-activedescendant'));
    expect(activeOption?.getAttribute('aria-selected')).toBe('false');
    await user.keyboard('{Enter}');
    expect(screen.getByRole('status', { name: 'Tag values' }).textContent).toBe('a11y,design-systems');
    expect(document.activeElement).toBe(input);
  });

  test('adds a custom value and removes the last tag with Backspace', async () => {
    const user = userEvent.setup();
    render(ComboboxInputsFixture);

    const input = screen.getByRole('combobox', { name: 'Topics' });
    await user.type(input, 'Frontend{Enter}');
    expect(screen.getByRole('status', { name: 'Tag values' }).textContent).toBe('a11y,Frontend');

    await user.keyboard('{Backspace}');
    expect(screen.getByRole('status', { name: 'Tag values' }).textContent).toBe('a11y');
  });

  test('removes a tag with its accessible remove control', async () => {
    const user = userEvent.setup();
    render(ComboboxInputsFixture);

    await user.click(screen.getByRole('button', { name: 'Remove Accessibility' }));
    expect(screen.getByRole('status', { name: 'Tag values' }).textContent).toBe('');

    const input = screen.getByRole('combobox', { name: 'Topics' });
    await waitFor(() => expect(document.activeElement).toBe(input));
  });
});
