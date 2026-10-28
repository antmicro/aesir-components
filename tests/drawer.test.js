import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import Drawer from '../src/components/aesir-drawer/aesir-drawer.svelte';
import DrawerFixture from './fixtures/drawer-fixture.svelte';

describe('AesirDrawer', () => {
  test('locks the document, traps focus, closes with Escape, and restores focus', async () => {
    const user = userEvent.setup();
    render(DrawerFixture);
    const trigger = screen.getByRole('button', { name: 'Open details' });

    await user.click(trigger);
    const drawer = await screen.findByRole('dialog', { name: 'Project details' });
    const closeButton = screen.getByRole('button', { name: 'Close drawer' });
    const doneButton = screen.getByRole('button', { name: 'Done' });

    expect(drawer.closest('body')).toBe(document.body);
    expect(document.documentElement.dataset.overlayOpen).toBe('true');

    closeButton.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(doneButton);

    await user.keyboard('{Escape}');

    expect(screen.getByRole('status', { name: 'Drawer state' }).textContent).toBe('closed');
    expect(screen.getByRole('status', { name: 'Close count' }).textContent).toBe('1');
    await waitFor(() => expect(document.documentElement.dataset.overlayOpen).toBeUndefined());
    expect(document.activeElement).toBe(trigger);
  });

  test('ignores content presses and closes from its backdrop', async () => {
    const user = userEvent.setup();
    render(DrawerFixture);

    await user.click(screen.getByRole('button', { name: 'Open details' }));
    const drawer = await screen.findByRole('dialog', { name: 'Project details' });
    const backdrop = drawer.parentElement;

    await fireEvent.pointerDown(drawer);
    expect(screen.getByRole('status', { name: 'Drawer state' }).textContent).toBe('open');

    await fireEvent.pointerDown(backdrop);
    expect(screen.getByRole('status', { name: 'Drawer state' }).textContent).toBe('closed');
  });

  test('ignores secondary presses on its backdrop', async () => {
    const user = userEvent.setup();
    render(DrawerFixture);

    await user.click(screen.getByRole('button', { name: 'Open details' }));
    const drawer = await screen.findByRole('dialog', { name: 'Project details' });

    await fireEvent.pointerDown(drawer.parentElement, { button: 2 });
    expect(screen.getByRole('status', { name: 'Drawer state' }).textContent).toBe('open');
    expect(screen.getByRole('status', { name: 'Close count' }).textContent).toBe('0');
  });

  test('releases its portal, focus trap, and document lock when unmounted open', async () => {
    const user = userEvent.setup();
    const { unmount } = render(DrawerFixture);

    await user.click(screen.getByRole('button', { name: 'Open details' }));
    await screen.findByRole('dialog', { name: 'Project details' });
    expect(document.documentElement.dataset.overlayOpen).toBe('true');

    unmount();

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Project details' })).toBeNull());
    expect(document.documentElement.dataset.overlayOpen).toBeUndefined();
    expect(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))).not.toThrow();
  });

  test('calls onclose exactly once for one dismissal', async () => {
    const user = userEvent.setup();
    render(DrawerFixture);

    await user.click(screen.getByRole('button', { name: 'Open details' }));
    await screen.findByRole('dialog', { name: 'Project details' });
    await user.keyboard('{Escape}{Escape}');

    expect(screen.getByRole('status', { name: 'Close count' }).textContent).toBe('1');
  });

  test('hides the exiting drawer from the accessibility tree', async () => {
    const { rerender } = render(Drawer, { open: true, label: 'Project details' });
    await screen.findByRole('dialog', { name: 'Project details' });

    await rerender({ open: false, label: 'Project details' });
    const exiting = document.querySelector('.aesir-drawer[data-state="closed"]');

    expect(exiting).not.toBeNull();
    expect(exiting.getAttribute('aria-hidden')).toBe('true');
    expect(exiting.hasAttribute('inert')).toBe(true);
    expect(screen.queryByRole('dialog', { name: 'Project details' })).toBeNull();

    await rerender({ open: true, label: 'Project details' });
    expect(screen.getByRole('dialog', { name: 'Project details' })).toBe(exiting);
    expect(exiting.hasAttribute('inert')).toBe(false);
  });
});
