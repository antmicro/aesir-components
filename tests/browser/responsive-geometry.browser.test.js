import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { describe, expect, test } from 'vitest';
import VisualRegressionFixture from '../fixtures/visual-regression-fixture.svelte';
import MobileDropdownFixture from '../fixtures/mobile-dropdown-fixture.svelte';
import { applyTheme } from './setup.js';

describe('responsive geometry for long content', () => {
  test.each([
    ['light', 760],
    ['dark', 760],
    ['light', 360],
    ['dark', 360]
  ])('%s theme at %spx', async (theme, width) => {
    applyTheme(theme);
    await render(VisualRegressionFixture, { width });
    const surface = page.getByTestId('visual-surface');
    expect(surface.element().scrollWidth).toBeLessThanOrEqual(surface.element().clientWidth);
  });
});

describe('responsive geometry for floating menus', () => {
  test.each(['light', 'dark'])('%s compact dropdown', async (theme) => {
    applyTheme(theme);
    await render(MobileDropdownFixture);
    await page.getByRole('button', { name: 'Editing' }).click();
    const menu = page.getByRole('menu', { name: 'Editor actions' });
    await expect.element(menu).toBeInTheDocument();
    expect(menu.element().getBoundingClientRect().right).toBeLessThanOrEqual(document.documentElement.clientWidth);
  });
});
