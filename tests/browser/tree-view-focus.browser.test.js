import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, test } from 'vitest';
import TreeView from '../../src/components/aesir-tree-view/aesir-tree-view.svelte';
import { applyTheme } from './setup.js';

describe('AesirTreeView focus visibility', () => {
  test.each(['default', 'sm'])('the focused %s row paints its ring above the selected row immediately below it', async (size) => {
    applyTheme('dark');
    await render(TreeView, {
      items: [
        { value: 'first', label: 'First' },
        { value: 'second', label: 'Second' }
      ],
      value: 'second',
      size
    });

    const first = page.getByRole('treeitem', { name: 'First' }).element();
    const selected = page.getByRole('treeitem', { name: 'Second' }).element();
    selected.focus();
    await userEvent.keyboard('{ArrowUp}');

    expect(first).toBe(document.activeElement);
    expect(first.matches(':focus-visible')).toBe(true);
    expect(selected.getAttribute('aria-selected')).toBe('true');

    const firstRect = first.getBoundingClientRect();
    const selectedRect = selected.getBoundingClientRect();
    expect(firstRect.bottom).toBeCloseTo(selectedRect.top, 1);

    const focusedStyle = getComputedStyle(first);
    const selectedStyle = getComputedStyle(selected);
    expect(focusedStyle.boxShadow).not.toBe('none');
    expect(selectedStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');

    const stackLevel = (style) => (style.zIndex === 'auto' ? 0 : Number(style.zIndex));
    expect(stackLevel(focusedStyle)).toBeGreaterThan(stackLevel(selectedStyle));
  });
});
