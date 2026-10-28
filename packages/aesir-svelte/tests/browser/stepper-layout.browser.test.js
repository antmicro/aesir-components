import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import Stepper from '../../src/components/aesir-stepper/aesir-stepper.svelte';
import { applyTheme } from './setup.js';

test('keeps long step labels inside a narrow horizontal stepper', async () => {
  applyTheme('light');
  await render(Stepper, {
    style: 'width: 220px',
    items: [
      { value: 'details', label: 'ConfigureYourOrganizationDetails' },
      { value: 'review', label: 'ReviewYourOrganizationDetails' }
    ],
    value: 'details'
  });

  const stepper = page.getByRole('navigation', { name: 'Progress' }).element();
  expect(stepper.scrollWidth).toBeLessThanOrEqual(stepper.clientWidth);
});

test('keeps a custom status inside a narrow stepper', async () => {
  applyTheme('light');
  await render(Stepper, {
    style: 'width: 120px',
    items: [{ value: 'details', label: 'Details', status: 'WaitingForOrganizationVerification' }],
    value: 'details'
  });

  const stepper = page.getByRole('navigation', { name: 'Progress' }).element();
  expect(stepper.scrollWidth).toBeLessThanOrEqual(stepper.clientWidth);
});
