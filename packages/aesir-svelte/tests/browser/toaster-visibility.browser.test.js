import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { expect, test } from 'vitest';
import Toaster from '../../src/components/aesir-toast/aesir-toaster.svelte';
import { toast, toasts } from '../../src/components/aesir-toast/toast-store.js';

test('collapsed notifications are inert and keyboard focus reveals older actions', async () => {
  await render(Toaster);
  const earlier = toast.error('Earlier notification', undefined, { duration: 0, action: { label: 'Earlier action' } });
  toast.error('Latest notification', undefined, { duration: 0, action: { label: 'Latest action' } });

  const region = page.getByRole('region', { name: 'Notifications' });
  const latestAction = page.getByRole('button', { name: 'Latest action' });
  await expect.element(latestAction).toBeVisible();
  await expect.element(region).toHaveAttribute('data-expanded', 'false');
  expect(document.querySelector(`[data-toast-id="${earlier}"]`).inert).toBe(true);
  expect(document.querySelector(`[data-toast-id="${earlier}"]`).getAttribute('aria-hidden')).toBe('true');
  await expect.element(page.getByRole('button', { name: 'Earlier action' })).not.toBeInTheDocument();

  latestAction.element().focus();
  await expect.element(region).toHaveAttribute('data-expanded', 'true');
  await expect.element(page.getByRole('button', { name: 'Earlier action' })).toBeVisible();

  await userEvent.keyboard('{Tab}{Tab}');
  await expect.element(page.getByRole('button', { name: 'Earlier action' })).toHaveFocus();
  toasts.set([]);
});
