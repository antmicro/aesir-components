import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import RadioDynamicResetFixture from '../fixtures/radio-dynamic-reset-fixture.svelte';

test('reset restores the original radio choice after another choice is mounted later', async () => {
  await render(RadioDynamicResetFixture);
  const form = page.getByRole('form', { name: 'Dynamic plan form' }).element();
  const free = page.getByRole('radio', { name: 'Free' });
  const pro = page.getByRole('radio', { name: 'Pro' });

  expect(free.element().defaultChecked).toBe(true);
  expect(pro.element().defaultChecked).toBe(false);

  await page.getByText('Pro', { exact: true }).click();
  await expect.element(pro).toBeChecked();
  expect(free.element().defaultChecked).toBe(true);
  expect(pro.element().defaultChecked).toBe(false);
  await page.getByRole('button', { name: 'Add team option' }).click();
  await expect.element(pro).toBeChecked();
  await page.getByRole('button', { name: 'Reset plan' }).click();

  await expect.element(page.getByRole('status', { name: 'Current plan' })).toHaveTextContent('free');
  await expect.element(free).toBeChecked();
  expect(new FormData(form).get('plan')).toBe('free');
});

test('reset keeps native selection aligned when the initial choice was reselected before reset', async () => {
  await render(RadioDynamicResetFixture);
  const form = page.getByRole('form', { name: 'Dynamic plan form' }).element();
  const free = page.getByRole('radio', { name: 'Free' });
  const team = page.getByRole('radio', { name: 'Team' });

  await page.getByRole('button', { name: 'Select team' }).click();
  expect(team.element().defaultChecked).toBe(true);
  await page.getByText('Free', { exact: true }).click();
  await expect.element(free).toBeChecked();
  expect(new FormData(form).get('plan')).toBe('free');

  form.reset();
  await new Promise((resolve) => setTimeout(resolve, 0));

  await expect.element(free).toBeChecked();
  await expect.element(team).not.toBeChecked();
  await expect.element(page.getByRole('status', { name: 'Current plan' })).toHaveTextContent('free');
  expect(new FormData(form).get('plan')).toBe('free');
});

test('a canceled reset leaves the edited radio group intact', async () => {
  await render(RadioDynamicResetFixture);
  const form = page.getByRole('form', { name: 'Dynamic plan form' }).element();
  let resetEvents = 0;
  const cancelReset = (event) => {
    resetEvents += 1;
    event.preventDefault();
  };

  await page.getByText('Pro', { exact: true }).click();
  await expect.element(page.getByRole('radio', { name: 'Pro' })).toBeChecked();
  await page.getByRole('button', { name: 'Add team option' }).click();
  await expect.element(page.getByRole('radio', { name: 'Pro' })).toBeChecked();
  form.addEventListener('reset', cancelReset);
  await page.getByRole('button', { name: 'Reset plan' }).click();
  expect(resetEvents).toBe(1);

  await expect.element(page.getByRole('radio', { name: 'Pro' })).toBeChecked();
  await expect.element(page.getByRole('status', { name: 'Current plan' })).toHaveTextContent('pro');
  expect(new FormData(form).get('plan')).toBe('pro');

  form.removeEventListener('reset', cancelReset);
  await page.getByRole('button', { name: 'Reset plan' }).click();
  await expect.element(page.getByRole('radio', { name: 'Free' })).toBeChecked();
  expect(new FormData(form).get('plan')).toBe('free');
});

test('external value changes and native change callbacks stay in sync', async () => {
  await render(RadioDynamicResetFixture);
  const form = page.getByRole('form', { name: 'Dynamic plan form' }).element();

  await page.getByRole('button', { name: 'Select team' }).click();
  await expect.element(page.getByRole('radio', { name: 'Team' })).toBeChecked();
  await expect.element(page.getByRole('status', { name: 'Current plan' })).toHaveTextContent('team');
  expect(new FormData(form).get('plan')).toBe('team');

  await page.getByText('Pro', { exact: true }).click();
  await expect.element(page.getByRole('radio', { name: 'Pro' })).toBeChecked();
  await expect.element(page.getByRole('status', { name: 'Current plan' })).toHaveTextContent('pro');
  await expect.element(page.getByRole('status', { name: 'Plan changes' })).toHaveTextContent('1');
  expect(new FormData(form).get('plan')).toBe('pro');
});

test('resetting one form does not change a radio group with the same name in another form', async () => {
  await render(RadioDynamicResetFixture);
  const planForm = page.getByRole('form', { name: 'Dynamic plan form' }).element();
  const regionForm = page.getByRole('form', { name: 'Region form' }).element();

  await page.getByText('Pro', { exact: true }).click();
  await page.getByText('South', { exact: true }).click();
  await page.getByRole('button', { name: 'Reset plan' }).click();

  await expect.element(page.getByRole('radio', { name: 'Free' })).toBeChecked();
  await expect.element(page.getByRole('radio', { name: 'South' })).toBeChecked();
  expect(new FormData(planForm).get('plan')).toBe('free');
  expect(new FormData(regionForm).get('plan')).toBe('south');

  await page.getByRole('button', { name: 'Reset region' }).click();
  await expect.element(page.getByRole('radio', { name: 'North' })).toBeChecked();
  expect(new FormData(regionForm).get('plan')).toBe('north');
});
