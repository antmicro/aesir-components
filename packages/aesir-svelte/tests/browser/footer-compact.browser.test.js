import { render } from 'vitest-browser-svelte';
import { expect, test } from 'vitest';
import Footer from '../../src/components/aesir-footer/aesir-footer.svelte';
import { applyTheme } from './setup.js';

test('compact footer tightens the columns layout without losing navigation', async () => {
  applyTheme('light');
  const props = {
    brand: 'Aesir',
    columns: [{ label: 'Product', links: [{ label: 'Components', href: '/components' }] }],
    copyright: '© Aesir',
    style: 'width: 900px'
  };
  const rendered = await render(Footer, { ...props, variant: 'columns' });
  const footer = document.querySelector('.aesir-footer');
  const main = footer.querySelector('.aesir-footer__main');
  const regularPadding = parseFloat(getComputedStyle(main).paddingTop);
  const regularGap = parseFloat(getComputedStyle(main).columnGap);

  expect(regularPadding).toBeGreaterThan(0);
  expect(regularGap).toBeGreaterThan(0);

  await rendered.rerender({ ...props, variant: 'compact' });

  expect(parseFloat(getComputedStyle(main).paddingTop)).toBeLessThan(regularPadding);
  expect(parseFloat(getComputedStyle(main).columnGap)).toBeLessThan(regularGap);
  expect(footer.querySelector('nav a')?.textContent).toBe('Components');
  expect(footer.textContent).toContain('© Aesir');

  await rendered.rerender({ ...props, style: 'width: 600px', variant: 'columns' });
  const narrowRegularPadding = parseFloat(getComputedStyle(main).paddingTop);
  await rendered.rerender({ ...props, style: 'width: 600px', variant: 'compact' });
  expect(parseFloat(getComputedStyle(main).paddingTop)).toBeLessThan(narrowRegularPadding);
});
