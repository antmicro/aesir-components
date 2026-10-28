import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import QuantityDynamicFixture from '../fixtures/quantity-dynamic-fixture.svelte';

test('displays and submits the in-range value when bounds change', async () => {
  await render(QuantityDynamicFixture);
  const input = page.getByRole('spinbutton', { name: 'Quantity' });
  const form = page.getByRole('form', { name: 'Quantity form' }).element();
  await expect.element(input).toHaveValue(5);

  await page.getByRole('button', { name: 'Narrow range' }).click();
  await expect.element(input).toHaveValue(3);
  expect(input.element().checkValidity()).toBe(true);
  expect(new FormData(form).get('quantity')).toBe('3');
  await expect.element(page.getByRole('status', { name: 'Raw quantity' })).toHaveTextContent('5');

  await input.fill('4');
  input.element().blur();
  await expect.element(input).toHaveValue(3);
  expect(new FormData(form).get('quantity')).toBe('3');
  await expect.element(page.getByRole('status', { name: 'Raw quantity' })).toHaveTextContent('3');

  form.reset();
  await expect.element(input).toHaveValue(3);
  expect(new FormData(form).get('quantity')).toBe('3');

  await page.getByRole('button', { name: 'Widen range' }).click();
  await expect.element(input).toHaveValue(5);
  expect(new FormData(form).get('quantity')).toBe('5');
});

test('keeps an externally lowered value within a new minimum', async () => {
  await render(QuantityDynamicFixture);
  const input = page.getByRole('spinbutton', { name: 'Quantity' });
  const form = page.getByRole('form', { name: 'Quantity form' }).element();

  await page.getByRole('button', { name: 'Set quantity to two' }).click();
  await expect.element(input).toHaveValue(2);
  await page.getByRole('button', { name: 'Raise minimum' }).click();
  await expect.element(input).toHaveValue(3);
  expect(input.element().checkValidity()).toBe(true);
  expect(new FormData(form).get('quantity')).toBe('3');

  await page.getByRole('button', { name: 'Lower minimum' }).click();
  await expect.element(input).toHaveValue(2);
  expect(new FormData(form).get('quantity')).toBe('2');
});

test('restores the displayed minimum when an input is cleared', async () => {
  await render(QuantityDynamicFixture);
  const input = page.getByRole('spinbutton', { name: 'Quantity' });
  const form = page.getByRole('form', { name: 'Quantity form' }).element();

  await input.fill('1');
  input.element().blur();
  await expect.element(input).toHaveValue(1);

  await input.fill('');
  input.element().blur();
  await expect.element(input).toHaveValue(1);
  expect(new FormData(form).get('quantity')).toBe('1');
});
