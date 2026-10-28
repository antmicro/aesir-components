import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { describe, expect, test } from 'vitest';
import TreeView from '../../src/components/aesir-tree-view/aesir-tree-view.svelte';
import { applyTheme } from './setup.js';

describe('AesirTreeView size', () => {
  test('keeps the default rows at 36px and uses 32px rows in the small variant', async () => {
    applyTheme('dark');
    const items = [{ value: 'file', label: 'File' }];
    const rendered = await render(TreeView, { items });
    const row = page.getByRole('treeitem', { name: 'File' }).element();
    const toggle = row.querySelector('.aesir-tree-view__toggle');

    expect(row.getBoundingClientRect().height).toBe(36);
    expect(getComputedStyle(row).fontSize).toBe('14px');
    expect(toggle.getBoundingClientRect().width).toBe(20);

    await rendered.rerender({ items, size: 'sm' });
    expect(row.getBoundingClientRect().height).toBe(32);
    expect(getComputedStyle(row).fontSize).toBe('12px');
    expect(toggle.getBoundingClientRect().width).toBe(16);
  });

  test('resizing an expanded tree preserves the selected row and DOM focus', async () => {
    applyTheme('dark');
    const items = [{ value: 'folder', label: 'Folder', items: [{ value: 'file', label: 'File' }] }];
    const props = { items, expanded: ['folder'], value: 'file' };
    const rendered = await render(TreeView, props);
    const folder = page.getByRole('treeitem', { name: 'Folder' }).element();
    const file = page.getByRole('treeitem', { name: 'File' }).element();
    file.focus();

    expect(document.activeElement).toBe(file);
    expect(file.getAttribute('aria-selected')).toBe('true');
    expect(folder.getAttribute('aria-expanded')).toBe('true');
    expect(getComputedStyle(file).paddingInlineStart).toBe('20px');
    expect(getComputedStyle(file, '::before').width).toBe('20px');

    await rendered.rerender({ ...props, size: 'sm' });

    expect(folder.getBoundingClientRect().height).toBe(32);
    expect(file.getBoundingClientRect().height).toBe(32);
    expect(document.activeElement).toBe(file);
    expect(file.getAttribute('aria-selected')).toBe('true');
    expect(file.getAttribute('aria-level')).toBe('2');
    expect(folder.getAttribute('aria-expanded')).toBe('true');
    expect(getComputedStyle(file).paddingInlineStart).toBe('16px');
    expect(getComputedStyle(file, '::before').width).toBe('16px');
  });
});
