import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { expect, test } from 'vitest';
import Navbar from '../../src/components/aesir-navbar/aesir-navbar.svelte';
import { applyTheme } from './setup.js';

test.each(['mega', 'compact'])('keeps the %s hover menu open under a stationary pointer and while entering its panel', async (menu) => {
  await page.viewport(1024, 768);
  applyTheme('light');
  const { container } = await render(Navbar, {
    menuTrigger: 'hover',
    menuOpenDelay: 20,
    menuCloseDelay: 60,
    items: [
      { label: 'Products', menu, items: [{ label: 'Platform' }] },
      { label: 'Resources', menu, items: [{ label: 'Guides' }] }
    ]
  });
  container.style.width = '800px';

  const products = page.getByRole('button', { name: 'Products' });
  await products.hover();
  await expect.element(products).toHaveAttribute('aria-expanded', 'true');
  // Wait beyond the hover-close delay: opening the panel must not displace the pointer.
  await new Promise((resolve) => setTimeout(resolve, 250));
  await expect.element(products).toHaveAttribute('aria-expanded', 'true');
  expect(document.querySelector('[data-aesir-menu-backdrop]')).toBeNull();
  expect(document.documentElement.dataset.overlayOpen).toBeUndefined();

  const platform = page.getByRole('menuitem', { name: 'Platform' });
  await platform.hover();
  await new Promise((resolve) => setTimeout(resolve, 150));
  await expect.element(platform).toBeVisible();

  const resources = page.getByRole('button', { name: 'Resources' });
  await resources.hover();
  await expect.element(resources).toHaveAttribute('aria-expanded', 'true');
  await expect.element(products).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('menuitem', { name: 'Guides' }).hover();
  await new Promise((resolve) => setTimeout(resolve, 150));
  await expect.element(resources).toHaveAttribute('aria-expanded', 'true');

  await page.getByRole('link', { name: 'Aesir', exact: true }).hover();
  await expect.element(resources).toHaveAttribute('aria-expanded', 'false');
});

test('desktop navigation switches click menus without a blocking dismissal click and restores keyboard focus', async () => {
  await page.viewport(1024, 768);
  applyTheme('light');
  const { container } = await render(Navbar, {
    items: [
      { label: 'Products', menu: 'mega', items: [{ label: 'Platform' }] },
      { label: 'Resources', menu: 'mega', items: [{ label: 'Guides' }] }
    ]
  });
  container.style.width = '800px';

  const products = page.getByRole('button', { name: 'Products' });
  const resources = page.getByRole('button', { name: 'Resources' });
  await products.click();
  await expect.element(page.getByRole('menuitem', { name: 'Platform' })).toHaveFocus();
  await resources.click();
  await expect.element(resources).toHaveAttribute('aria-expanded', 'true');
  await expect.element(products).toHaveAttribute('aria-expanded', 'false');
  await userEvent.keyboard('{Escape}');
  await expect.element(resources).toHaveAttribute('aria-expanded', 'false');
  await expect.element(resources).toHaveFocus();

  await userEvent.keyboard('{ArrowDown}');
  await expect.element(page.getByRole('menuitem', { name: 'Guides' })).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expect.element(resources).toHaveFocus();
});

test('navigation closes an open menu when its trigger becomes a link', async () => {
  applyTheme('light');
  const rendered = await render(Navbar, {
    items: [{ value: 'products', label: 'Products', items: [{ label: 'Platform' }] }]
  });
  rendered.container.style.width = '800px';

  await page.getByRole('button', { name: 'Products' }).click();
  await expect.element(page.getByRole('menuitem', { name: 'Platform' })).toBeVisible();

  await rendered.rerender({ items: [{ value: 'products', label: 'Products', href: '/products' }] });

  await expect.element(page.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/products');
  await expect.poll(() => document.querySelector('.aesir-dropdown[aria-label="Products"]')?.getAttribute('data-state')).not.toBe('open');
});

test('mobile navigation releases its modal when only its container grows', async () => {
  applyTheme('light');
  const { container } = await render(Navbar, { items: [{ label: 'Docs', href: '/docs' }] });
  container.style.width = '320px';

  const trigger = page.getByRole('button', { name: 'Open navigation' });
  await trigger.click();
  await expect.element(page.getByRole('button', { name: 'Close navigation' })).toHaveAttribute('aria-expanded', 'true');
  expect(document.documentElement.dataset.overlayOpen).toBe('true');

  const triggerElement = container.querySelector('.navbar__mobile-trigger');
  container.style.width = '800px';
  await expect.poll(() => triggerElement.getAttribute('aria-expanded')).toBe('false');
  expect(document.documentElement.dataset.overlayOpen).toBeUndefined();
});

test('mobile navigation reaches nested submenu actions', async () => {
  applyTheme('light');
  let selected = '';
  const { container } = await render(Navbar, {
    items: [
      {
        label: 'Products',
        items: [
          {
            label: 'Platform',
            items: [
              {
                label: 'Analytics',
                action: () => {
                  selected = 'analytics';
                }
              }
            ]
          }
        ]
      }
    ]
  });
  container.style.width = '320px';

  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Analytics' }).click();

  expect(selected).toBe('analytics');
  await expect.element(page.getByRole('button', { name: 'Open navigation' })).toHaveAttribute('aria-expanded', 'false');
});

test('navigation links preserve their target and rel on desktop and mobile', async () => {
  applyTheme('light');
  const { container } = await render(Navbar, {
    brand: { label: 'External brand', href: 'https://example.com', target: '_blank', rel: 'noopener' },
    items: [{ label: 'External docs', href: 'https://example.com/docs', target: '_blank', rel: 'noopener' }]
  });
  container.style.width = '320px';

  expect(container.querySelector('.navbar__brand')?.getAttribute('target')).toBe('_blank');
  expect(container.querySelector('.navbar__brand')?.getAttribute('rel')).toBe('noopener');
  expect(container.querySelector('.navbar__link')?.getAttribute('target')).toBe('_blank');
  expect(container.querySelector('.navbar__link')?.getAttribute('rel')).toBe('noopener');

  await page.getByRole('button', { name: 'Open navigation' }).click();
  expect(container.querySelector('.navbar__mobile-link')?.getAttribute('target')).toBe('_blank');
  expect(container.querySelector('.navbar__mobile-link')?.getAttribute('rel')).toBe('noopener');
});
