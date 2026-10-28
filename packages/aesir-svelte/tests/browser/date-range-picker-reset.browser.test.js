import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import DateRangePickerResetFixture from '../fixtures/date-range-picker-reset-fixture.svelte';

test('form reset restores the bound range as well as both visible dates', async () => {
  await render(DateRangePickerResetFixture);
  const form = page.getByRole('form', { name: 'Range form' }).element();
  const range = page.getByRole('group', { name: 'Deployment window' });
  const start = range.getByRole('button', { name: 'Start date' });
  const end = range.getByRole('button', { name: 'End date' });
  const boundRange = page.getByRole('status', { name: 'Bound range' });

  await start.click();
  await page.getByRole('button', { name: 'Friday, September 11, 2026' }).click();
  await end.click();
  await page.getByRole('button', { name: 'Monday, September 21, 2026' }).click();
  await expect.element(boundRange).toHaveTextContent('2026-09-11 / 2026-09-21');
  await expect.element(page.getByRole('status', { name: 'Range changes' })).toHaveTextContent('2');

  form.reset();
  await expect.element(start).toHaveTextContent('2026-09-10');
  await expect.element(end).toHaveTextContent('2026-09-20');
  await expect.element(boundRange).toHaveTextContent('2026-09-10 / 2026-09-20');
  await expect.element(page.getByRole('status', { name: 'Range changes' })).toHaveTextContent('2');
});
