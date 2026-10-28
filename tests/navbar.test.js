import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import Navbar from '../src/components/aesir-navbar/aesir-navbar.svelte';

describe('AesirNavbar', () => {
  test('closes a menu when its item becomes a plain link', async () => {
    const user = userEvent.setup();
    const { rerender } = render(Navbar, {
      items: [{ value: 'products', label: 'Products', items: [{ label: 'Platform' }] }]
    });

    await user.click(screen.getByRole('button', { name: 'Products' }));
    expect(await screen.findByRole('menuitem', { name: 'Platform' })).toBeTruthy();

    await rerender({ items: [{ value: 'products', label: 'Products', href: '/products' }] });

    expect(screen.getByRole('link', { name: 'Products' }).getAttribute('href')).toBe('/products');
    await waitFor(() => expect(screen.queryByRole('menu', { name: 'Products' })).toBeNull());
  });

  test('closes a menu when its item becomes disabled', async () => {
    const user = userEvent.setup();
    const { rerender } = render(Navbar, {
      items: [{ value: 'products', label: 'Products', items: [{ label: 'Platform' }] }]
    });

    await user.click(screen.getByRole('button', { name: 'Products' }));
    expect(await screen.findByRole('menuitem', { name: 'Platform' })).toBeTruthy();

    await rerender({ items: [{ value: 'products', label: 'Products', disabled: true, items: [{ label: 'Platform' }] }] });

    expect(screen.getByRole('button', { name: 'Products' }).disabled).toBe(true);
    await waitFor(() => expect(screen.queryByRole('menu', { name: 'Products' })).toBeNull());
  });

  test('keeps the same menu through item reordering and closes when it is removed', async () => {
    const user = userEvent.setup();
    const alpha = { label: 'Alpha', items: [{ label: 'Alpha action' }] };
    const beta = { label: 'Beta', items: [{ label: 'Beta action' }] };
    const { rerender } = render(Navbar, { items: [alpha, beta] });

    await user.click(screen.getByRole('button', { name: 'Beta' }));
    expect(await screen.findByRole('menuitem', { name: 'Beta action' })).toBeTruthy();

    await rerender({ items: [beta, alpha] });
    expect(screen.getByRole('button', { name: 'Beta' }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('menuitem', { name: 'Beta action' })).toBeTruthy();

    await rerender({ items: [alpha] });
    await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Beta action' })).toBeNull());
  });

  test('renders navigation items, marks the current item, and ignores disabled actions', async () => {
    const user = userEvent.setup();
    const onselect = vi.fn();
    render(Navbar, {
      label: 'Product navigation',
      brand: { label: 'Aesir', href: '/home' },
      items: [
        { label: 'Docs', href: '/docs', active: true },
        { label: 'Disabled', disabled: true }
      ],
      onselect
    });
    expect(screen.getByRole('navigation', { name: 'Product navigation' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Docs' }).getAttribute('aria-current')).toBe('page');
    const disabledItem = screen.getByText('Disabled').closest('a');
    expect(disabledItem.getAttribute('aria-disabled')).toBe('true');
    expect(disabledItem.hasAttribute('href')).toBe(false);
    await user.click(disabledItem);
    expect(onselect).not.toHaveBeenCalled();
  });

  test('closes a mobile menu when its container grows beyond the mobile breakpoint', async () => {
    const originalResizeObserver = globalThis.ResizeObserver;
    let navigation;
    let notifyResize;
    globalThis.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
      }
      observe(target) {
        if (target === navigation) notifyResize = this.callback;
      }
      disconnect() {}
    };

    try {
      const user = userEvent.setup();
      const { container } = render(Navbar, { items: [{ label: 'Docs', href: '/docs' }] });
      navigation = container.querySelector('nav');
      let width = 320;
      Object.defineProperty(navigation, 'clientWidth', { configurable: true, get: () => width });

      await user.click(screen.getByRole('button', { name: 'Open navigation' }));
      expect(screen.getByRole('button', { name: 'Close navigation' }).getAttribute('aria-expanded')).toBe('true');
      expect(document.documentElement.dataset.overlayOpen).toBe('true');

      width = 800;
      expect(notifyResize).toBeTypeOf('function');
      notifyResize();

      await waitFor(() => expect(screen.getByRole('button', { name: 'Open navigation' }).getAttribute('aria-expanded')).toBe('false'));
      expect(document.documentElement.dataset.overlayOpen).toBeUndefined();
    } finally {
      globalThis.ResizeObserver = originalResizeObserver;
    }
  });
});
