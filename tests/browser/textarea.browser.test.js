import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import AesirTextarea from '../../src/components/aesir-textarea/aesir-textarea.svelte';

test.each([
  ['none', 'none'],
  ['vertical', 'vertical'],
  ['horizontal', 'horizontal'],
  ['both', 'both']
])('honors the %s textarea resize option', async (resize, expected) => {
  await render(AesirTextarea, { label: 'Notes', resize });
  expect(getComputedStyle(page.getByRole('textbox', { name: 'Notes' }).element()).resize).toBe(expected);
});

test('releases the inline height when leaving auto-resize', async () => {
  const props = { label: 'Notes', value: 'First line\nSecond line', rows: 2, resize: 'auto' };
  const rendered = await render(AesirTextarea, props);
  const textarea = page.getByRole('textbox', { name: 'Notes' }).element();

  expect(textarea.style.height).not.toBe('');
  await rendered.rerender({ ...props, resize: 'vertical', rows: 6 });

  expect(textarea.style.height).toBe('');
  expect(textarea.rows).toBe(6);
  expect(getComputedStyle(textarea).resize).toBe('vertical');

  textarea.style.height = '140px';
  await rendered.rerender({ ...props, resize: 'vertical', rows: 6, value: 'Updated notes' });
  expect(textarea.style.height).toBe('140px');
});

test('recalculates auto height when its available width changes', async () => {
  const props = {
    label: 'Notes',
    value: 'A long description with many words that wraps differently as the available width changes. '.repeat(8),
    resize: 'auto',
    style: 'width: 480px'
  };
  await render(AesirTextarea, props);
  const textarea = page.getByRole('textbox', { name: 'Notes' }).element();
  const root = textarea.closest('.aesir-textarea');
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const wideHeight = textarea.clientHeight;

  root.style.width = '160px';

  await expect.poll(() => textarea.clientHeight).toBeGreaterThan(wideHeight);
  expect(textarea.clientHeight).toBeGreaterThanOrEqual(textarea.scrollHeight);
  const narrowHeight = textarea.clientHeight;

  root.style.width = '480px';
  await expect.poll(() => textarea.clientHeight).toBeLessThan(narrowHeight);
});

test('recalculates auto height when the textarea size changes', async () => {
  const props = {
    label: 'Notes',
    value: 'A long description with many words that wraps across multiple lines. '.repeat(8),
    resize: 'auto',
    size: 'sm',
    style: 'width: 240px; --ds-font-size-xs: 12px; --ds-font-size-base: 22px'
  };
  const rendered = await render(AesirTextarea, props);
  const textarea = page.getByRole('textbox', { name: 'Notes' }).element();
  const smallHeight = textarea.clientHeight;
  expect(smallHeight).toBeGreaterThan(0);

  await rendered.rerender({ ...props, size: 'lg' });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  expect(textarea.clientWidth).toBe(240);
  expect(textarea.scrollHeight).toBeGreaterThan(smallHeight);
  expect(textarea.clientHeight).toBeGreaterThanOrEqual(textarea.scrollHeight);
});

test('recalculates auto height when inherited text metrics change', async () => {
  await render(AesirTextarea, {
    label: 'Notes',
    value: 'A long description with many words that wraps across multiple lines. '.repeat(8),
    resize: 'auto',
    style: 'width: 240px; --aesir-textarea-font-size: 12px'
  });
  const textarea = page.getByRole('textbox', { name: 'Notes' }).element();
  const root = textarea.closest('.aesir-textarea');
  const smallHeight = textarea.clientHeight;
  expect(smallHeight).toBeGreaterThan(0);

  root.style.setProperty('--aesir-textarea-font-size', '24px');
  await expect.poll(() => textarea.clientHeight).toBeGreaterThan(smallHeight);

  expect(textarea.clientWidth).toBe(240);
  expect(textarea.scrollHeight).toBeGreaterThan(smallHeight);
  expect(textarea.clientHeight).toBeGreaterThanOrEqual(textarea.scrollHeight);
  const largeHeight = textarea.clientHeight;

  root.style.setProperty('--aesir-textarea-font-size', '12px');
  await expect.poll(() => textarea.clientHeight).toBeLessThan(largeHeight);
  expect(textarea.clientHeight).toBeGreaterThanOrEqual(textarea.scrollHeight);
});
