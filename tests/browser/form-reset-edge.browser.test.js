import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import AesirInput from '../../src/components/aesir-input/aesir-input.svelte';
import FormResetEdgeFixture from '../fixtures/form-reset-edge-fixture.svelte';

test('restores a mixed checkbox after native form reset', async () => {
  await render(FormResetEdgeFixture);
  const checkbox = page.getByRole('checkbox', { name: 'Partial selection' });
  const form = page.getByRole('form', { name: 'Reset edge cases' }).element();
  expect(checkbox.element().indeterminate).toBe(true);

  await page.getByText('Partial selection').click();
  expect(checkbox.element().indeterminate).toBe(false);
  expect(checkbox.element().checked).toBe(true);

  form.reset();
  await expect.element(checkbox).toHaveAttribute('aria-checked', 'mixed');
  expect(checkbox.element().indeterminate).toBe(true);
  expect(checkbox.element().checked).toBe(false);
});

test('keeps slider output and native value aligned after form reset', async () => {
  await render(FormResetEdgeFixture);
  const slider = page.getByRole('slider', { name: 'Level' });
  const form = page.getByRole('form', { name: 'Reset edge cases' }).element();
  const output = slider.element().closest('.aesir-slider').querySelector('output');

  form.reset();
  await expect.element(slider).toHaveValue('20');
  expect(output.textContent).toBe('20');

  slider.element().value = '80';
  slider.element().dispatchEvent(new Event('input', { bubbles: true }));
  await expect.element(slider).toHaveValue('80');
  expect(output.textContent).toBe('80');

  form.reset();
  await expect.element(slider).toHaveValue('20');
  expect(output.textContent).toBe('20');
  expect(new FormData(form).get('level')).toBe('20');

  form.reset();
  await expect.element(slider).toHaveValue('20');
  expect(output.textContent).toBe('20');
});

test('restores textarea text and count after native form reset', async () => {
  await render(FormResetEdgeFixture);
  const notes = page.getByRole('textbox', { name: 'Notes' });
  const form = page.getByRole('form', { name: 'Reset edge cases' }).element();
  const count = notes.element().closest('.aesir-textarea').querySelector('.aesir-textarea__count');

  form.reset();
  await expect.element(notes).toHaveValue('Initial');
  expect(count.textContent.trim()).toBe('7');

  await notes.fill('Changed text');
  expect(count.textContent.trim()).toBe('12');
  expect(new FormData(form).get('notes')).toBe('Changed text');

  form.reset();
  await expect.element(notes).toHaveValue('Initial');
  expect(count.textContent.trim()).toBe('7');
  expect(new FormData(form).get('notes')).toBe('Initial');

  form.reset();
  await expect.element(notes).toHaveValue('Initial');
  expect(count.textContent.trim()).toBe('7');
});

test('preserves edited values when a form reset is canceled', async () => {
  await render(FormResetEdgeFixture);
  const form = page.getByRole('form', { name: 'Reset edge cases' }).element();
  const notes = page.getByRole('textbox', { name: 'Notes' });
  const slider = page.getByRole('slider', { name: 'Level' });

  await notes.fill('Keep this text');
  slider.element().value = '80';
  slider.element().dispatchEvent(new Event('input', { bubbles: true }));
  await expect.element(slider).toHaveValue('80');
  form.addEventListener('reset', (event) => event.preventDefault());

  form.reset();
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(notes.element().value).toBe('Keep this text');
  expect(slider.element().value).toBe('80');
  expect(new FormData(form).get('notes')).toBe('Keep this text');
  expect(new FormData(form).get('level')).toBe('80');
});

test('resets only with the form currently associated with a field', async () => {
  const first = document.createElement('form');
  first.id = 'first-reset-form';
  const second = document.createElement('form');
  second.id = 'second-reset-form';
  document.body.append(first, second);

  try {
    const rendered = await render(AesirInput, { label: 'Name', value: 'Initial', form: first.id });
    const input = page.getByRole('textbox', { name: 'Name' });
    await rendered.rerender({ label: 'Name', value: 'Changed', form: second.id });
    expect(input.element().form).toBe(second);

    first.reset();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(input.element().value).toBe('Changed');

    second.reset();
    await expect.element(input).toHaveValue('Initial');
  } finally {
    first.remove();
    second.remove();
  }
});

test('restores a field that gains a form association after mount', async () => {
  const form = document.createElement('form');
  form.id = 'late-reset-form';
  document.body.append(form);

  try {
    const rendered = await render(AesirInput, { label: 'Late name', value: 'Initial' });
    const input = page.getByRole('textbox', { name: 'Late name' });
    await rendered.rerender({ label: 'Late name', value: 'Changed', form: form.id });
    expect(input.element().form).toBe(form);

    form.reset();
    await expect.element(input).toHaveValue('Initial');
  } finally {
    form.remove();
  }
});
