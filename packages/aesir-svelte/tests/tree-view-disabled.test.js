import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import TreeView from '../src/components/aesir-tree-view/aesir-tree-view.svelte';

const items = [{ value: 'branch', label: 'Branch', items: [{ value: 'child', label: 'Child' }] }];

test.each([
  ['a disabled branch', { items: [{ ...items[0], disabled: true }] }],
  ['a disabled tree', { items, disabled: true }]
])('keeps %s collapsed when its tree item receives ArrowRight', async (_description, props) => {
  const user = userEvent.setup();
  render(TreeView, props);
  const branch = screen.getByRole('treeitem', { name: /Branch/ });

  branch.focus();
  await user.keyboard('{ArrowRight}');

  expect(branch.getAttribute('aria-disabled')).toBe('true');
  expect(branch.getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByRole('treeitem', { name: 'Child' })).toBeNull();
});

test.each([
  ['a disabled branch', { items: [{ ...items[0], disabled: true }] }],
  ['a disabled tree', { items, disabled: true }]
])('keeps %s expanded when its tree item receives ArrowLeft', async (_description, props) => {
  const user = userEvent.setup();
  render(TreeView, { ...props, expanded: ['branch'] });
  const branch = screen.getByRole('treeitem', { name: /Branch/ });

  branch.focus();
  await user.keyboard('{ArrowLeft}');

  expect(branch.getAttribute('aria-disabled')).toBe('true');
  expect(branch.getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByRole('treeitem', { name: 'Child' })).toBeTruthy();
});

test('moves focus to a visible ancestor when the focused child is externally collapsed', async () => {
  const { rerender } = render(TreeView, { items, expanded: ['branch'] });
  const branch = screen.getByRole('treeitem', { name: /Branch/ });
  const child = screen.getByRole('treeitem', { name: 'Child' });
  child.focus();
  expect(document.activeElement).toBe(child);

  await rerender({ items, expanded: [] });

  expect(screen.queryByRole('treeitem', { name: 'Child' })).toBeNull();
  expect(document.activeElement).toBe(branch);
  expect(branch.tabIndex).toBe(0);
});

test('does not reclaim focus after the user leaves the tree', async () => {
  const { container, rerender } = render(TreeView, { items, expanded: ['branch'] });
  const child = screen.getByRole('treeitem', { name: 'Child' });
  const outside = document.createElement('button');
  container.append(outside);
  child.focus();
  outside.focus();

  await rerender({ items, expanded: [] });

  expect(document.activeElement).toBe(outside);
});

test('does not move focus from another visible control when a former item disappears', async () => {
  const nextItems = [...items, { value: 'other', label: 'Other', items: [{ value: 'other-child', label: 'Other child' }] }];
  const { rerender } = render(TreeView, { items: nextItems, expanded: ['branch', 'other'] });
  screen.getByRole('treeitem', { name: 'Child' }).focus();
  const otherToggle = screen.getByRole('button', { name: 'Collapse Other' });
  otherToggle.focus();

  await rerender({ items: nextItems, expanded: ['other'] });

  expect(document.activeElement).toBe(otherToggle);
});
