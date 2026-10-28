import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import DatePickerResetFixture from '../fixtures/date-picker-reset-fixture.svelte';

test('native form reset restores the selected date in the trigger, binding, and FormData', async () => {
  await render(DatePickerResetFixture);
  const form = page.getByRole('form', { name: 'Date form' }).element();
  const trigger = page.getByRole('button', { name: /Release date/ });
  const boundDate = page.getByRole('status', { name: 'Bound date' });

  await trigger.click();
  await page.getByRole('button', { name: 'Wednesday, September 16, 2026' }).click();
  await expect.element(boundDate).toHaveTextContent('2026-09-16');
  expect(new FormData(form).get('release')).toBe('2026-09-16');

  await trigger.click();
  await expect.element(page.getByRole('dialog', { name: 'Choose date' })).toBeVisible();
  form.reset();
  await expect.element(boundDate).toHaveTextContent('2026-09-15');
  await expect.element(trigger).toHaveTextContent('2026-09-15');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(page.getByRole('dialog', { name: 'Choose date' }).elements()).toHaveLength(0);
  expect(new FormData(form).get('release')).toBe('2026-09-15');
  await expect.element(page.getByRole('status', { name: 'Date selections' })).toHaveTextContent('1');
});
