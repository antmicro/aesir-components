import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import AdditionalContractsFixture from '../fixtures/additional-contracts-fixture.svelte';

test('selecting an already selected range date closes the calendar without reporting a change', async () => {
  await render(AdditionalContractsFixture);
  const range = page.getByRole('group', { name: 'Deployment window' });
  const changes = page.getByRole('status', { name: 'Range changes' });

  await range.getByRole('button', { name: 'Start date' }).click();
  await page.getByRole('button', { name: 'Thursday, September 10, 2026' }).click();

  await expect.element(changes).toHaveTextContent('0');
  await expect.element(page.getByRole('dialog', { name: 'Choose date' })).not.toBeInTheDocument();
});
