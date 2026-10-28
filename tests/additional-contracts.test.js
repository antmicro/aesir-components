import { render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import AesirDateRangePicker from '../src/components/aesir-date-range-picker/aesir-date-range-picker.svelte';
import AesirSelectionToolbar from '../src/components/aesir-selection-toolbar/aesir-selection-toolbar.svelte';
import AdditionalContractsFixture from './fixtures/additional-contracts-fixture.svelte';

describe('additional component contracts', () => {
  test('quantity stepper respects boundaries, emits real changes, and forwards public attributes', async () => {
    const user = userEvent.setup();
    render(AdditionalContractsFixture);
    const group = screen.getByRole('group', { name: 'Seats' });
    const decrease = screen.getByRole('button', { name: 'Decrease seats' });
    const increase = screen.getByRole('button', { name: 'Increase seats' });
    const input = screen.getByRole('spinbutton', { name: 'Seats' });

    expect(group.classList.contains('consumer-quantity')).toBe(true);
    expect(input.getAttribute('name')).toBe('quantity');
    await user.click(increase);
    expect(screen.getByRole('status', { name: 'Quantity value' }).textContent).toBe('3');
    expect(screen.getByRole('status', { name: 'Quantity changes' }).textContent).toBe('1');
    expect(increase.disabled).toBe(true);

    await user.click(increase);
    expect(screen.getByRole('status', { name: 'Quantity changes' }).textContent).toBe('1');
    await user.click(decrease);
    expect(screen.getByRole('status', { name: 'Quantity value' }).textContent).toBe('2');
  });

  test('disabled quantity stepper is entirely non-interactive', async () => {
    const user = userEvent.setup();
    render(AdditionalContractsFixture);
    const group = screen.getByRole('group', { name: 'Disabled seats' });

    expect(group.dataset.disabled).toBe('true');
    expect([...group.querySelectorAll('button, input')].every((control) => control.disabled)).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Increase disabled seats' }));
    expect(screen.getByRole('status', { name: 'Quantity changes' }).textContent).toBe('0');
  });

  test('commits manual quantity input once even when change is followed by blur', async () => {
    const user = userEvent.setup();
    render(AdditionalContractsFixture);
    const input = screen.getByRole('spinbutton', { name: 'Seats' });

    await user.clear(input);
    await user.type(input, '3');
    await user.tab();

    expect(screen.getByRole('status', { name: 'Quantity value' }).textContent).toBe('3');
    expect(screen.getByRole('status', { name: 'Quantity changes' }).textContent).toBe('1');
  });

  test('date range constrains each endpoint and reports the complete next range', async () => {
    const user = userEvent.setup();
    render(AdditionalContractsFixture);

    const range = screen.getByRole('group', { name: 'Deployment window' });
    await user.click(within(range).getByRole('button', { name: 'Start date' }));
    expect(screen.getByRole('button', { name: 'Monday, September 21, 2026' }).disabled).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Tuesday, September 15, 2026' }));

    expect(screen.getByRole('status', { name: 'Range start' }).textContent).toBe('2026-09-15');
    expect(screen.getByRole('status', { name: 'Range end' }).textContent).toBe('2026-09-20');
    expect(screen.getByRole('status', { name: 'Range changes' }).textContent).toBe('1');

    await user.click(within(range).getByRole('button', { name: 'End date' }));
    expect(screen.getByRole('button', { name: 'Monday, September 14, 2026' }).disabled).toBe(true);
    await user.keyboard('{Escape}');

    const disabledRange = screen.getByRole('group', { name: 'Disabled window' });
    expect([...disabledRange.querySelectorAll('button')].every((button) => button.disabled)).toBe(true);
  });

  test('date range keeps global limits when the other endpoint is outside them', async () => {
    const user = userEvent.setup();
    render(AesirDateRangePicker, {
      value: { start: '2026-09-15', end: '2026-11-05' },
      min: '2026-10-01',
      max: '2026-10-31'
    });

    await user.click(screen.getByRole('button', { name: 'Start date' }));
    expect(screen.getByRole('group', { name: 'October 2026' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('button', { name: 'Sunday, November 1, 2026' }).disabled).toBe(true);
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'End date' }));
    expect(screen.getByRole('group', { name: 'October 2026' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByRole('button', { name: 'Wednesday, September 30, 2026' }).disabled).toBe(true);
  });

  test('date range opens at a distant allowed month instead of the current month', async () => {
    const user = userEvent.setup();
    const year = new Date().getFullYear() + 3;
    const min = `${year}-09-15`;
    const max = `${year}-09-30`;
    render(AesirDateRangePicker, { min, max, locale: 'en-US' });

    await user.click(screen.getByRole('button', { name: 'Start date' }));

    expect(screen.getByRole('group', { name: `September ${year}` })).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Choose date' }).querySelector(`[data-date="${min}"]`)?.disabled).toBe(false);
  });

  test.each([
    { editedEndpoint: 'Start date', invalidValue: { start: '2026-09-15', end: '0000-00-00' }, availableDate: 'Wednesday, September 16, 2026' },
    { editedEndpoint: 'End date', invalidValue: { start: '9999-99-99', end: '2026-09-20' }, availableDate: 'Monday, September 21, 2026' }
  ])('date range ignores an invalid peer endpoint after its value changes: $editedEndpoint', async ({ editedEndpoint, invalidValue, availableDate }) => {
    const user = userEvent.setup();
    const props = { value: { start: '2026-09-15', end: '2026-09-20' }, locale: 'en-US' };
    const { rerender } = render(AesirDateRangePicker, props);

    await user.click(screen.getByRole('button', { name: editedEndpoint }));
    await rerender({ ...props, value: invalidValue });

    expect(screen.getByRole('button', { name: availableDate }).disabled).toBe(false);
  });

  test('selection toolbar derives visibility from count and clears through its public action', async () => {
    const user = userEvent.setup();
    render(AdditionalContractsFixture);
    const toolbar = screen.getByRole('toolbar', { name: 'Selection actions' });

    expect(toolbar.dataset.position).toBe('inline');
    expect(toolbar.textContent).toMatch(/2\s+selected/);
    await user.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(toolbar.dataset.state).toBe('closed');
  });

  test('explicit selection-toolbar visibility overrides an empty count', async () => {
    const { rerender } = render(AesirSelectionToolbar, { count: 0, visible: true, position: 'inline' });
    const toolbar = screen.getByRole('toolbar', { name: 'Selection actions' });
    expect(toolbar.dataset.state).toBe('open');

    await rerender({ count: 3, visible: false, position: 'inline' });
    expect(toolbar.dataset.state).toBe('closed');
    expect(toolbar.hasAttribute('inert')).toBe(true);
    expect(screen.queryByRole('toolbar', { name: 'Selection actions' })).toBeNull();
  });

  test('moves the selection toolbar between fixed portal and inline layout when position changes', async () => {
    const { container, rerender } = render(AesirSelectionToolbar, { count: 2, position: 'fixed' });
    const toolbar = screen.getByRole('toolbar', { name: 'Selection actions' });

    await waitFor(() => expect(toolbar.parentElement).toBe(document.body));
    await rerender({ count: 2, position: 'inline' });
    await waitFor(() => expect(container.contains(toolbar)).toBe(true));

    await rerender({ count: 2, position: 'fixed' });
    await waitFor(() => expect(toolbar.parentElement).toBe(document.body));
  });
});
