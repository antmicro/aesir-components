import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { expect, test } from 'vitest';
import Slider from '../../src/components/aesir-slider/aesir-slider.svelte';

test('keeps the displayed value aligned with the native slider after the range narrows', async () => {
  const rendered = await render(Slider, { value: 75, min: 0, max: 100, label: 'Level' });
  const slider = page.getByRole('slider', { name: 'Level' });

  await rendered.rerender({ value: 75, min: 0, max: 50, label: 'Level' });

  const nativeValue = slider.element().value;
  const displayedValue = slider.element().closest('.aesir-slider').querySelector('output').textContent;
  expect(displayedValue).toBe(nativeValue);
});

test('preserves safe-integer steps when the range changes', async () => {
  const value = 1_000_000_000_005;
  const rendered = await render(Slider, { value, min: 0, max: value + 5, step: 1, label: 'Level' });
  const slider = page.getByRole('slider', { name: 'Level' }).element();

  expect(slider.value).toBe(String(value));
  await rendered.rerender({ value, min: value - 5, max: value + 5, step: 1, label: 'Level' });

  expect(slider.value).toBe(String(value));
  expect(slider.closest('.aesir-slider').querySelector('output').textContent).toBe(String(value));
});

test('keeps the displayed value aligned with native step rounding', async () => {
  await render(Slider, { value: 7, min: 0, max: 10, step: 5, label: 'Level' });
  const slider = page.getByRole('slider', { name: 'Level' }).element();

  expect(slider.closest('.aesir-slider').querySelector('output').textContent).toBe(slider.value);

  slider.focus();
  await userEvent.keyboard('{ArrowRight}');
  expect(slider.value).toBe('10');
  expect(slider.closest('.aesir-slider').querySelector('output').textContent).toBe('10');
});

test.each([
  { value: 10, min: 0, max: 10, step: 6 },
  { value: 0.35, min: 0, max: 1, step: 0.1 },
  { value: 0.35, min: 0.1, max: 1, step: 0.1 },
  { value: 0.3, min: 0, max: 0.3, step: 0.1 },
  { value: 1_000_000_000_005, min: 0, max: 1_000_000_000_010, step: 1 },
  { value: 20, min: 20, max: 10, step: 1 }
])('matches native normalization for $value in $min–$max with step $step', async (props) => {
  const native = document.createElement('input');
  native.type = 'range';
  native.min = String(props.min);
  native.max = String(props.max);
  native.step = String(props.step);
  native.value = String(props.value);

  await render(Slider, { ...props, label: 'Level' });
  const slider = page.getByRole('slider', { name: 'Level' }).element();
  expect(slider.value).toBe(native.value);
  expect(slider.closest('.aesir-slider').querySelector('output').textContent).toBe(slider.value);
});
