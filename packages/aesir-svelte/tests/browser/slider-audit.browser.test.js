import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import Slider from '../../src/components/aesir-slider/aesir-slider.svelte';

test('keeps the output and fill aligned when dynamic numeric props become invalid', async () => {
  const cases = [
    { min: 0, max: 200, step: 1, value: 150 },
    { min: 0, max: Number.NaN, step: 1, value: 150 },
    { min: Number.NaN, max: 10, step: 1, value: -5 },
    { min: 0, max: 100, step: Number.NaN, value: 33.5 },
    { min: 0, max: 10, step: 1, value: Number.NaN },
    { min: 0, max: 10, step: 1, value: Number.POSITIVE_INFINITY },
    { min: 0, max: 200, step: 1, value: 150 }
  ];
  const rendered = await render(Slider, { ...cases[0], label: 'Level' });
  const slider = page.getByRole('slider', { name: 'Level' }).element();

  for (const props of cases) {
    await rendered.rerender({ ...props, label: 'Level' });
    const native = document.createElement('input');
    native.type = 'range';
    native.min = String(props.min);
    native.max = String(props.max);
    native.step = String(props.step);
    native.value = String(props.value);
    const label = `${props.min}/${props.max}/${props.step}/${props.value}`;
    expect(slider.value, label).toBe(native.value);
    expect(slider.closest('.aesir-slider').querySelector('output').textContent, label).toBe(native.value);
    const expectedProgress =
      ((Number(native.value) - (Number.isFinite(props.min) ? props.min : 0)) / ((Number.isFinite(props.max) ? props.max : 100) - (Number.isFinite(props.min) ? props.min : 0))) * 100;
    expect(slider.style.getPropertyValue('--aesir-slider-progress'), label).toBe(`${expectedProgress}%`);
  }
});
