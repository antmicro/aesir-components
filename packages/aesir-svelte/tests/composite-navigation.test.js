import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import CompositeNavigationFixture from './fixtures/composite-navigation-fixture.svelte';
import Menubar from '../src/components/aesir-menubar/aesir-menubar.svelte';
import TreeView from '../src/components/aesir-tree-view/aesir-tree-view.svelte';
import ToggleGroupDynamicFixture from './fixtures/toggle-group-dynamic-fixture.svelte';
import ToggleGroupRequiredFixture from './fixtures/toggle-group-required-fixture.svelte';
import Toggle from '../src/components/aesir-toggle/aesir-toggle.svelte';

test('a controlled toggle requests changes without changing its own pressed state', async () => {
  const user = userEvent.setup();
  const onpressedchange = vi.fn();
  render(Toggle, { pressed: true, controlled: true, onpressedchange, 'aria-label': 'Bold' });

  await user.click(screen.getByRole('button', { name: 'Bold' }));

  expect(onpressedchange).toHaveBeenCalledWith(false);
  expect(screen.getByRole('button', { name: 'Bold' }).getAttribute('aria-pressed')).toBe('true');
});

describe('AesirToggleGroup', () => {
  test('does not emit a value change when a required single selection stays selected', async () => {
    const user = userEvent.setup();
    render(ToggleGroupRequiredFixture);

    expect(screen.getByRole('button', { name: 'Alpha' }).getAttribute('aria-pressed')).toBe('true');
    await user.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(screen.getByRole('button', { name: 'Alpha' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('status', { name: 'Selection changes' }).textContent).toBe('0');

    await user.click(screen.getByRole('button', { name: 'Beta' }));
    expect(screen.getByRole('status', { name: 'Selection changes' }).textContent).toBe('1');
  });

  test('keeps one Tab stop and moves it with arrow-key focus', async () => {
    const user = userEvent.setup();
    render(CompositeNavigationFixture);

    const bold = screen.getByRole('button', { name: 'Bold' });
    const italic = screen.getByRole('button', { name: 'Italic' });
    const underline = screen.getByRole('button', { name: 'Underline' });
    expect(bold.tabIndex).toBe(0);
    expect(italic.tabIndex).toBe(-1);
    expect(underline.tabIndex).toBe(-1);

    bold.focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(underline);
    expect(bold.tabIndex).toBe(-1);
    expect(underline.tabIndex).toBe(0);

    await user.tab();
    expect(document.activeElement).not.toBe(bold);
    expect(document.activeElement).not.toBe(italic);
    expect(document.activeElement).not.toBe(underline);
  });

  test('reassigns the Tab stop when items are removed or disabled', async () => {
    const user = userEvent.setup();
    render(ToggleGroupDynamicFixture);

    const bold = screen.getByRole('button', { name: 'Bold' });
    const underline = screen.getByRole('button', { name: 'Underline' });
    const italic = screen.getByRole('button', { name: 'Italic' });
    expect(bold.tabIndex).toBe(0);

    await user.click(screen.getByRole('button', { name: 'Remove Bold' }));
    expect(underline.tabIndex).toBe(0);
    expect(italic.tabIndex).toBe(-1);

    await user.click(screen.getByRole('button', { name: 'Disable Underline' }));
    expect(underline.disabled).toBe(true);
    expect(underline.tabIndex).toBe(-1);
    expect(italic.tabIndex).toBe(0);
  });

  test('updates multiple selection and moves focus past disabled items', async () => {
    const user = userEvent.setup();
    render(CompositeNavigationFixture);

    const bold = screen.getByRole('button', { name: 'Bold' });
    const underline = screen.getByRole('button', { name: 'Underline' });

    expect(bold.getAttribute('aria-pressed')).toBe('true');
    bold.focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(underline);

    await user.keyboard('{Enter}');
    expect(underline.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('status', { name: 'Formatting value' }).textContent).toBe('bold,underline');
  });

  test('keeps disabled items inert for pointer and synthetic activation', async () => {
    const user = userEvent.setup();
    render(CompositeNavigationFixture);
    const italic = screen.getByRole('button', { name: 'Italic' });

    await user.click(italic);
    italic.click();

    expect(italic.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('status', { name: 'Formatting value' }).textContent).toBe('bold');
  });
});

describe('AesirTreeView', () => {
  test('restores a Tab stop when the focused item is removed', async () => {
    const items = [
      { value: 'first', label: 'First' },
      { value: 'second', label: 'Second' }
    ];
    const { rerender, container } = render(TreeView, { items, value: 'first' });
    const second = container.querySelector('[role="treeitem"][data-tree-index="1"]');
    second.focus();
    await waitFor(() => expect(second.tabIndex).toBe(0));

    await rerender({ items: [items[0]], value: 'first' });
    expect(container.querySelector('[role="treeitem"]').tabIndex).toBe(0);
  });

  test('restores a Tab stop when the focused descendant is collapsed', async () => {
    const items = [{ value: 'parent', label: 'Parent', items: [{ value: 'child', label: 'Child' }] }];
    const { rerender, container } = render(TreeView, { items, value: 'parent', expanded: ['parent'] });
    const child = container.querySelector('[role="treeitem"][data-tree-index="1"]');
    child.focus();
    await waitFor(() => expect(child.tabIndex).toBe(0));

    await rerender({ items, value: 'parent', expanded: [] });
    expect(container.querySelector('[role="treeitem"]').tabIndex).toBe(0);
  });

  test('expands branches and follows the tree keyboard model', async () => {
    const user = userEvent.setup();
    render(CompositeNavigationFixture);

    const source = screen.getByRole('treeitem', { name: /src/ });
    source.focus();
    await user.keyboard('{ArrowRight}');

    expect(source.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('status', { name: 'Expanded branches' }).textContent).toBe('src');

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('treeitem', { name: /components/ }));

    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(source);
  });

  test('selects leaves with Enter without selecting branches', async () => {
    const user = userEvent.setup();
    render(CompositeNavigationFixture);

    const source = screen.getByRole('treeitem', { name: /src/ });
    source.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('status', { name: 'Tree value' }).textContent).toBe('package');

    await user.keyboard('{End}{Enter}');
    expect(screen.getByRole('status', { name: 'Tree value' }).textContent).toBe('package');
  });

  test('supports Home and End across the visible tree without expanding branches', async () => {
    const user = userEvent.setup();
    render(CompositeNavigationFixture);
    const source = screen.getByRole('treeitem', { name: /src/ });
    const packageItem = screen.getByRole('treeitem', { name: /package.json/ });

    source.focus();
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(packageItem);
    await user.keyboard('{Home}');

    expect(document.activeElement).toBe(source);
    expect(source.getAttribute('aria-expanded')).toBe('false');
  });

  test('collapses an expanded branch before moving to its parent', async () => {
    const user = userEvent.setup();
    render(CompositeNavigationFixture);
    const source = screen.getByRole('treeitem', { name: /src/ });

    source.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    const components = screen.getByRole('treeitem', { name: /components/ });
    await user.keyboard('{ArrowRight}');
    expect(components.getAttribute('aria-expanded')).toBe('true');
    await user.keyboard('{ArrowLeft}');

    expect(components.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(components);
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(source);
  });
});

describe('AesirMenubar', () => {
  test('keeps one enabled trigger in the Tab order and roves focus with arrows, Home, and End', async () => {
    const user = userEvent.setup();
    render(CompositeNavigationFixture);

    const file = screen.getByRole('menuitem', { name: 'File' });
    const edit = screen.getByRole('menuitem', { name: 'Edit' });
    const view = screen.getByRole('menuitem', { name: 'View' });
    expect(file.tabIndex).toBe(0);
    expect(edit.tabIndex).toBe(-1);
    expect(view.tabIndex).toBe(-1);

    file.focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(view);
    expect(view.tabIndex).toBe(0);
    expect(file.tabIndex).toBe(-1);

    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(file);
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(view);
    expect(screen.queryByRole('menu')).toBeNull();

    await user.tab();
    expect(document.activeElement).not.toBe(file);
    expect(document.activeElement).not.toBe(edit);
    expect(document.activeElement).not.toBe(view);
  });

  test('skips disabled items and restores trigger focus after Escape', async () => {
    const user = userEvent.setup();
    render(CompositeNavigationFixture);

    const file = screen.getByRole('menuitem', { name: 'File' });
    await user.click(file);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'New file' })));

    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Close file' }));

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(file);
  });

  test('includes checkbox and radio items in keyboard navigation', async () => {
    const user = userEvent.setup();
    render(CompositeNavigationFixture);

    await user.click(screen.getByRole('menuitem', { name: 'View' }));
    const checkbox = await screen.findByRole('menuitemcheckbox', { name: 'Show sidebar' });
    const radio = screen.getByRole('menuitemradio', { name: 'Comfortable' });
    await waitFor(() => expect(document.activeElement).toBe(checkbox));

    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(radio);

    await user.keyboard('{Enter}');
    expect(screen.getByRole('status', { name: 'Selected menu item' }).textContent).toBe('comfortable');
  });

  test('switches open menus with horizontal arrow keys', async () => {
    const user = userEvent.setup();
    render(CompositeNavigationFixture);

    await user.click(screen.getByRole('menuitem', { name: 'File' }));
    await screen.findByRole('menuitem', { name: 'New file' });
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('menuitem', { name: 'View' }).getAttribute('aria-expanded')).toBe('true');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('menuitemcheckbox', { name: 'Show sidebar' })));
  });

  test('skips a disabled menu when moving horizontally from an open trigger', async () => {
    const user = userEvent.setup();
    render(CompositeNavigationFixture);

    const file = screen.getByRole('menuitem', { name: 'File' });
    const edit = screen.getByRole('menuitem', { name: 'Edit' });
    const view = screen.getByRole('menuitem', { name: 'View' });
    expect(edit.hasAttribute('disabled')).toBe(true);

    await user.click(file);
    await screen.findByRole('menuitem', { name: 'New file' });
    file.focus();
    await user.keyboard('{ArrowRight}');

    expect(view.getAttribute('aria-expanded')).toBe('true');
    expect(edit.getAttribute('aria-expanded')).toBe('false');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('menuitemcheckbox', { name: 'Show sidebar' })));
  });

  test('does not close the only enabled menu when moving horizontally', async () => {
    const user = userEvent.setup();
    render(Menubar, {
      menus: [
        { label: 'File', value: 'file', items: [{ label: 'New file' }] },
        { label: 'Edit', value: 'edit', disabled: true, items: [{ label: 'Undo' }] }
      ]
    });

    const file = screen.getByRole('menuitem', { name: 'File' });
    await user.click(file);
    await screen.findByRole('menuitem', { name: 'New file' });
    file.focus();
    await user.keyboard('{ArrowRight}');

    expect(file.getAttribute('aria-expanded')).toBe('true');
  });

  test('does not select disabled menu items through synthetic clicks', async () => {
    const user = userEvent.setup();
    render(CompositeNavigationFixture);

    await user.click(screen.getByRole('menuitem', { name: 'File' }));
    const unavailable = await screen.findByRole('menuitem', { name: 'Unavailable' });
    unavailable.click();

    expect(screen.getByRole('status', { name: 'Selected menu item' }).textContent).toBe('none');
    expect(screen.getByRole('menuitem', { name: 'File' }).getAttribute('aria-expanded')).toBe('true');
  });

  test('closes an open menu on Tab and allows focus to leave the menubar', async () => {
    const user = userEvent.setup();
    render(CompositeNavigationFixture);

    await user.click(screen.getByRole('menuitem', { name: 'File' }));
    await screen.findByRole('menuitem', { name: 'New file' });
    await user.keyboard('{Tab}');

    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).not.toBe(screen.getByRole('menuitem', { name: 'File' }));
  });
});
