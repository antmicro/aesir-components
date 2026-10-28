import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import Progress from '../../src/components/aesir-progress/aesir-progress.svelte';

test('keeps progress label typography when value text disappears', async () => {
  const props = {
    value: 40,
    label: 'Upload',
    showValue: true,
    style: '--ds-font-size-sm: 14px; --ds-font-size-xs: 12px'
  };
  const rendered = await render(Progress, props);
  const label = page.getByText('Upload').element();

  expect(getComputedStyle(label).fontSize).toBe('14px');
  expect(getComputedStyle(page.getByText('40%').element()).fontSize).toBe('12px');

  await rendered.rerender({ ...props, indeterminate: true });
  expect(page.getByText('40%').query()).toBeNull();
  expect(getComputedStyle(label).fontSize).toBe('14px');

  await rendered.rerender({ ...props, showValue: false });
  expect(getComputedStyle(label).fontSize).toBe('14px');
});

test('keeps a determinate indicator still when consumer data attributes conflict', async () => {
  const props = {
    value: 40,
    indeterminate: false,
    'data-indeterminate': 'true'
  };
  const rendered = await render(Progress, props);

  const progress = page.getByRole('progressbar').element();
  const indicator = progress.querySelector('.aesir-progress__indicator');

  expect(progress.getAttribute('aria-valuenow')).toBe('40');
  expect(getComputedStyle(indicator).animationName).toBe('none');

  await rendered.rerender({ ...props, indeterminate: true });
  expect(progress.hasAttribute('aria-valuenow')).toBe(false);
  expect(getComputedStyle(indicator).animationName).toBe('aesir-progress-indeterminate');

  await rendered.rerender(props);
  expect(progress.getAttribute('aria-valuenow')).toBe('40');
  expect(getComputedStyle(indicator).animationName).toBe('none');
});
