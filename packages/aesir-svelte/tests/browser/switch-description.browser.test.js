import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import Switch from '../../src/components/aesir-switch/aesir-switch.svelte';

test('switch description activates the native label without changing the accessible name', async () => {
  await render(Switch, { label: 'Incident alerts', description: 'Notify the on-call team.' });
  const control = page.getByRole('switch', { name: 'Incident alerts', description: 'Notify the on-call team.' });

  await page.getByText('Notify the on-call team.').click();

  await expect.element(control).toBeChecked();
});
