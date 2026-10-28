import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import AesirInput from '../../src/components/aesir-input/aesir-input.svelte';
import InputStepFixture from '../fixtures/input-step-fixture.svelte';

test('disables the number-input increment at the last valid step', async () => {
  await render(InputStepFixture);
  const input = page.getByRole('spinbutton', { name: 'Seats', exact: true });
  const increase = page.getByRole('button', { name: 'Increase Seats', exact: true });
  const form = page.getByRole('form', { name: 'Stepped number form' }).element();

  await expect.element(input).toHaveValue(5);
  await expect.element(increase).toBeDisabled();
  expect(input.element().checkValidity()).toBe(true);
  expect(new FormData(form).get('seats')).toBe('5');
});

test('recalculates the increment limit when max or step changes', async () => {
  await render(InputStepFixture);
  const input = page.getByRole('spinbutton', { name: 'Seats', exact: true });
  const increase = page.getByRole('button', { name: 'Increase Seats', exact: true });

  await page.getByRole('button', { name: 'Raise maximum' }).click();
  await expect.element(increase).toBeEnabled();
  await increase.click();
  await expect.element(input).toHaveValue(7);
  expect(input.element().checkValidity()).toBe(true);
});

test('recalculates the increment limit when only step changes', async () => {
  await render(InputStepFixture);
  const input = page.getByRole('spinbutton', { name: 'Seats', exact: true });
  const increase = page.getByRole('button', { name: 'Increase Seats', exact: true });

  await page.getByRole('button', { name: 'Use unit steps' }).click();
  await expect.element(increase).toBeEnabled();
  await increase.click();
  await expect.element(input).toHaveValue(6);
  expect(input.element().checkValidity()).toBe(true);
});

test('treats a decimal maximum as reachable without floating-point drift', async () => {
  await render(InputStepFixture);
  const input = page.getByRole('spinbutton', { name: 'Decimal seats' });
  const increase = page.getByRole('button', { name: 'Increase Decimal seats' });

  await expect.element(input).toHaveValue(0.3);
  await expect.element(increase).toBeDisabled();
  expect(input.element().checkValidity()).toBe(true);
});

test('increments a number input with step any without throwing', async () => {
  await render(InputStepFixture);
  const input = page.getByRole('spinbutton', { name: 'Any-step seats' });
  const form = page.getByRole('form', { name: 'Any step form' }).element();

  await page.getByRole('button', { name: 'Increase Any-step seats' }).click();
  await expect.element(input).toHaveValue(6);
  await expect.element(page.getByRole('button', { name: 'Increase Any-step seats' })).toBeDisabled();
  expect(new FormData(form).get('any')).toBe('6');
  await expect.element(page.getByRole('status', { name: 'Raw any-step seats' })).toHaveTextContent('6');
  await page.getByRole('button', { name: 'Decrease Any-step seats' }).click();
  await expect.element(input).toHaveValue(5);
  await expect.element(page.getByRole('status', { name: 'Raw any-step seats' })).toHaveTextContent('5');
  expect(input.element().checkValidity()).toBe(true);
});

test('starts an empty any-step number input at its minimum', async () => {
  await render(AesirInput, { type: 'number', label: 'Empty seats', value: '', min: 2, max: 8, step: 'any' });
  const input = page.getByRole('spinbutton', { name: 'Empty seats' });

  await page.getByRole('button', { name: 'Increase Empty seats' }).click();

  await expect.element(input).toHaveValue(2);
  expect(input.element().checkValidity()).toBe(true);
});
