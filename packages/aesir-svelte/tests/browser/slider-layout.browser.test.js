import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import Slider from '../../src/components/aesir-slider/aesir-slider.svelte';

test('keeps the range input inside a compact slider', async () => {
  await render(Slider, { value: 50, label: 'Level' });
  const input = page.getByRole('slider', { name: 'Level' }).element();
  const root = input.closest('.aesir-slider');
  root.style.width = '96px';

  expect(input.getBoundingClientRect().right).toBeLessThanOrEqual(root.getBoundingClientRect().right + 0.5);
  expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
});

test('keeps the range input inside a compact slider with a long label', async () => {
  await render(Slider, { value: 50, label: 'UnbreakableLongSliderLabelForMobile' });
  const input = page.getByRole('slider', { name: 'UnbreakableLongSliderLabelForMobile' }).element();
  const root = input.closest('.aesir-slider');
  root.style.width = '96px';

  expect(input.getBoundingClientRect().right).toBeLessThanOrEqual(root.getBoundingClientRect().right + 0.5);
  expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
});
