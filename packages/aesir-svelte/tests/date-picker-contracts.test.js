import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { AesirDatePicker } from '../src/index.js';
import DatePickerContractsFixture from './fixtures/date-picker-contracts-fixture.svelte';
import DatePickerResetFixture from './fixtures/date-picker-reset-fixture.svelte';
import DatePickerModalFixture from './fixtures/date-picker-modal-fixture.svelte';

describe('AesirDatePicker public behavior', () => {
  test('portals above its parent modal and dismisses only the calendar on the first Escape', async () => {
    const user = userEvent.setup();
    render(DatePickerModalFixture);
    const modalTrigger = screen.getByRole('button', { name: 'Open scheduler' });
    await user.click(modalTrigger);
    const dialog = screen.getByRole('dialog', { name: 'Scheduler' });
    const dateTrigger = screen.getByRole('button', { name: 'Send date' });
    await user.click(dateTrigger);
    const calendar = screen.getByRole('dialog', { name: 'Choose date' });
    await waitFor(() => expect(Number(calendar.style.zIndex)).toBeGreaterThan(70));
    expect(calendar.parentElement).toBe(document.body);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Choose date' })).toBeNull();
    expect(dialog.isConnected).toBe(true);
    expect(document.activeElement).toBe(dateTrigger);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Scheduler' })).toBeNull());
    expect(document.activeElement).toBe(modalTrigger);
  });
  test('native form reset restores the initial date and submitted value without selecting again', async () => {
    const user = userEvent.setup();
    render(DatePickerResetFixture);
    const form = screen.getByRole('form', { name: 'Date form' });

    await user.click(screen.getByRole('button', { name: /Release date/ }));
    await user.click(screen.getByRole('button', { name: 'Wednesday, September 16, 2026' }));
    expect(screen.getByRole('status', { name: 'Bound date' }).textContent).toBe('2026-09-16');
    expect(new FormData(form).get('release')).toBe('2026-09-16');

    form.reset();
    await waitFor(() => expect(screen.getByRole('status', { name: 'Bound date' }).textContent).toBe('2026-09-15'));
    expect(new FormData(form).get('release')).toBe('2026-09-15');
    expect(screen.getByRole('status', { name: 'Date selections' }).textContent).toBe('1');
  });
  test.each(['not-a-date', '2026-02-31', '2026-13-01'])('opens safely with an invalid external value: %s', async (value) => {
    const user = userEvent.setup();
    render(AesirDatePicker, { label: 'Invalid date', value });

    await user.click(screen.getByRole('button', { name: /Invalid date/ }));
    const cells = Array.from(screen.getByRole('dialog', { name: 'Choose date' }).querySelectorAll('[data-date]'));
    const dates = cells.map((cell) => cell.getAttribute('data-date'));
    expect(dates).toHaveLength(42);
    expect(new Set(dates).size).toBe(42);
    expect(dates.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))).toBe(true);
  });

  test('closes an open calendar when disabled changes to true', async () => {
    const user = userEvent.setup();
    const { rerender } = render(AesirDatePicker, { label: 'Dynamic date', value: '2026-09-15' });
    await user.click(screen.getByRole('button', { name: 'Dynamic date' }));
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeTruthy();

    await rerender({ label: 'Dynamic date', value: '2026-09-15', disabled: true });
    expect(screen.queryByRole('dialog', { name: 'Choose date' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Dynamic date' }).getAttribute('aria-expanded')).toBe('false');
  });

  test('shows a newly controlled value in an already open calendar', async () => {
    const user = userEvent.setup();
    const props = { label: 'Dynamic date', locale: 'en-US', value: '2026-09-15' };
    const { rerender } = render(AesirDatePicker, props);
    await user.click(screen.getByRole('button', { name: 'Dynamic date' }));

    await rerender({ ...props, value: '2027-02-14' });

    expect(screen.getByRole('button', { name: /Dynamic date/ }).textContent).toContain('2027-02-14');
    expect(screen.getByRole('group', { name: 'February 2027' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sunday, February 14, 2027' }).getAttribute('aria-pressed')).toBe('true');

    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('group', { name: 'March 2027' })).toBeTruthy();
  });

  test('moves an open calendar to a newly constrained month', async () => {
    const user = userEvent.setup();
    const year = new Date().getFullYear() + 3;
    const min = `${year}-09-15`;
    const { rerender } = render(AesirDatePicker, { label: 'Release date', value: '' });
    await user.click(screen.getByRole('button', { name: 'Release date' }));

    await rerender({ label: 'Release date', value: '', min });

    expect(screen.getByRole('group', { name: `September ${year}` })).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Choose date' }).querySelector(`[data-date="${min}"]`)?.disabled).toBe(false);
  });

  test('uses the locale week start and moves between dates from the keyboard', async () => {
    const user = userEvent.setup();
    render(DatePickerContractsFixture);
    await user.click(screen.getByRole('button', { name: /Release date/ }));
    const calendar = screen.getByRole('dialog', { name: 'Choose date' });
    expect(calendar.querySelector('.weekday')?.textContent).toBe('Sun');
    expect(calendar.style.zIndex).toBe('');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Tuesday, September 15, 2026' }));
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Wednesday, September 16, 2026' }));
    await user.keyboard('{Enter}');
    expect(screen.getByRole('status', { name: 'Selected date' }).textContent).toBe('2026-09-16');
  });
  test('does not open or receive focus when disabled', async () => {
    const user = userEvent.setup();
    render(DatePickerContractsFixture);
    const disabledTrigger = screen.getByRole('button', { name: /Disabled date/ });

    expect(disabledTrigger.disabled).toBe(true);
    await user.click(disabledTrigger);
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.tab();
    expect(document.activeElement).not.toBe(disabledTrigger);
  });

  test('enforces date limits and emits a selected value once', async () => {
    const user = userEvent.setup();
    render(DatePickerContractsFixture);
    const trigger = screen.getByRole('button', { name: /Release date/ });

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Wednesday, September 9, 2026' }).disabled).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Wednesday, September 16, 2026' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('status', { name: 'Selected date' }).textContent).toBe('2026-09-16');
    expect(screen.getByRole('status', { name: 'Date selections' }).textContent).toBe('1');
  });

  test('closes on Escape and restores focus to its trigger', async () => {
    const user = userEvent.setup();
    render(DatePickerContractsFixture);
    const trigger = screen.getByRole('button', { name: /Release date/ });

    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeTruthy();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  test('does not select disabled boundary-exceeding dates through synthetic clicks', async () => {
    const user = userEvent.setup();
    render(DatePickerContractsFixture);

    await user.click(screen.getByRole('button', { name: /Release date/ }));
    const disabledDate = screen.getByRole('button', { name: 'Wednesday, September 9, 2026' });
    disabledDate.click();

    expect(screen.getByRole('status', { name: 'Date selections' }).textContent).toBe('0');
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeTruthy();
  });

  test('closes on an outside primary press without changing the value', async () => {
    const user = userEvent.setup();
    render(DatePickerContractsFixture);
    const trigger = screen.getByRole('button', { name: /Release date/ });

    await user.click(trigger);
    await fireEvent.pointerDown(screen.getByRole('button', { name: /Disabled date/ }), { button: 0 });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('status', { name: 'Date selections' }).textContent).toBe('0');
  });
});
