import '../../dist/aesir-html.min.js';
import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { mount } from './test-utils.js';

afterEach(() => document.body.replaceChildren());
const settle = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

describe('HTML composite navigation contracts', () => {
  test('tree view size defaults to regular and responds to attribute changes', async () => {
    await mount('<aesir-tree-view label="Files"></aesir-tree-view>');
    const tree = document.querySelector('aesir-tree-view');
    tree.items = [{ label: 'src', value: 'src' }];
    await settle();

    const root = tree.shadowRoot.querySelector('[role="tree"]');
    expect(root.dataset.size).toBe('default');

    tree.setAttribute('size', 'sm');
    await settle();
    expect(root.dataset.size).toBe('sm');

    tree.removeAttribute('size');
    await settle();
    expect(root.dataset.size).toBe('default');
  });

  test('tree view expands branches and selects a leaf with the keyboard', async () => {
    await mount('<aesir-tree-view label="Files"></aesir-tree-view>');
    const tree = document.querySelector('aesir-tree-view');
    tree.items = [
      {
        label: 'src',
        value: 'src',
        items: [
          { label: 'components', value: 'components', items: [{ label: 'button.svelte', value: 'button' }] },
          { label: 'index.js', value: 'index' }
        ]
      },
      { label: 'package.json', value: 'package' }
    ];
    const onSelect = vi.fn();
    tree.addEventListener('select', onSelect);
    await settle();

    const source = page.getByRole('treeitem', { name: /src/ });
    await source.click();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{End}{Enter}');

    expect(tree.expanded).toContain('src');
    expect(tree.value).toBe('package');
    expect(onSelect.mock.calls.at(-1)[0].detail.value).toBe('package');
  });

  test('menubar skips disabled items, emits selection, and restores trigger focus', async () => {
    await mount('<aesir-menubar label="Application menu"></aesir-menubar>');
    const menubar = document.querySelector('aesir-menubar');
    menubar.menus = [
      {
        label: 'File',
        value: 'file',
        items: [
          { label: 'New file', value: 'new' },
          { label: 'Save file', value: 'save', disabled: true },
          { label: 'Close file', value: 'close' }
        ]
      }
    ];
    const onSelect = vi.fn();
    menubar.addEventListener('select', onSelect);
    await settle();

    const trigger = page.getByRole('menuitem', { name: 'File' });
    await trigger.click();
    await userEvent.keyboard('{ArrowDown}{Enter}');

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect.mock.calls[0][0].detail.value).toBe('close');
    expect(menubar.open).toBeNull();
    await expect.poll(() => menubar.shadowRoot.activeElement?.textContent.trim()).toBe('File');
  });
});
