import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import Sidebar from '../src/components/aesir-sidebar/aesir-sidebar.svelte';

describe('AesirSidebar', () => {
  test('renders a custom leading slot instead of the status while preserving selection and badges', async () => {
    const user = userEvent.setup();
    const onselect = vi.fn();
    const itemLeading = createRawSnippet((item) => ({ render: () => `<span role="img" aria-label="${item().label} avatar">Avatar</span>` }));
    const { container } = render(Sidebar, { mode: 'desktop', items: [{ value: 'morgan', label: 'Morgan', status: 'online', badge: 1 }], itemLeading, onselect });
    const button = screen.getByRole('button', { name: /Morgan/ });
    expect(within(button).getByRole('img', { name: 'Morgan avatar' })).toBeTruthy();
    expect(within(button).getByText('1')).toBeTruthy();
    expect(container.querySelector('.aesir-sidebar__status')).toBeNull();
    await user.click(button);
    expect(onselect).toHaveBeenCalledWith(expect.objectContaining({ value: 'morgan' }), expect.any(MouseEvent));
    expect(button.getAttribute('aria-current')).toBe('page');
  });

  test('uses the custom leading slot in the mobile drawer too', async () => {
    const user = userEvent.setup();
    const itemLeading = createRawSnippet((item) => ({ render: () => `<span role="img" aria-label="${item().label} avatar">Avatar</span>` }));
    const onselect = vi.fn();
    render(Sidebar, { mode: 'mobile', label: 'Chat navigation', items: [{ value: 'morgan', label: 'Morgan' }], itemLeading, onselect });
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    const drawer = screen.getByRole('dialog', { name: 'Chat navigation' });
    expect(within(drawer).getByRole('img', { name: 'Morgan avatar' })).toBeTruthy();
    await user.click(within(drawer).getByRole('button', { name: /Morgan/ }));
    expect(onselect).toHaveBeenCalledWith(expect.objectContaining({ value: 'morgan' }), expect.any(MouseEvent));
  });

  test('selects enabled items and keeps disabled items inert', async () => {
    const user = userEvent.setup();
    const onselect = vi.fn();
    render(Sidebar, {
      title: 'Workspace',
      label: 'Workspace navigation',
      items: [
        { value: 'overview', label: 'Overview' },
        { value: 'billing', label: 'Billing', disabled: true }
      ],
      onselect
    });
    expect(screen.getByRole('navigation', { name: 'Workspace navigation' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Overview' }));
    expect(onselect).toHaveBeenCalledWith(expect.objectContaining({ value: 'overview' }), expect.any(MouseEvent));
    const disabledItem = screen.getByRole('button', { name: 'Billing' });
    expect(disabledItem.disabled).toBe(true);
    await user.click(disabledItem);
    expect(onselect).toHaveBeenCalledTimes(1);
  });

  test('selects an item identified only by its label', async () => {
    const user = userEvent.setup();
    const { container } = render(Sidebar, { title: 'Workspace', items: [{ label: 'Reports' }] });
    const item = screen.getByRole('button', { name: 'Reports' });

    await user.click(item);

    expect(item.getAttribute('aria-current')).toBe('page');
    expect(container.querySelector('.aesir-sidebar__mobile-heading')?.textContent).toContain('Reports');
  });

  test('ends an active resize when the resize handle is removed', async () => {
    const { container, rerender } = render(Sidebar, { items: [], resizable: true });
    const sidebar = container.querySelector('.aesir-sidebar');
    const handle = screen.getByRole('separator', { name: 'Resize navigation' });
    handle.setPointerCapture = vi.fn();

    await fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 100 });
    expect(sidebar.dataset.resizing).toBe('true');

    await rerender({ items: [], resizable: false });
    expect(screen.queryByRole('separator', { name: 'Resize navigation' })).toBeNull();
    expect(sidebar.dataset.resizing).toBe('false');
  });

  test('ends an active resize when the sidebar collapses', async () => {
    const { container, rerender } = render(Sidebar, { items: [], resizable: true, collapsible: true, collapsed: false });
    const sidebar = container.querySelector('.aesir-sidebar');
    const handle = screen.getByRole('separator', { name: 'Resize navigation' });
    handle.setPointerCapture = vi.fn();

    await fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 100 });
    expect(sidebar.dataset.resizing).toBe('true');

    await rerender({ items: [], resizable: true, collapsible: true, collapsed: true });
    expect(screen.queryByRole('separator', { name: 'Resize navigation' })).toBeNull();
    expect(sidebar.dataset.resizing).toBe('false');
  });

  test('reports the visible width when the allowed range changes', async () => {
    const { container, rerender } = render(Sidebar, { items: [], mode: 'desktop', resizable: true, width: 400, minWidth: 200, maxWidth: 448 });
    const sidebar = container.querySelector('.aesir-sidebar');
    const handle = screen.getByRole('separator', { name: 'Resize navigation' });

    expect(handle.getAttribute('aria-valuenow')).toBe('400');
    await rerender({ items: [], mode: 'desktop', resizable: true, width: 400, minWidth: 200, maxWidth: 300 });

    expect(sidebar.style.getPropertyValue('--aesir-sidebar-width').trim()).toBe('300px');
    expect(handle.getAttribute('aria-valuemax')).toBe('300');
    expect(handle.getAttribute('aria-valuenow')).toBe('300');
  });
});
