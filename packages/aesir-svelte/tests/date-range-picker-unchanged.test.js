import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import AdditionalContractsFixture from './fixtures/additional-contracts-fixture.svelte';

test('selecting an unchanged range endpoint does not report a change', async () => {
  const user = userEvent.setup();
  render(AdditionalContractsFixture);
  const range = screen.getByRole('group', { name: 'Deployment window' });
  const changes = screen.getByRole('status', { name: 'Range changes' });

  await user.click(within(range).getByRole('button', { name: 'Start date' }));
  await user.click(screen.getByRole('button', { name: 'Thursday, September 10, 2026' }));
  expect(changes.textContent).toBe('0');

  await user.click(within(range).getByRole('button', { name: 'End date' }));
  await user.click(screen.getByRole('button', { name: 'Sunday, September 20, 2026' }));
  expect(changes.textContent).toBe('0');
});
