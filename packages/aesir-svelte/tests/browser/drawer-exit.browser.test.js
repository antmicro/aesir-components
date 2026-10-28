import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import Drawer from '../../src/components/aesir-drawer/aesir-drawer.svelte';

test('removes an exiting drawer from the accessibility tree until it reopens', async () => {
  const rendered = await render(Drawer, { open: true, label: 'Project details' });
  const dialog = page.getByRole('dialog', { name: 'Project details' });
  await expect.element(dialog).toBeInTheDocument();

  await rendered.rerender({ open: false, label: 'Project details' });
  const exiting = document.querySelector('.aesir-drawer[data-state="closed"]');
  expect(exiting).not.toBeNull();
  expect(exiting.getAttribute('aria-hidden')).toBe('true');
  expect(exiting.inert).toBe(true);
  await expect.element(dialog).not.toBeInTheDocument();

  await rendered.rerender({ open: true, label: 'Project details' });
  await expect.element(dialog).toBeInTheDocument();
  expect(document.querySelector('.aesir-drawer').inert).toBe(false);
});
