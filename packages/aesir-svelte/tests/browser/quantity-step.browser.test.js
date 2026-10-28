import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import QuantityStepFixture from '../fixtures/quantity-step-fixture.svelte';

test('stops at the last valid step before a non-aligned maximum', async () => {
  await render(QuantityStepFixture);
  const input = page.getByRole('spinbutton', { name: 'Quantity', exact: true });
  const increase = page.getByRole('button', { name: 'Increase quantity' });
  const form = page.getByRole('form', { name: 'Stepped quantity form' }).element();

  await expect.element(input).toHaveValue(5);
  await expect.element(increase).toBeDisabled();
  expect(input.element().checkValidity()).toBe(true);
  expect(new FormData(form).get('quantity')).toBe('5');
});

test('snaps a manually entered off-step number to a valid value', async () => {
  await render(QuantityStepFixture);
  const input = page.getByRole('spinbutton', { name: 'Quantity', exact: true });
  const form = page.getByRole('form', { name: 'Stepped quantity form' }).element();

  await input.fill('2');
  input.element().blur();
  await expect.element(input).toHaveValue(3);
  expect(input.element().checkValidity()).toBe(true);
  expect(new FormData(form).get('quantity')).toBe('3');
  await expect.element(page.getByRole('status', { name: 'Raw stepped quantity' })).toHaveTextContent('3');
});

test('recomputes the displayed value and button limits when step changes', async () => {
  await render(QuantityStepFixture);
  const input = page.getByRole('spinbutton', { name: 'Quantity', exact: true });
  const form = page.getByRole('form', { name: 'Stepped quantity form' }).element();

  await page.getByRole('button', { name: 'Set step to three' }).click();
  await expect.element(input).toHaveValue(4);
  await expect.element(page.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
  expect(input.element().checkValidity()).toBe(true);
  expect(new FormData(form).get('quantity')).toBe('4');
  await expect.element(page.getByRole('status', { name: 'Raw stepped quantity' })).toHaveTextContent('5');

  await page.getByRole('button', { name: 'Set step to two' }).click();
  await expect.element(input).toHaveValue(5);
  expect(new FormData(form).get('quantity')).toBe('5');
});

test('keeps decimal increments valid without exposing floating-point noise', async () => {
  await render(QuantityStepFixture);
  const input = page.getByRole('spinbutton', { name: 'Decimal quantity' });
  const form = page.getByRole('form', { name: 'Decimal quantity form' }).element();

  await page.getByRole('button', { name: 'Increase decimal quantity' }).click();
  await page.getByRole('button', { name: 'Increase decimal quantity' }).click();
  await expect.element(input).toHaveValue(0.3);
  expect(input.element().checkValidity()).toBe(true);
  expect(new FormData(form).get('decimal')).toBe('0.3');
});

test('does not discard valid digits from large integer values', async () => {
  await render(QuantityStepFixture);
  const input = page.getByRole('spinbutton', { name: 'Large quantity' });
  const form = page.getByRole('form', { name: 'Large quantity form' }).element();

  await expect.element(input).toHaveValue(1000000000001);
  await page.getByRole('button', { name: 'Increase large quantity' }).click();
  await expect.element(input).toHaveValue(1000000000002);
  expect(input.element().checkValidity()).toBe(true);
  expect(new FormData(form).get('large')).toBe('1000000000002');
});

test('uses a usable default increment when step is not positive', async () => {
  await render(QuantityStepFixture);
  const input = page.getByRole('spinbutton', { name: 'Fallback quantity' });

  await expect.element(input).toHaveAttribute('step', '1');
  await page.getByRole('button', { name: 'Increase fallback quantity' }).click();
  await expect.element(input).toHaveValue(3);
  expect(input.element().checkValidity()).toBe(true);
});

test('does not truncate a large range to twelve significant digits', async () => {
  await render(QuantityStepFixture);
  const input = page.getByRole('spinbutton', { name: 'Wide range quantity' });
  const form = page.getByRole('form', { name: 'Wide range form' }).element();

  await expect.element(input).toHaveValue(1000000000001);
  await page.getByRole('button', { name: 'Increase wide range quantity' }).click();
  await expect.element(input).toHaveValue(1000000000002);
  expect(input.element().checkValidity()).toBe(true);
  expect(new FormData(form).get('wide')).toBe('1000000000002');
});
