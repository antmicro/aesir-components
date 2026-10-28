import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import SegmentedRangeStateFixture from '../fixtures/segmented-range-state-fixture.svelte';

test('clearing an invalid range endpoint updates the bound value and opposite bound', async () => {
  await render(SegmentedRangeStateFixture);
  const form = page.getByRole('form', { name: 'Segmented range state' }).element();
  const startDay = page.getByRole('textbox', { name: 'Start Day' });
  const endDay = page.getByRole('textbox', { name: 'End Day' });

  await startDay.fill('31');
  expect(new FormData(form).get('dates.start')).toBe('');
  await expect.element(page.getByTestId('range-state')).toHaveTextContent('"start":""');

  await endDay.fill('02');
  expect(new FormData(form).get('dates.end')).toBe('2026-10-02');
  await expect.element(endDay).toBeValid();
});
