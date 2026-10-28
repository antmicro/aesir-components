import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import Fixture from '../fixtures/card-long-content-fixture.svelte';

test('keeps long title and description inside a narrow card with a header action', async () => {
  await render(Fixture);
  const surface = page.getByTestId('card-surface').element();

  expect(surface.scrollWidth).toBeLessThanOrEqual(surface.clientWidth);
});
