import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { beforeEach, expect, test } from 'vitest';
import AesirMenubar from '../../src/components/aesir-menubar/aesir-menubar.svelte';
import { applyTheme } from './setup.js';

beforeEach(() => applyTheme('light'));

test('keeps a hovered menu open while the pointer pauses on its trigger and enters its panel', async () => {
  await render(AesirMenubar, {
    menus: [
      { label: 'File', value: 'file', items: [{ label: 'New file' }] },
      { label: 'View', value: 'view', items: [{ label: 'Show sidebar' }, { label: 'Show status bar' }] }
    ]
  });
  const file = page.getByRole('menuitem', { name: 'File', exact: true });
  const view = page.getByRole('menuitem', { name: 'View', exact: true });
  await file.click();
  await view.hover();
  await expect.element(view).toHaveAttribute('aria-expanded', 'true');
  await new Promise((resolve) => setTimeout(resolve, 300));
  await expect.element(view).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('menuitem', { name: 'Show sidebar' }).hover();
  await new Promise((resolve) => setTimeout(resolve, 300));
  await expect.element(view).toHaveAttribute('aria-expanded', 'true');
  expect(document.querySelector('[data-aesir-menu-backdrop]')).toBeNull();

  await file.hover();
  await expect.element(page.getByRole('menuitem', { name: 'New file' })).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(file).toHaveAttribute('aria-expanded', 'false');
  await expect.element(file).toHaveFocus();
});

test('positions a menu opened through its controlled value under its trigger', async () => {
  await render(AesirMenubar, {
    value: 'file',
    style: 'margin: 80px 90px',
    menus: [{ label: 'File', value: 'file', items: [{ label: 'New file' }] }]
  });

  const trigger = page.getByRole('menuitem', { name: 'File', exact: true }).element();
  const content = page.getByRole('menu').element();
  await expect.poll(() => content.style.left).not.toBe('');

  const triggerRect = trigger.getBoundingClientRect();
  const contentRect = content.getBoundingClientRect();
  expect(Math.abs(contentRect.left - triggerRect.left)).toBeLessThan(16);
  expect(contentRect.top).toBeGreaterThanOrEqual(triggerRect.bottom - 1);
});

test('moves controlled content when the active menu changes', async () => {
  const menus = [
    { label: 'File', value: 'file', items: [{ label: 'New file' }] },
    { label: 'View', value: 'view', items: [{ label: 'Show sidebar' }] }
  ];
  const rendered = await render(AesirMenubar, { value: 'file', style: 'margin: 80px 90px', menus });
  await rendered.rerender({ value: 'view', style: 'margin: 80px 90px', menus });

  const trigger = page.getByRole('menuitem', { name: 'View', exact: true }).element();
  const content = page.getByRole('menu').element();
  await expect.poll(() => content.textContent).toContain('Show sidebar');
  await expect.poll(() => Math.abs(content.getBoundingClientRect().left - trigger.getBoundingClientRect().left)).toBeLessThan(16);
  expect(content.getBoundingClientRect().top).toBeGreaterThanOrEqual(trigger.getBoundingClientRect().bottom - 1);
});

test('switches between enabled menus on pointer hover only while a menu is open', async () => {
  await render(AesirMenubar, {
    menus: [
      { label: 'File', value: 'file', items: [{ label: 'New file' }] },
      { label: 'Edit', value: 'edit', disabled: true, items: [{ label: 'Undo' }] },
      { label: 'View', value: 'view', items: [{ label: 'Show sidebar' }] }
    ]
  });

  const file = page.getByRole('menuitem', { name: 'File', exact: true });
  const edit = page.getByRole('menuitem', { name: 'Edit', exact: true });
  const view = page.getByRole('menuitem', { name: 'View', exact: true });

  await view.hover();
  expect(page.getByRole('menu').elements()).toHaveLength(0);

  await file.click();
  await expect(page.getByRole('menuitem', { name: 'New file' })).toBeVisible();
  view.element().dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }));
  expect(file.element().getAttribute('aria-expanded')).toBe('true');
  await edit.hover({ force: true });
  expect(file.element().getAttribute('aria-expanded')).toBe('true');

  await view.hover();
  await expect(page.getByRole('menuitem', { name: 'Show sidebar' })).toBeVisible();
  expect(view.element().getAttribute('aria-expanded')).toBe('true');

  await file.hover();
  await expect(page.getByRole('menuitem', { name: 'New file' })).toBeVisible();

  await page.getByRole('menuitem', { name: 'New file' }).click();
  await view.hover();
  expect(page.getByRole('menu').elements()).toHaveLength(0);
});

test('clicking a different trigger while open leaves its menu open', async () => {
  await render(AesirMenubar, {
    menus: [
      { label: 'File', value: 'file', items: [{ label: 'New file' }] },
      { label: 'View', value: 'view', items: [{ label: 'Show sidebar' }] }
    ]
  });

  await page.getByRole('menuitem', { name: 'File', exact: true }).click();
  await expect(page.getByRole('menuitem', { name: 'New file' })).toBeVisible();
  await page.getByRole('menuitem', { name: 'View', exact: true }).click();

  await expect(page.getByRole('menuitem', { name: 'Show sidebar' })).toBeVisible();
  expect(page.getByRole('menuitem', { name: 'View', exact: true }).element().getAttribute('aria-expanded')).toBe('true');

  await page.getByRole('menuitem', { name: 'View', exact: true }).click();
  expect(page.getByRole('menu').elements()).toHaveLength(0);
});

test('a long menu item stays inside the viewport and remains scrollable', async () => {
  const label = 'Open a deeply nested collection of reusable workspace components '.repeat(80);
  await render(AesirMenubar, {
    value: 'file',
    menus: [{ label: 'File', value: 'file', items: [{ label }] }]
  });

  const content = page.getByRole('menu').element();
  await expect.poll(() => content.style.left).not.toBe('');
  const rect = content.getBoundingClientRect();
  expect(rect.left).toBeGreaterThanOrEqual(0);
  expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
  expect(content.scrollWidth).toBeLessThanOrEqual(content.clientWidth);
  expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
  content.scrollTop = content.scrollHeight;
  expect(content.scrollTop).toBeGreaterThan(0);
});
