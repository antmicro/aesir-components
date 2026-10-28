import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import TreeView from '../src/components/aesir-tree-view/aesir-tree-view.svelte';

test('allows the last focused item to be removed', async () => {
  const { container, rerender } = render(TreeView, { items: [{ value: 'only', label: 'Only' }] });
  screen.getByRole('treeitem', { name: /Only/ }).focus();

  await rerender({ items: [] });

  expect(screen.getByRole('tree')).toBeTruthy();
  expect(screen.queryByRole('treeitem')).toBeNull();

  const outside = document.createElement('button');
  container.append(outside);
  outside.focus();
  await rerender({ items: [{ value: 'new', label: 'New' }] });

  expect(document.activeElement).toBe(outside);
});
