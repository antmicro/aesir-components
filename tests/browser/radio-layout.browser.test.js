import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import RadioLongLabelFixture from '../fixtures/radio-long-label-fixture.svelte';

test('a long radio label stays within its narrow container', async () => {
  await render(RadioLongLabelFixture);
  const container = page.getByTestId('radio-container').element();
  const radio = page.getByRole('radio', { name: 'ProductionDeploymentWithAnExceptionallyLongUnbrokenEnvironmentIdentifier' }).element();
  const label = container.querySelector('.aesir-radio__label');
  const description = container.querySelector('.aesir-radio__description');

  expect(radio.checked).toBe(true);
  expect(label).not.toBeNull();
  expect(description).not.toBeNull();
  expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth + 1);
  expect(description.scrollWidth).toBeLessThanOrEqual(description.clientWidth + 1);
  expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth + 1);
});
