import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import AesirInput from '../../src/components/aesir-input/aesir-input.svelte';

test('stops at the last valid step when the initial value defines the step base', async () => {
  const form = document.createElement('form');
  form.id = 'offset-step-form';
  document.body.append(form);

  try {
    await render(AesirInput, { type: 'number', label: 'Offset count', name: 'offset', form: form.id, value: 1.5, step: 2, max: 4 });
    const input = page.getByRole('spinbutton', { name: 'Offset count' });
    const increase = page.getByRole('button', { name: 'Increase Offset count' });

    expect(input.element().checkValidity()).toBe(true);
    expect(new FormData(form).get('offset')).toBe('1.5');
    await increase.click();
    await expect.element(input).toHaveValue(3.5);
    expect(input.element().checkValidity()).toBe(true);
    expect(new FormData(form).get('offset')).toBe('3.5');
    await expect.element(increase).toBeDisabled();

    form.reset();
    await expect.element(input).toHaveValue(1.5);
    expect(input.element().checkValidity()).toBe(true);
    expect(new FormData(form).get('offset')).toBe('1.5');
    await expect.element(increase).toBeEnabled();
  } finally {
    form.remove();
  }
});
