import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import StatusBarFixture from './fixtures/status-bar-fixture.svelte';
import StatusBar from '../src/components/aesir-status-bar/aesir-status-bar.svelte';

describe('AesirStatusBar', () => {
  test('describes a focused interval and closes its tooltip with Escape', async () => {
    const user = userEvent.setup();
    render(StatusBarFixture);
    const interval = screen.getByRole('button', { name: 'Jun 15, 2026. Scheduled maintenance during this interval.' });

    interval.focus();
    const tooltip = await screen.findByRole('tooltip');

    expect(tooltip.textContent).toContain('Jun 15, 2026');
    expect(interval.getAttribute('aria-describedby')).toBe(tooltip.id);

    await user.keyboard('{Escape}');
    await waitFor(() => expect(interval.hasAttribute('aria-describedby')).toBe(false));
  });

  test('keeps an open tooltip synchronized with changed and removed items', async () => {
    const original = { id: 'current', label: 'Earlier status', status: 'maintenance', description: 'Earlier details.' };
    const updated = { id: 'current', label: 'Current status', status: 'operational', description: 'Current details.' };
    const { rerender } = render(StatusBar, { label: 'API', items: [original] });
    screen.getByRole('button', { name: 'Earlier status. Earlier details.' }).focus();
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.textContent).toContain('Earlier details.');

    await rerender({ label: 'API', items: [updated] });
    expect(tooltip.textContent).toContain('Current details.');
    expect(screen.getByRole('button', { name: 'Current status. Current details.' }).getAttribute('aria-describedby')).toBe(tooltip.id);

    await rerender({ label: 'API', items: [] });
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
  });

  test('keeps the epoch anchor when startDate changes from a Date to the equivalent timestamp', async () => {
    const props = {
      items: [{ time: 0, status: 'outage' }],
      interval: 10,
      total: 2,
      formatInterval: (start) => `${start.getTime()}`
    };
    const { rerender } = render(StatusBar, { ...props, startDate: new Date(0) });
    expect(screen.getByRole('region', { name: 'Service status history' }).getAttribute('data-status')).toBe('outage');

    await rerender({ ...props, startDate: 0 });
    expect(screen.getByRole('region', { name: 'Service status history' }).getAttribute('data-status')).toBe('outage');
  });
});
