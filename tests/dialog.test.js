import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import DialogFixture from './fixtures/dialog-fixture.svelte';

const dialogState = () => screen.getByRole('status', { name: 'Dialog state' });

describe('AesirDialog', () => {
  test('portals, locks scrolling, closes with Escape, and restores focus', async () => {
    const user = userEvent.setup();
    render(DialogFixture);
    const trigger = screen.getByRole('button', { name: 'Open settings' });

    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Settings' });

    expect(dialog.closest('body')).toBe(document.body);
    expect(document.documentElement.dataset.overlayOpen).toBe('true');
    expect(dialogState().textContent).toBe('open');
    expect(dialog.getAttribute('aria-labelledby')).toBe(screen.getByRole('heading', { name: 'Settings' }).id);
    expect(dialog.getAttribute('aria-describedby')).toBe(screen.getByText('Manage workspace settings.').id);
    const closeButton = screen.getByRole('button', { name: 'Close dialog' });
    const lastFocusable = screen.getByRole('button', { name: 'Open nested commands' });

    closeButton.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(lastFocusable);
    await user.tab();
    expect(document.activeElement).toBe(closeButton);

    await user.keyboard('{Escape}');

    expect(dialogState().textContent).toBe('closed');
    await waitFor(() => expect(document.documentElement.dataset.overlayOpen).toBeUndefined());
    expect(document.activeElement).toBe(trigger);
  });

  test('closes only when the backdrop itself is pressed', async () => {
    const user = userEvent.setup();
    render(DialogFixture);

    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    const dialog = await screen.findByRole('dialog', { name: 'Settings' });
    const backdrop = dialog.parentElement;

    await fireEvent.pointerDown(dialog);
    expect(dialogState().textContent).toBe('open');

    await fireEvent.pointerDown(backdrop);
    expect(dialogState().textContent).toBe('closed');
  });

  test('restores entry motion when reopened after an instant Escape close', async () => {
    const user = userEvent.setup();
    render(DialogFixture);
    const trigger = screen.getByRole('button', { name: 'Open settings' });

    await user.click(trigger);
    const firstDialog = await screen.findByRole('dialog', { name: 'Settings' });
    expect(firstDialog.hasAttribute('data-instant')).toBe(false);

    await user.keyboard('{Escape}');
    expect(firstDialog.hasAttribute('data-instant')).toBe(true);
    expect(dialogState().textContent).toBe('closed');

    await user.click(trigger);
    const reopenedDialog = await screen.findByRole('dialog', { name: 'Settings' });
    expect(reopenedDialog.getAttribute('data-state')).toBe('open');
    expect(reopenedDialog.hasAttribute('data-instant')).toBe(false);
  });

  test('lets only the topmost modal layer handle Escape', async () => {
    const user = userEvent.setup();
    render(DialogFixture);

    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    await user.click(screen.getByRole('button', { name: 'Open nested commands' }));
    await screen.findByRole('dialog', { name: 'Nested commands' });

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Nested commands' })).toBeNull());
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeTruthy();
    expect(document.documentElement.dataset.overlayOpen).toBe('true');

    await user.keyboard('{Escape}');
    expect(dialogState().textContent).toBe('closed');
  });

  test('releases the portal, scroll lock, and document handlers when unmounted open', async () => {
    const user = userEvent.setup();
    const { unmount } = render(DialogFixture);

    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    await screen.findByRole('dialog', { name: 'Settings' });
    expect(document.documentElement.dataset.overlayOpen).toBe('true');

    unmount();
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Settings' })).toBeNull();
      expect(document.documentElement.dataset.overlayOpen).toBeUndefined();
    });
    expect(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))).not.toThrow();
  });
});
