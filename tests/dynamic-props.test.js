import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import AutocompleteBox from '../src/components/aesir-autocomplete-box/aesir-autocomplete-box.svelte';
import Dropdown from '../src/components/aesir-dropdown/aesir-dropdown.svelte';
import Input from '../src/components/aesir-input/aesir-input.svelte';
import ResizablePanels from '../src/components/aesir-resizable-panels/aesir-resizable-panels.svelte';
import Tabs from '../src/components/aesir-tabs/aesir-tabs.svelte';

describe('dynamic public props', () => {
  test('tabs recover when the selected item disappears, is disabled, and becomes available again', async () => {
    const first = { value: 'first', label: 'First', content: 'First panel' };
    const second = { value: 'second', label: 'Second', content: 'Second panel' };
    const { rerender } = render(Tabs, { items: [first, second], value: 'second' });

    await rerender({ items: [first], value: 'second' });
    expect(screen.getByRole('tab', { name: 'First' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.queryByRole('tab', { name: 'Second' })).toBeNull();

    await rerender({ items: [{ ...first, disabled: true }, second], value: 'first' });
    expect(screen.getByRole('tab', { name: 'Second' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'First' }).disabled).toBe(true);

    await rerender({ items: [first, second], value: 'first' });
    expect(screen.getByRole('tab', { name: 'First' }).getAttribute('aria-selected')).toBe('true');
  });

  test('autocomplete updates its selected label when options change', async () => {
    const { rerender } = render(AutocompleteBox, {
      label: 'City',
      value: 'waw',
      options: [{ label: 'Warsaw', value: 'waw' }]
    });
    const input = screen.getByRole('combobox', { name: 'City' });
    await waitFor(() => expect(input.value).toBe('Warsaw'));

    await rerender({ label: 'City', value: 'waw', options: [{ label: 'Warszawa', value: 'waw' }] });
    await waitFor(() => expect(input.value).toBe('Warszawa'));

    await rerender({ label: 'City', value: null, options: [{ label: 'Warszawa', value: 'waw' }] });
    await waitFor(() => expect(input.value).toBe(''));
  });

  test('autocomplete honors disabled changes while its popup is open', async () => {
    const user = userEvent.setup();
    const props = { label: 'City', options: [{ label: 'Warsaw', value: 'waw' }] };
    const { rerender } = render(AutocompleteBox, props);
    const input = screen.getByRole('combobox', { name: 'City' });

    await user.click(input);
    expect(input.getAttribute('aria-expanded')).toBe('true');
    await rerender({ ...props, disabled: true });

    expect(input.disabled).toBe(true);
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  test('autocomplete moves its active descendant when options are disabled or removed', async () => {
    const user = userEvent.setup();
    const first = { label: 'Warsaw', value: 'waw' };
    const second = { label: 'Prague', value: 'prg' };
    const { rerender } = render(AutocompleteBox, { label: 'City', options: [first, second] });
    const input = screen.getByRole('combobox', { name: 'City' });

    await user.click(input);
    expect(document.getElementById(input.getAttribute('aria-activedescendant'))?.textContent).toContain('Warsaw');

    await rerender({ label: 'City', options: [{ ...first, disabled: true }, second] });
    expect(document.getElementById(input.getAttribute('aria-activedescendant'))?.textContent).toContain('Prague');

    await rerender({ label: 'City', options: [{ ...first, disabled: true }] });
    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
    await user.keyboard('{Enter}');
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });

  test('dropdown drops a removed active item without selecting stale data', async () => {
    const user = userEvent.setup();
    const onselect = vi.fn();
    const { rerender } = render(Dropdown, {
      open: true,
      label: 'Actions',
      items: [
        { label: 'Edit', value: 'edit' },
        { label: 'Move', value: 'move' }
      ],
      onselect
    });
    const move = await screen.findByRole('menuitem', { name: 'Move' });
    move.focus();

    await rerender({ open: true, label: 'Actions', items: [{ label: 'Edit', value: 'edit' }], onselect });
    expect(screen.queryByRole('menuitem', { name: 'Move' })).toBeNull();
    await user.keyboard('{Enter}');
    expect(onselect).toHaveBeenCalledExactlyOnceWith({ label: 'Edit', value: 'edit' });
  });

  test('input reflects controlled value, disabled, and error changes without replacing its node', async () => {
    const { rerender } = render(Input, { label: 'Project', value: 'Alpha' });
    const input = screen.getByRole('textbox', { name: 'Project' });

    await rerender({ label: 'Project', value: 'Beta', disabled: true, error: 'Unavailable' });

    expect(screen.getByRole('textbox', { name: 'Project' })).toBe(input);
    expect(input.value).toBe('Beta');
    expect(input.disabled).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');

    await rerender({ label: 'Project', value: 'Gamma', disabled: false, error: undefined });
    expect(input.value).toBe('Gamma');
    expect(input.disabled).toBe(false);
    expect(input.getAttribute('aria-invalid')).not.toBe('true');
  });

  test('resizable panels respond to updated limits and disabled state', async () => {
    const user = userEvent.setup();
    const { rerender } = render(ResizablePanels, { size: 50, min: 20, max: 80 });
    const handle = screen.getByRole('separator');

    await rerender({ size: 50, min: 40, max: 60, disabled: true });
    expect(handle.getAttribute('aria-valuemin')).toBe('40');
    expect(handle.getAttribute('aria-valuemax')).toBe('60');
    handle.focus();
    await user.keyboard('{End}');
    expect(handle.getAttribute('aria-valuenow')).toBe('50');

    await rerender({ size: 50, min: 40, max: 60, disabled: false });
    await user.keyboard('{End}');
    expect(handle.getAttribute('aria-valuenow')).toBe('60');
  });
});
