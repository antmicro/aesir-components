import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, test, vi } from 'vitest';
import { AesirSelect } from '../../src/index.js';
import SelectFixture from '../fixtures/select-fixture.svelte';

describe('composable select', () => {
  test('renders groups and selects a value with the keyboard', async () => {
    await render(SelectFixture);
    const trigger = page.getByRole('combobox', { name: 'Region', exact: true });
    await trigger.click();
    await expect.element(page.getByRole('group', { name: 'Europe' })).toBeInTheDocument();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect.element(trigger).toHaveTextContent('Germany');
    expect(new FormData(page.getByRole('form', { name: 'Select form' }).element()).get('region')).toBe('de');
    await expect.element(page.getByRole('listbox', { name: 'Region', exact: true })).not.toBeInTheDocument();
  });

  test('positions the portalled list next to its trigger', async () => {
    await render(SelectFixture);
    const trigger = page.getByRole('combobox', { name: 'Region', exact: true });
    await trigger.click();
    const list = page.getByRole('listbox', { name: 'Region', exact: true }).element();
    const triggerRect = trigger.element().getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    expect(getComputedStyle(list).position).toBe('fixed');
    expect(listRect.left).toBeLessThanOrEqual(triggerRect.right + 8);
    expect(listRect.right).toBeGreaterThanOrEqual(triggerRect.left - 8);
    expect(listRect.top >= triggerRect.bottom - 1 || listRect.bottom <= triggerRect.top + 1).toBe(true);
    expect(listRect.top).toBeGreaterThanOrEqual(0);
    expect(listRect.bottom).toBeLessThanOrEqual(window.innerHeight);
  });

  test('does not point to a nonexistent active option when empty', async () => {
    await render(SelectFixture);
    const trigger = page.getByRole('combobox', { name: 'No regions available' });
    await trigger.click();
    expect(trigger.element().hasAttribute('aria-activedescendant')).toBe(false);
  });

  test('keeps the active value when options reorder and excludes removed values from form data', async () => {
    await render(SelectFixture);
    const trigger = page.getByRole('combobox', { name: 'Region', exact: true });
    await trigger.click();
    await userEvent.keyboard('{ArrowDown}');
    page.getByRole('button', { name: 'Update options' }).element().click();
    await expect.element(page.getByRole('option', { name: 'Germany' })).toBeInTheDocument();
    expect(trigger.element().getAttribute('aria-activedescendant')).toBe(page.getByRole('option', { name: 'Germany' }).element().id);
    expect(new FormData(page.getByRole('form', { name: 'Select form' }).element()).get('region')).toBe('');
    await userEvent.keyboard('{Enter}');
    expect(new FormData(page.getByRole('form', { name: 'Select form' }).element()).get('region')).toBe('de');
  });

  test('keeps the list inside the viewport beside a narrow edge trigger', async () => {
    await render(SelectFixture);
    await page.getByRole('combobox', { name: 'Edge region' }).click();
    const list = page.getByRole('listbox', { name: 'Edge region' }).element();
    await vi.waitFor(() => expect(list.style.width).not.toBe(''));
    const rect = list.getBoundingClientRect();
    expect(rect.left).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
    expect(rect.width).toBeGreaterThanOrEqual(Math.min(180, window.innerWidth - 16) - 1);
  });

  test('keeps a multi-select open and submits every value', async () => {
    await render(SelectFixture);
    await page.getByRole('combobox', { name: 'Visible regions' }).click();
    await page.getByRole('option', { name: 'Germany' }).click();
    await expect.element(page.getByRole('listbox', { name: 'Visible regions' })).toBeInTheDocument();
    expect(new FormData(page.getByRole('form', { name: 'Select form' }).element()).getAll('visible')).toEqual(['pl', 'de']);
    page.getByRole('form', { name: 'Select form' }).element().reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await expect.element(page.getByRole('combobox', { name: 'Visible regions' })).toHaveTextContent('Poland');
    expect(new FormData(page.getByRole('form', { name: 'Select form' }).element()).getAll('visible')).toEqual(['pl']);
  });

  test('shows a check beside each selected grouped multi-option without changing its accessible name', async () => {
    await render(SelectFixture);
    await page.getByRole('combobox', { name: 'Visible regions' }).click();
    const poland = page.getByRole('option', { name: 'Poland' });
    const germany = page.getByRole('option', { name: 'Germany' });
    const check = (option) => option.element().querySelector('.aesir-select__option-indicator svg');

    expect(check(poland)).not.toBeNull();
    expect(check(germany)).toBeNull();

    await germany.click();
    expect(check(poland)).not.toBeNull();
    expect(check(germany)).not.toBeNull();
    await expect.element(page.getByRole('listbox', { name: 'Visible regions' })).toBeInTheDocument();

    await poland.click();
    expect(check(poland)).toBeNull();
    expect(check(germany)).not.toBeNull();
    expect(new FormData(page.getByRole('form', { name: 'Select form' }).element()).getAll('visible')).toEqual(['de']);
  });

  test('shows the same selected marker for flat multi-options', async () => {
    await render(AesirSelect, {
      label: 'Teams',
      multiple: true,
      values: ['alpha'],
      options: [
        { value: 'alpha', label: 'Alpha' },
        { value: 'beta', label: 'Beta' }
      ]
    });
    await page.getByRole('combobox', { name: 'Teams' }).click();
    const alpha = page.getByRole('option', { name: 'Alpha' });
    const beta = page.getByRole('option', { name: 'Beta' });

    expect(alpha.element().querySelector('.aesir-select__option-indicator svg')).not.toBeNull();
    expect(beta.element().querySelector('.aesir-select__option-indicator svg')).toBeNull();
    await beta.click();
    expect(beta.element().querySelector('.aesir-select__option-indicator svg')).not.toBeNull();
  });

  test('does not display disabled selections that are excluded from form data', async () => {
    await render(SelectFixture);
    const region = page.getByRole('combobox', { name: 'Region', exact: true });
    const visible = page.getByRole('combobox', { name: 'Visible regions' });
    const form = page.getByRole('form', { name: 'Select form' }).element();
    await expect.element(region).toHaveTextContent('Poland');
    await expect.element(visible).toHaveTextContent('Poland');

    await page.getByRole('button', { name: 'Disable Poland' }).click();

    expect(new FormData(form).get('region')).toBe('');
    expect(new FormData(form).getAll('visible')).toEqual([]);
    await expect.element(region).toHaveTextContent('Select an option');
    await expect.element(visible).toHaveTextContent('Select an option');

    await region.click();
    expect(page.getByRole('option', { name: 'Poland' }).element().getAttribute('aria-selected')).toBe('false');
    await region.click();
    await page.getByRole('button', { name: 'Enable Poland' }).click();
    await expect.element(region).toHaveTextContent('Poland');
    await expect.element(visible).toHaveTextContent('Poland');
    expect(new FormData(form).get('region')).toBe('pl');
    expect(new FormData(form).getAll('visible')).toEqual(['pl']);
  });

  test('skips disabled options and finds an item by typeahead', async () => {
    await render(SelectFixture);
    const trigger = page.getByRole('combobox', { name: 'Region', exact: true });
    trigger.element().focus();
    await userEvent.keyboard('u{Enter}');
    await expect.element(trigger).toHaveTextContent('United States');
    await trigger.click();
    await userEvent.keyboard('{End}');
    expect(trigger.element().getAttribute('aria-activedescendant')).toBe(page.getByRole('option', { name: 'United States' }).element().id);
  });
});
