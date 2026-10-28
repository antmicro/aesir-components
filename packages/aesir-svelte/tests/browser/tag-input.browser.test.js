import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { expect, test } from 'vitest';
import AesirTagInput from '../../src/components/aesir-tag-input/aesir-tag-input.svelte';
import TagInputResetFixture from '../fixtures/tag-input-reset-fixture.svelte';

test('a full tag input stays focusable and becomes editable after removing a tag', async () => {
  await render(AesirTagInput, {
    label: 'Topics',
    options: [
      { label: 'Alpha', value: 'a' },
      { label: 'Beta', value: 'b' }
    ],
    value: ['a'],
    max: 1
  });

  const input = page.getByRole('combobox', { name: 'Topics' });
  expect(input.element().readOnly).toBe(true);
  await input.click();
  expect(document.activeElement).toBe(input.element());
  expect(page.getByRole('listbox').query()).toBeNull();

  await userEvent.keyboard('{Backspace}');
  expect(page.getByRole('button', { name: 'Remove Alpha' }).query()).toBeNull();
  expect(input.element().readOnly).toBe(false);

  await userEvent.keyboard('Bet');
  await expect.element(page.getByRole('option', { name: 'Beta' })).toBeVisible();
});

test('form reset restores the selected tags in the UI and native form data', async () => {
  await render(TagInputResetFixture);
  const form = page.getByRole('form', { name: 'Topics form' }).element();

  await page.getByRole('combobox', { name: 'Topics' }).click();
  await page.getByRole('option', { name: 'Beta' }).click();
  await expect.element(page.getByRole('status', { name: 'Selected topics' })).toHaveTextContent('a,b');
  expect(new FormData(form).getAll('topics')).toEqual(['a', 'b']);
  await page.getByRole('combobox', { name: 'Topics' }).fill('pending');

  form.reset();
  await expect.element(page.getByRole('status', { name: 'Selected topics' })).toHaveTextContent(/^a$/);
  await expect.element(page.getByRole('combobox', { name: 'Topics' })).toHaveValue('');
  expect(page.getByRole('button', { name: 'Remove Beta' }).query()).toBeNull();
  expect(new FormData(form).getAll('topics')).toEqual(['a']);
});
