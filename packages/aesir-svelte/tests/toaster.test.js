import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import Toaster from '../src/components/aesir-toast/aesir-toaster.svelte';
import { toast, toasts } from '../src/components/aesir-toast/toast-store.js';

test('updates stable, separate live regions without putting actions inside them', async () => {
  render(Toaster);
  const polite = screen.getByRole('status');
  const urgent = screen.getByRole('alert');
  expect(polite.textContent.trim()).toBe('');
  expect(urgent.textContent.trim()).toBe('');
  toast.success('Saved', undefined, { duration: 0 });
  toast.error('Failed', 'Try again', { action: { label: 'Retry' } });
  await waitFor(() => expect(polite.textContent).toContain('Saved'));
  expect(urgent.textContent).toContain('Failed. Try again');
  expect(screen.getByRole('status')).toBe(polite);
  expect(screen.getByRole('alert')).toBe(urgent);
  expect(urgent.querySelector('button')).toBeNull();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  toasts.set([]);
  await waitFor(() => expect(polite.textContent.trim()).toBe(''));
  expect(screen.getByRole('alert')).toBe(urgent);
});

test('identifies which notification each dismiss button closes after titles change', async () => {
  render(Toaster);
  const first = toast.error('Payment failed', undefined, { duration: 0 });
  toast.error('Upload failed', undefined, { duration: 0 });

  await fireEvent.mouseEnter(screen.getByRole('region', { name: 'Notifications' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Dismiss notification: Payment failed' })).toBeTruthy());
  expect(screen.getByRole('button', { name: 'Dismiss notification: Upload failed' })).toBeTruthy();

  toast.update(first, { title: 'Payment retried' });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Dismiss notification: Payment retried' })).toBeTruthy());
  expect(screen.queryByRole('button', { name: 'Dismiss notification: Payment failed' })).toBeNull();
  toasts.set([]);
});

test('exposes only the front toast while the stack is collapsed', async () => {
  render(Toaster);
  const earlier = toast.error('Earlier notification', undefined, { duration: 0, action: { label: 'Earlier action' } });
  const latest = toast.error('Latest notification', undefined, { duration: 0, action: { label: 'Latest action' } });

  const region = screen.getByRole('region', { name: 'Notifications' });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Latest action' })).toBeTruthy());
  expect(screen.queryByRole('button', { name: 'Earlier action' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Dismiss notification: Earlier notification' })).toBeNull();
  expect(region.querySelector(`[data-toast-id="${earlier}"]`).inert).toBe(true);

  await fireEvent.mouseEnter(region);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Earlier action' })).toBeTruthy());
  expect(screen.getByRole('button', { name: 'Dismiss notification: Earlier notification' })).toBeTruthy();
  expect(region.querySelector(`[data-toast-id="${earlier}"]`).inert).toBe(false);

  await fireEvent.mouseLeave(region);
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Earlier action' })).toBeNull());
  toast.dismiss(latest);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Earlier action' })).toBeTruthy());
  expect(screen.queryByRole('button', { name: 'Latest action' })).toBeNull();
  expect(region.querySelector(`[data-toast-id="${latest}"]`).inert).toBe(true);
  toasts.set([]);
});

test('focus expands the stack and tabs from the newest toast to older actions', async () => {
  const user = userEvent.setup();
  render(Toaster);
  toast.error('Earlier notification', undefined, { duration: 0, action: { label: 'Earlier action' } });
  const latest = toast.error('Latest notification', undefined, { duration: 0, action: { label: 'Latest action' } });

  const region = screen.getByRole('region', { name: 'Notifications' });
  const latestAction = await screen.findByRole('button', { name: 'Latest action' });
  latestAction.focus();
  await waitFor(() => expect(region.dataset.expanded).toBe('true'));
  const earlierAction = screen.getByRole('button', { name: 'Earlier action' });

  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Dismiss notification: Latest notification' }));
  await user.tab();
  expect(document.activeElement).toBe(earlierAction);

  earlierAction.blur();
  await waitFor(() => expect(region.dataset.expanded).toBe('false'));

  latestAction.focus();
  await waitFor(() => expect(region.dataset.expanded).toBe('true'));
  toast.dismiss(latest);
  await waitFor(() => expect(region.dataset.expanded).toBe('false'));
  expect(screen.getByRole('button', { name: 'Earlier action' })).toBeTruthy();
  toasts.set([]);
});

test('preserves stack expansion when consumers listen for pointer entry', async () => {
  const onmouseenter = vi.fn();
  const onmouseleave = vi.fn();
  render(Toaster, { onmouseenter, onmouseleave, style: '--consumer-color: red' });
  try {
    toast.error('Earlier notification', undefined, { duration: 0 });
    toast.error('Latest notification', undefined, { duration: 0 });
    const region = screen.getByRole('region', { name: 'Notifications' });

    await fireEvent.mouseEnter(region);

    expect(onmouseenter).toHaveBeenCalledOnce();
    expect(region.dataset.expanded).toBe('true');
    expect(region.style.getPropertyValue('--consumer-color')).toBe('red');
    expect(region.style.getPropertyValue('--aesir-toast-stack-height')).not.toBe('');

    await fireEvent.mouseLeave(region);
    expect(onmouseleave).toHaveBeenCalledOnce();
    expect(region.dataset.expanded).toBe('false');
  } finally {
    toasts.set([]);
  }
});

test('keeps its stack-height style when a consumer adds root styles', () => {
  render(Toaster, { style: '--consumer-color: red' });
  const region = screen.getByRole('region', { name: 'Notifications' });

  expect(region.style.getPropertyValue('--consumer-color')).toBe('red');
  expect(region.style.getPropertyValue('--aesir-toast-stack-height')).not.toBe('');
});
