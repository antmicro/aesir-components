import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import SwitchResetFixture from '../fixtures/switch-reset-fixture.svelte';

test('switch does not report form resets through oncheckedchange', async () => {
  const changes = [];
  await render(SwitchResetFixture, { changes });
  const control = page.getByRole('switch', { name: 'Vim mode' });

  await page.getByText('Vim mode').click();
  await expect.element(control).toBeChecked();
  page.getByRole('form', { name: 'Settings' }).element().reset();

  await expect.element(control).not.toBeChecked();
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(changes).toEqual([true]);
});
