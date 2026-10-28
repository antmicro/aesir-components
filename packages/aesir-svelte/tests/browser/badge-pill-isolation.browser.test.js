import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import Fixture from '../fixtures/badge-pill-isolation-fixture.svelte';

test('keeps badge and pill extra-small padding independent', async () => {
  await render(Fixture);
  const badge = page.getByText('Small badge').element();
  const pill = page.getByRole('link', { name: 'Small pill' }).element();

  expect(getComputedStyle(pill).getPropertyValue('--ds-spacing-0-5').trim()).toBe('2px');
  expect(getComputedStyle(badge).paddingTop).toBe('0px');
  expect(Number.parseFloat(getComputedStyle(pill).paddingTop)).toBeGreaterThan(0);
});
