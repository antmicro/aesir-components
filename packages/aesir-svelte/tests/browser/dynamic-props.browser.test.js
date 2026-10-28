import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, test } from 'vitest';
import AutocompleteBox from '../../src/components/aesir-autocomplete-box/aesir-autocomplete-box.svelte';
import Select from '../../src/components/aesir-select/aesir-select.svelte';
import Tabs from '../../src/components/aesir-tabs/aesir-tabs.svelte';
import SegmentedField from '../../src/components/aesir-segmented-field/aesir-segmented-field.svelte';
import TreeView from '../../src/components/aesir-tree-view/aesir-tree-view.svelte';

describe('dynamic props in a browser', () => {
  test('disabling an open autocomplete dismisses its portal', async () => {
    const options = [{ label: 'Warsaw', value: 'waw' }];
    const rendered = await render(AutocompleteBox, { label: 'City', options });
    const input = page.getByRole('combobox', { name: 'City' });

    await input.click();
    await expect.element(page.getByRole('listbox')).toBeInTheDocument();
    await rendered.rerender({ label: 'City', options, disabled: true });

    await expect.element(input).toBeDisabled();
    await expect.element(input).toHaveAttribute('aria-expanded', 'false');
    await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
  });

  test('disabling an open select dismisses its list without changing the value', async () => {
    const options = [{ label: 'North', value: 'north' }];
    const rendered = await render(Select, { label: 'Region', options, value: 'north' });
    const trigger = page.getByRole('combobox', { name: 'Region' });
    await trigger.click();
    await expect.element(page.getByRole('listbox', { name: 'Region' })).toBeInTheDocument();

    await rendered.rerender({ label: 'Region', options, value: 'north', disabled: true });
    await expect.element(trigger).toBeDisabled();
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect.element(page.getByRole('listbox', { name: 'Region' })).not.toBeInTheDocument();
  });

  test('tabs move selection to an available item when the active item disappears', async () => {
    const first = { value: 'first', label: 'First', content: 'First panel' };
    const second = { value: 'second', label: 'Second', content: 'Second panel' };
    const rendered = await render(Tabs, { items: [first, second], value: 'second' });

    await rendered.rerender({ items: [first], value: 'second' });

    await expect.element(page.getByRole('tab', { name: 'Second' })).not.toBeInTheDocument();
    await expect.element(page.getByRole('tab', { name: 'First' })).toHaveAttribute('aria-selected', 'true');
    await expect.element(page.getByRole('tabpanel', { name: 'First' })).toBeVisible();
  });

  test('autocomplete keeps aria-activedescendant on an enabled option after a live update', async () => {
    const first = { label: 'Warsaw', value: 'waw' };
    const second = { label: 'Prague', value: 'prg' };
    const rendered = await render(AutocompleteBox, { label: 'City', options: [first, second] });
    const input = page.getByRole('combobox', { name: 'City' });

    await input.click();
    await rendered.rerender({ label: 'City', options: [{ ...first, disabled: true }, second] });

    const activeId = input.element().getAttribute('aria-activedescendant');
    expect(activeId).toBe(page.getByRole('option', { name: 'Prague' }).element().id);
  });

  test('autocomplete keeps the highlighted value when options reorder', async () => {
    const first = { label: 'Alpha', value: 'a' };
    const second = { label: 'Beta', value: 'b' };
    const rendered = await render(AutocompleteBox, { label: 'Choice', options: [first, second] });
    const input = page.getByRole('combobox', { name: 'Choice' });

    await input.click();
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(input).toHaveAttribute('aria-activedescendant', page.getByRole('option', { name: 'Beta' }).element().id);

    await rendered.rerender({ label: 'Choice', options: [second, first] });
    await expect.element(input).toHaveAttribute('aria-activedescendant', page.getByRole('option', { name: 'Beta' }).element().id);
    await userEvent.keyboard('{Enter}');
    await expect.element(input).toHaveValue('Beta');
  });

  test('autocomplete excludes a disabled selected option when custom values are disallowed', async () => {
    const option = { label: 'Warsaw', value: 'waw' };
    const props = { label: 'City', name: 'city', options: [option], value: 'waw', allowCustomValue: false };
    const rendered = await render(AutocompleteBox, props);
    const input = page.getByRole('combobox', { name: 'City' });
    const hidden = document.querySelector('input[type="hidden"][name="city"]');
    await expect.element(input).toHaveValue('Warsaw');
    expect(hidden.value).toBe('waw');

    await rendered.rerender({ ...props, options: [{ ...option, disabled: true }] });
    await expect.element(input).toHaveValue('');
    expect(hidden.value).toBe('');

    await rendered.rerender(props);
    await expect.element(input).toHaveValue('Warsaw');
    expect(hidden.value).toBe('waw');
  });

  test('autocomplete shows the stored custom value when a matching option becomes unavailable', async () => {
    const option = { label: 'Warsaw', value: 'waw' };
    const props = { label: 'City', name: 'city', options: [option], value: 'waw', allowCustomValue: true };
    const rendered = await render(AutocompleteBox, props);
    const input = page.getByRole('combobox', { name: 'City' });
    const hidden = document.querySelector('input[type="hidden"][name="city"]');
    await expect.element(input).toHaveValue('Warsaw');

    await rendered.rerender({ ...props, options: [{ ...option, disabled: true }] });
    await expect.element(input).toHaveValue('waw');
    expect(hidden.value).toBe('waw');

    await rendered.rerender(props);
    await expect.element(input).toHaveValue('Warsaw');
  });

  test('segmented field revalidates an existing value when its bounds change', async () => {
    const props = { kind: 'date', label: 'Deadline', value: '2026-10-03', max: '2026-10-31' };
    const rendered = await render(SegmentedField, props);
    const month = page.getByRole('textbox', { name: 'Deadline Month' });
    await expect.element(month).toBeValid();

    await rendered.rerender({ ...props, max: '2026-10-02' });
    await expect.element(month).toBeInvalid();
    expect(month.element().validationMessage).toContain('2026-10-02');
  });

  test('segmented field invalidates the old format after its kind changes', async () => {
    const rendered = await render(SegmentedField, { kind: 'date', label: 'When', value: '2026-10-03' });
    const month = page.getByRole('textbox', { name: 'When Month' });
    await month.click();
    await userEvent.keyboard('{ArrowUp}');
    await expect.element(month).toHaveValue('11');

    await rendered.rerender({ kind: 'time', label: 'When', value: '2026-11-03' });
    const hour = page.getByRole('textbox', { name: 'When Hour' });
    await expect.element(hour).toBeInvalid();
    expect(hour.element().validationMessage).toBe('Enter a valid time.');
  });

  test('tree view restores focus to a visible ancestor after external collapse', async () => {
    const items = [{ value: 'branch', label: 'Branch', items: [{ value: 'child', label: 'Child' }] }];
    const rendered = await render(TreeView, { items, expanded: ['branch'] });
    const branch = page.getByRole('treeitem', { name: 'Branch' });
    const child = page.getByRole('treeitem', { name: 'Child' });
    child.element().focus();
    await expect.element(child).toHaveFocus();

    await rendered.rerender({ items, expanded: [] });

    await expect.element(child).not.toBeInTheDocument();
    await expect.element(branch).toHaveFocus();
  });

  test('tree view does not reclaim focus after the user leaves it', async () => {
    const items = [{ value: 'branch', label: 'Branch', items: [{ value: 'child', label: 'Child' }] }];
    const rendered = await render(TreeView, { items, expanded: ['branch'] });
    const child = page.getByRole('treeitem', { name: 'Child' });
    child.element().focus();
    child.element().blur();

    await rendered.rerender({ items, expanded: [] });

    await expect.element(page.getByRole('treeitem', { name: 'Branch' })).not.toHaveFocus();
  });

  test('tree view preserves focus on another visible control after collapse', async () => {
    const items = [
      { value: 'branch', label: 'Branch', items: [{ value: 'child', label: 'Child' }] },
      { value: 'other', label: 'Other', items: [{ value: 'other-child', label: 'Other child' }] }
    ];
    const rendered = await render(TreeView, { items, expanded: ['branch', 'other'] });
    page.getByRole('treeitem', { name: 'Child', exact: true }).element().focus();
    const otherToggle = page.getByRole('button', { name: 'Collapse Other' });
    otherToggle.element().focus();

    await rendered.rerender({ items, expanded: ['other'] });

    await expect.element(otherToggle).toHaveFocus();
  });
});
