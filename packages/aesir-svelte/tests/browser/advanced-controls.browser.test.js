import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, test } from 'vitest';
import AdvancedFormFixture from '../fixtures/advanced-form-fixture.svelte';

describe('advanced form controls', () => {
  test('submits grouped select, autocomplete, and segmented values', async () => {
    await render(AdvancedFormFixture);
    const region = page.getByRole('combobox', { name: 'Region' });
    await region.selectOptions('de');
    await expect.element(region).toHaveValue('de');

    const city = page.getByRole('combobox', { name: 'City', exact: true });
    await city.fill('Pra');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect.element(city).toHaveValue('Prague');

    const form = page.getByRole('form', { name: 'Advanced controls' }).element();
    const values = Object.fromEntries(new FormData(form));
    expect(values).toMatchObject({
      region: 'de',
      city: 'Prague',
      due: '2026-10-03',
      start: '09:30',
      'dates.start': '2026-10-03',
      'dates.end': '2026-10-05',
      'times.start': '09:30',
      'times.end': '17:00'
    });
  });

  test('passes locale and bounds into both endpoints of segmented ranges', async () => {
    await render(AdvancedFormFixture);
    const dateRange = page.getByRole('group', { name: 'Date interval' });
    expect(Array.from(dateRange.element().querySelectorAll('input:not([type="hidden"])'), (input) => input.getAttribute('aria-label'))).toEqual([
      'Start Day',
      'Start Month',
      'Start Year',
      'End Day',
      'End Month',
      'End Year'
    ]);
    const startDay = dateRange.getByRole('textbox', { name: 'Start Day' }).element();
    startDay.value = '31';
    startDay.dispatchEvent(new Event('input', { bubbles: true }));
    expect(startDay.validationMessage).toContain('2026-10-01');

    const endMonth = dateRange.getByRole('textbox', { name: 'End Month' }).element();
    endMonth.value = '11';
    endMonth.dispatchEvent(new Event('input', { bubbles: true }));
    expect(dateRange.getByRole('textbox', { name: 'End Day' }).element().validationMessage).toContain('2026-10-31');

    const timeRange = page.getByRole('group', { name: 'Time interval' });
    const startHour = timeRange.getByRole('textbox', { name: 'Start Hour' }).element();
    startHour.value = '07';
    startHour.dispatchEvent(new Event('input', { bubbles: true }));
    expect(startHour.validationMessage).toContain('08:00');
    const endHour = timeRange.getByRole('textbox', { name: 'End Hour' }).element();
    endHour.value = '19';
    endHour.dispatchEvent(new Event('input', { bubbles: true }));
    expect(endHour.validationMessage).toContain('18:00');
  });

  test('limits autocomplete results without changing its keyboard selection', async () => {
    await render(AdvancedFormFixture);
    const city = page.getByRole('combobox', { name: 'City', exact: true });
    city.element().focus();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const listbox = document.querySelector('.autocomplete-box__list[role="listbox"]');
    expect(listbox?.querySelectorAll('[role="option"]')).toHaveLength(2);
    expect(listbox?.textContent).not.toContain('Paris');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect.element(city).toHaveValue('Prague');
  });

  test('groups autocomplete options and loops past disabled choices', async () => {
    await render(AdvancedFormFixture);
    const input = page.getByRole('combobox', { name: 'Grouped city' });
    await input.click();
    await expect.element(page.getByRole('group', { name: 'Americas' })).toBeInTheDocument();
    await userEvent.keyboard('{ArrowUp}{Enter}');
    await expect.element(input).toHaveValue('Boston');
  });

  test('requires an actual option when custom autocomplete values are disabled', async () => {
    await render(AdvancedFormFixture);
    const repository = page.getByRole('combobox', { name: 'Repository' });
    const form = page.getByRole('form', { name: 'Advanced controls' }).element();
    await repository.fill('Other');
    expect(new FormData(form).get('repository')).toBe('');
    await page.getByRole('textbox', { name: 'Due date Month' }).click();
    await expect.element(repository).toHaveValue('');

    await repository.fill('Doc');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect.element(repository).toHaveValue('Docs');
    expect(new FormData(form).get('repository')).toBe('Docs');
  });

  test('validates the selected option rather than unmatched typed text', async () => {
    await render(AdvancedFormFixture);
    const repository = page.getByRole('combobox', { name: 'Repository' });
    const form = page.getByRole('form', { name: 'Advanced controls' }).element();

    await repository.fill('Other');
    expect(new FormData(form).get('repository')).toBe('');
    expect(repository.element().checkValidity()).toBe(false);

    await repository.fill('Doc');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(new FormData(form).get('repository')).toBe('Docs');
    expect(repository.element().checkValidity()).toBe(true);
  });

  test('clears autocomplete validation feedback on form reset', async () => {
    await render(AdvancedFormFixture);
    const repository = page.getByRole('combobox', { name: 'Repository' });
    const form = page.getByRole('form', { name: 'Advanced controls' }).element();

    await repository.click();
    repository.element().blur();
    await expect.element(repository).toHaveAttribute('aria-invalid', 'true');

    form.reset();
    await expect.element(repository).not.toHaveAttribute('aria-invalid', 'true');
    await expect.element(repository).toHaveValue('');
    expect(new FormData(form).get('repository')).toBe('');
  });

  test('submits every selected value and restores the initial multiple selection on reset', async () => {
    await render(AdvancedFormFixture);
    const visible = page.getByRole('listbox', { name: 'Visible regions' });
    const form = page.getByRole('form', { name: 'Advanced controls' }).element();
    expect(new FormData(form).getAll('visibleRegions')).toEqual(['pl', 'us']);
    await visible.selectOptions(['de']);
    expect(new FormData(form).getAll('visibleRegions')).toEqual(['de']);
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(Array.from(visible.element().selectedOptions, (option) => option.value)).toEqual(['pl', 'us']);
    expect(new FormData(form).getAll('visibleRegions')).toEqual(['pl', 'us']);
  });

  test('edits date and time segments with arrows and validates calendar dates', async () => {
    await render(AdvancedFormFixture);
    const month = page.getByRole('textbox', { name: 'Due date Month' });
    await month.click();
    await userEvent.keyboard('{ArrowUp}');
    const values = Object.fromEntries(new FormData(page.getByRole('form', { name: 'Advanced controls' }).element()));
    expect(values.due).toBe('2026-11-03');

    const hour = page.getByRole('textbox', { name: 'Start time Hour' });
    await hour.click();
    await userEvent.keyboard('{ArrowDown}');
    const next = Object.fromEntries(new FormData(page.getByRole('form', { name: 'Advanced controls' }).element()));
    expect(next.start).toBe('08:30');

    const day = page.getByRole('textbox', { name: 'Due date Day' });
    await day.fill('31');
    const invalid = Object.fromEntries(new FormData(page.getByRole('form', { name: 'Advanced controls' }).element()));
    expect(invalid.due).toBe('');
    expect(month.element().validationMessage).toBe('Enter a valid date.');
  });

  test('orders date segments by locale and enforces minimum values', async () => {
    await render(AdvancedFormFixture);
    const field = page.getByRole('group', { name: 'Localized date' });
    expect(field.element().querySelector('input:not([type="hidden"])')?.getAttribute('aria-label')).toBe('Localized date Day');
    expect(field.element().querySelector('.aesir-segmented-field__separator')?.textContent).toBe('.');
    await page.getByRole('textbox', { name: 'Localized date Day' }).click();
    await userEvent.keyboard('{ArrowDown}');
    expect(new FormData(page.getByRole('form', { name: 'Advanced controls' }).element()).get('localized')).toBe('');
  });

  test('restores segmented values after form reset', async () => {
    await render(AdvancedFormFixture);
    const form = page.getByRole('form', { name: 'Advanced controls' }).element();
    const month = page.getByRole('textbox', { name: 'Due date Month' });
    await month.click();
    await userEvent.keyboard('{ArrowUp}');
    expect(new FormData(form).get('due')).toBe('2026-11-03');
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(new FormData(form).get('due')).toBe('2026-10-03');
    await expect.element(month).toHaveValue('10');

    const rangeStart = page.getByRole('textbox', { name: 'Start Day' });
    await rangeStart.click();
    await userEvent.keyboard('{ArrowUp}');
    expect(new FormData(form).get('dates.start')).toBe('2026-10-04');
    form.reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(new FormData(form).get('dates.start')).toBe('2026-10-03');
    const rangeEnd = page.getByRole('textbox', { name: 'End Day' });
    await rangeEnd.click();
    await userEvent.keyboard('{ArrowUp}');
    expect(new FormData(form).get('dates.start')).toBe('2026-10-03');
  });

  test('pastes an ISO date into any segment as a complete value', async () => {
    await render(AdvancedFormFixture);
    const month = page.getByRole('textbox', { name: 'Due date Month' });
    const paste = (text) => {
      const event = new Event('paste', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } });
      month.element().dispatchEvent(event);
    };
    paste('2028-02-29');
    await new Promise((resolve) => setTimeout(resolve, 0));
    const form = page.getByRole('form', { name: 'Advanced controls' }).element();
    expect(new FormData(form).get('due')).toBe('2028-02-29');
    await expect.element(page.getByRole('textbox', { name: 'Due date Year' })).toHaveFocus();

    paste('1900-02-29');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(new FormData(form).get('due')).toBe('');
    expect(month.element().validationMessage).toBe('Enter a valid date.');
    paste('2000-02-29');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(new FormData(form).get('due')).toBe('2000-02-29');
  });

  test('opens hover card on keyboard focus and closes on Escape', async () => {
    await render(AdvancedFormFixture);
    const trigger = page.getByRole('button', { name: 'Preview item' });
    trigger.element().focus();
    await expect.element(page.getByRole('group', { name: 'Preview' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect.element(page.getByRole('group', { name: 'Preview' })).not.toBeInTheDocument();
  });

  test('positions the portalled hover card beside its trigger', async () => {
    await render(AdvancedFormFixture);
    const trigger = page.getByRole('button', { name: 'Preview item' });
    trigger.element().focus();
    const card = page.getByRole('group', { name: 'Preview' });
    await expect.element(card).toBeInTheDocument();
    const triggerRect = trigger.element().getBoundingClientRect();
    const cardRect = card.element().getBoundingClientRect();
    expect(getComputedStyle(card.element()).position).toBe('fixed');
    expect(cardRect.top >= triggerRect.bottom - 1 || cardRect.bottom <= triggerRect.top + 1).toBe(true);
    expect(cardRect.left).toBeGreaterThanOrEqual(0);
    expect(cardRect.right).toBeLessThanOrEqual(window.innerWidth);
  });

  test('keeps hover card open while the pointer enters its interactive content', async () => {
    await render(AdvancedFormFixture);
    await page.getByRole('button', { name: 'Preview item' }).hover();
    const card = page.getByRole('group', { name: 'Preview' });
    await expect.element(card).toBeInTheDocument();
    await page.getByRole('link', { name: 'Open details' }).hover();
    await new Promise((resolve) => setTimeout(resolve, 80));
    await expect.element(card).toBeInTheDocument();
  });

  test('closes hover card after activating its trigger', async () => {
    await render(AdvancedFormFixture);
    const trigger = page.getByRole('button', { name: 'Preview item' });
    trigger.element().focus();
    await expect.element(page.getByRole('group', { name: 'Preview' })).toBeInTheDocument();
    await trigger.click();
    await expect.element(page.getByRole('group', { name: 'Preview' })).not.toBeInTheDocument();
  });
});
