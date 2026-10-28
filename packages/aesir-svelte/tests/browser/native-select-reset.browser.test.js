import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import AdvancedFormFixture from '../fixtures/advanced-form-fixture.svelte';
import NativeSelectDynamicFixture from '../fixtures/native-select-dynamic-fixture.svelte';

test('native select resets to its first option when no value was supplied', async () => {
  await render(AdvancedFormFixture);
  const region = page.getByRole('combobox', { name: 'Region' });
  const form = page.getByRole('form', { name: 'Advanced controls' }).element();

  expect(new FormData(form).get('region')).toBe('pl');
  await region.selectOptions('de');
  expect(new FormData(form).get('region')).toBe('de');

  form.reset();
  await expect.element(region).toHaveValue('pl');
  expect(new FormData(form).get('region')).toBe('pl');
});

test('native select keeps a submitted choice when its current option is removed', async () => {
  await render(NativeSelectDynamicFixture);
  const form = page.getByRole('form', { name: 'Dynamic native select form' }).element();
  const region = page.getByRole('combobox', { name: 'Region' });
  expect(new FormData(form).get('region')).toBe('eu');

  await page.getByRole('button', { name: 'Remove Europe' }).click();

  await expect.element(region).toHaveValue('us');
  await expect.element(page.getByRole('status', { name: 'Region value' })).toHaveTextContent('us');
  expect(new FormData(form).get('region')).toBe('us');
});

test('multiple native select does not resurrect a removed selection', async () => {
  await render(NativeSelectDynamicFixture);
  const form = page.getByRole('form', { name: 'Dynamic native select form' }).element();
  const regions = page.getByRole('listbox', { name: 'Regions' });
  await regions.selectOptions(['eu', 'us']);
  expect(new FormData(form).getAll('regions')).toEqual(['eu', 'us']);

  await page.getByRole('button', { name: 'Remove Europe' }).click();
  await expect.element(page.getByRole('status', { name: 'Regions values' })).toHaveTextContent('us');
  expect(new FormData(form).getAll('regions')).toEqual(['us']);

  await page.getByRole('button', { name: 'Restore Europe' }).click();
  expect(new FormData(form).getAll('regions')).toEqual(['us']);
});

test('reset falls back to an available option after the initial option is removed', async () => {
  await render(NativeSelectDynamicFixture);
  const form = page.getByRole('form', { name: 'Dynamic native select form' }).element();
  await page.getByRole('button', { name: 'Remove Europe' }).click();
  expect(new FormData(form).get('region')).toBe('us');

  form.reset();
  // Form reset restores bound state in a zero-delay timer after the native reset.
  await new Promise((resolve) => setTimeout(resolve, 0));

  await expect.element(page.getByRole('combobox', { name: 'Region' })).toHaveValue('us');
  expect(new FormData(form).get('region')).toBe('us');
});
