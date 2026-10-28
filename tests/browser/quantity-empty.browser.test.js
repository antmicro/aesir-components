import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test, vi } from 'vitest';
import { AesirQuantityStepper } from '../../src/index.js';

test('clearing a quantity with a negative minimum restores the minimum', async () => {
  const onchange = vi.fn();
  await render(AesirQuantityStepper, { value: 2, min: -5, max: 5, label: 'Quantity', onchange });
  const input = page.getByRole('spinbutton', { name: 'Quantity' });

  await input.fill('');
  input.element().blur();

  await expect.element(input).toHaveValue(-5);
  expect(onchange).toHaveBeenCalledExactlyOnceWith(-5);
});
