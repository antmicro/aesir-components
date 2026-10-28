import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import CodeWindow from '../../src/components/aesir-code-window/aesir-code-window.svelte';
import CodeWindowControlsFixture from '../fixtures/code-window-controls-fixture.svelte';
import { applyTheme } from './setup.js';

test('keeps copy and custom controls reachable when the code window narrows', async () => {
  applyTheme('light');
  const rendered = await render(CodeWindowControlsFixture);
  rendered.container.style.width = '240px';

  const copy = page.getByRole('button', { name: 'Copy code', exact: true }).element();
  const root = copy.closest('.aesir-code-window');
  expect(copy.getBoundingClientRect().right).toBeLessThanOrEqual(root.getBoundingClientRect().right);
  const controls = root.querySelector('.aesir-code-window__controls');
  expect(controls.scrollWidth).toBeGreaterThan(controls.clientWidth);

  await page.getByRole('button', { name: 'Source', exact: true }).click();
  await expect.element(page.getByRole('status', { name: 'Last code action' })).toHaveTextContent('Source');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  await expect.element(page.getByRole('status', { name: 'Last code action' })).toHaveTextContent('Download');
  expect(copy.getBoundingClientRect().right).toBeLessThanOrEqual(root.getBoundingClientRect().right);
});

test('line numbers stay inside their gutter when the file reaches four digits', async () => {
  applyTheme('light');
  const rendered = await render(CodeWindow, { code: Array.from({ length: 1000 }, () => 'line').join('\n') });

  const number = document.querySelector('.aesir-code-window__line:last-child .aesir-code-window__line-number');
  expect(number?.textContent).toBe('1000');
  expect(number.scrollWidth).toBeLessThanOrEqual(number.clientWidth);

  const wideGutter = number.clientWidth;
  await rendered.rerender({ code: Array.from({ length: 999 }, () => 'line').join('\n') });
  const threeDigitNumber = document.querySelector('.aesir-code-window__line:last-child .aesir-code-window__line-number');
  expect(threeDigitNumber?.textContent).toBe('999');
  expect(threeDigitNumber.scrollWidth).toBeLessThanOrEqual(threeDigitNumber.clientWidth);

  await rendered.rerender({ code: 'first\nsecond' });
  const narrowNumber = document.querySelector('.aesir-code-window__line:last-child .aesir-code-window__line-number');
  expect(narrowNumber?.textContent).toBe('2');
  expect(narrowNumber.clientWidth).toBeLessThan(wideGutter);
});
