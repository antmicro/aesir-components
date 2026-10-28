import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import AesirSlider from '../src/components/aesir-slider/aesir-slider.svelte';

test('keeps its visual fill finite when the range has no span', async () => {
  const { rerender } = render(AesirSlider, { value: 10, min: 10, max: 10, label: 'Level' });
  const slider = screen.getByRole('slider', { name: 'Level' });

  expect(slider.style.getPropertyValue('--aesir-slider-progress')).toBe('0%');
  await rerender({ value: 20, min: 20, max: 10, label: 'Level' });
  expect(slider.style.getPropertyValue('--aesir-slider-progress')).toBe('0%');
});

test('clamps visual fill when a controlled value is outside the range', async () => {
  const { rerender } = render(AesirSlider, { value: 20, min: 0, max: 10, label: 'Level' });
  const slider = screen.getByRole('slider', { name: 'Level' });

  expect(slider.style.getPropertyValue('--aesir-slider-progress')).toBe('100%');
  await rerender({ value: -5, min: 0, max: 10, label: 'Level' });
  expect(slider.style.getPropertyValue('--aesir-slider-progress')).toBe('0%');
});

test('displays the value represented by the native thumb after the range narrows', async () => {
  const { rerender, container } = render(AesirSlider, { value: 75, min: 0, max: 100, label: 'Level' });
  const slider = screen.getByRole('slider', { name: 'Level' });
  expect(slider.value).toBe('75');

  await rerender({ value: 75, min: 0, max: 50, label: 'Level' });
  expect(slider.value).toBe('50');
  expect(container.querySelector('output').textContent).toBe('50');
});

test.each([
  { min: 1_000_000_000_000, max: 1_000_000_000_010, value: 1_000_000_000_005 },
  { min: 0, max: 1_000_000_000_010, value: 1_000_000_000_005 }
])('preserves integer steps beyond twelve significant digits in $min–$max', ({ min, max, value }) => {
  const { container } = render(AesirSlider, { value, min, max, step: 1, label: 'Level' });

  expect(screen.getByRole('slider', { name: 'Level' }).value).toBe(String(value));
  expect(container.querySelector('output').textContent).toBe(String(value));
});

test('rounds decimal half-steps upward like the native range input', () => {
  const { container } = render(AesirSlider, { value: 0.35, min: 0.1, max: 1, step: 0.1, label: 'Level' });

  expect(screen.getByRole('slider', { name: 'Level' }).value).toBe('0.4');
  expect(container.querySelector('output').textContent).toBe('0.4');
});
