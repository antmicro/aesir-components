import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import ContextMenuFixture from './fixtures/context-menu-fixture.svelte';

describe('ContextMenu', () => {
  test('consumes the outside click and keeps focus inside until dismissed', async () => {
    const user = userEvent.setup();
    render(ContextMenuFixture);
    const trigger = screen.getByRole('button', { name: 'File surface' });
    const outside = screen.getByRole('button', { name: 'Outside' });
    await fireEvent.contextMenu(trigger);
    const copy = await screen.findByRole('menuitem', { name: 'Copy' });
    await waitFor(() => expect(document.activeElement).toBe(copy));
    expect(document.querySelector('[data-aesir-menu-backdrop]')).toBeTruthy();
    outside.focus();
    expect(document.activeElement).toBe(copy);
    await user.keyboard('{Tab}');
    expect(document.activeElement).toBe(copy);
    await user.click(outside);
    expect(screen.queryByRole('menu', { name: 'File actions' })).toBeNull();
    expect(screen.getByRole('status', { name: 'Outside clicks' }).textContent).toBe('0');
    expect(document.activeElement).toBe(trigger);
    await user.click(outside);
    expect(screen.getByRole('status', { name: 'Outside clicks' }).textContent).toBe('1');
  });
  test('opens at the pointer, supports selection, and restores focus', async () => {
    const user = userEvent.setup();
    render(ContextMenuFixture);
    const trigger = screen.getByRole('button', { name: 'File surface' });
    trigger.focus();

    await fireEvent.contextMenu(trigger, { clientX: 120, clientY: 80 });
    const menu = await screen.findByRole('menu', { name: 'File actions' });
    expect(menu.parentElement?.parentElement).toBe(document.body);
    expect(document.documentElement.style.overflow).toBe('hidden');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Copy' })));

    await user.keyboard('{Enter}');
    expect(screen.getByRole('status', { name: 'Selected action' }).textContent).toBe('copy');
    await waitFor(() => expect(document.documentElement.style.overflow).toBe(''));
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  test('returns focus to the invoked control even when it was not focused before opening', async () => {
    const user = userEvent.setup();
    render(ContextMenuFixture);
    const trigger = screen.getByRole('button', { name: 'File surface' });
    screen.getByRole('button', { name: 'Outside' }).focus();

    await fireEvent.contextMenu(trigger);
    await user.click(await screen.findByRole('menuitem', { name: 'Copy' }));

    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  test('closes on an outside primary press but ignores secondary presses', async () => {
    render(ContextMenuFixture);
    const trigger = screen.getByRole('button', { name: 'File surface' });
    const outside = screen.getByRole('button', { name: 'Outside' });

    await fireEvent.contextMenu(trigger);
    await screen.findByRole('menu', { name: 'File actions' });
    await fireEvent.pointerDown(outside, { button: 2 });
    expect(screen.getByRole('menu', { name: 'File actions' })).toBeTruthy();

    await fireEvent.pointerDown(outside, { button: 0 });
    expect(screen.queryByRole('menu', { name: 'File actions' })).toBeNull();
  });

  test('does not steal focus back when an outside control closes it', async () => {
    const user = userEvent.setup();
    render(ContextMenuFixture, { props: { modal: false } });
    const trigger = screen.getByRole('button', { name: 'File surface' });
    const outside = screen.getByRole('button', { name: 'Outside' });

    trigger.focus();
    await fireEvent.contextMenu(trigger);
    await screen.findByRole('menu', { name: 'File actions' });
    await user.click(outside);

    expect(screen.queryByRole('menu', { name: 'File actions' })).toBeNull();
    expect(document.activeElement).toBe(outside);
  });

  test('keeps only one context menu open at a time', async () => {
    render(ContextMenuFixture, { props: { modal: false } });
    const first = screen.getByRole('button', { name: 'File surface' });
    const second = screen.getByRole('button', { name: 'Second surface' });

    await fireEvent.contextMenu(first);
    await screen.findByRole('menu', { name: 'File actions' });
    await fireEvent.contextMenu(second);

    expect(screen.queryByRole('menu', { name: 'File actions' })).toBeNull();
    expect(screen.getByRole('menu', { name: 'Second actions' })).toBeTruthy();
  });

  test('opens and navigates a nested submenu with the keyboard', async () => {
    const user = userEvent.setup();
    render(ContextMenuFixture);
    await fireEvent.contextMenu(screen.getByRole('button', { name: 'Second surface' }));
    const status = await screen.findByRole('menuitem', { name: 'Status' });

    await waitFor(() => expect(document.activeElement).toBe(status));
    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Done' })));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Todo' }));
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(status);
  });

  test('opens a submenu through its displayed keyboard shortcut', async () => {
    const user = userEvent.setup();
    render(ContextMenuFixture);
    await fireEvent.contextMenu(screen.getByRole('button', { name: 'Second surface' }));

    const status = await screen.findByRole('menuitem', { name: 'Status' });
    expect(screen.getByText('s').closest('kbd')?.classList.contains('aesir-kbd')).toBe(true);
    await user.keyboard('s');

    expect(status.getAttribute('aria-expanded')).toBe('true');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Done' })));

    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{Shift>}s{/Shift}');
    expect(status.getAttribute('aria-expanded')).toBe('true');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Done' })));
  });

  test('opens no submenu initially and keeps only the hovered submenu open', async () => {
    render(ContextMenuFixture);
    await fireEvent.contextMenu(screen.getByRole('button', { name: 'Second surface' }));
    const status = await screen.findByRole('menuitem', { name: 'Status' });
    const priority = screen.getByRole('menuitem', { name: 'Priority' });

    expect(screen.queryByRole('menu', { name: 'Status' })).toBeNull();
    await fireEvent.pointerEnter(status);
    expect(screen.getByRole('menu', { name: 'Status' })).toBeTruthy();
    await fireEvent.pointerEnter(priority);
    await waitFor(() => expect(screen.queryByRole('menu', { name: 'Status' })).toBeNull());
    expect(screen.getByRole('menu', { name: 'Priority' })).toBeTruthy();
  });

  test('does not immediately close a submenu while the pointer crosses toward it', async () => {
    render(ContextMenuFixture);
    await fireEvent.contextMenu(screen.getByRole('button', { name: 'Second surface' }));
    const status = await screen.findByRole('menuitem', { name: 'Status' });

    await fireEvent.pointerEnter(status, { pointerType: 'mouse', clientX: 120, clientY: 100 });
    const submenu = screen.getByRole('menu', { name: 'Status' });
    const wrapper = status.closest('.context-menu-submenu');
    await fireEvent.pointerMove(wrapper, { pointerType: 'mouse', clientX: 150, clientY: 105 });
    await fireEvent.pointerLeave(wrapper, { pointerType: 'mouse', clientX: 165, clientY: 110 });

    expect(submenu.isConnected).toBe(true);
    await waitFor(() => expect(screen.queryByRole('menu', { name: 'Status' })).toBeNull(), { timeout: 700 });
  });

  test('closes the root menu with Escape and releases the scroll lock', async () => {
    const user = userEvent.setup();
    render(ContextMenuFixture);
    const trigger = screen.getByRole('button', { name: 'File surface' });

    trigger.focus();
    await fireEvent.contextMenu(trigger);
    await screen.findByRole('menu', { name: 'File actions' });
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu', { name: 'File actions' })).toBeNull();
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.activeElement).toBe(trigger);
  });

  test('reopens at the latest invocation target without retaining submenu state', async () => {
    render(ContextMenuFixture, { props: { modal: false } });
    const first = screen.getByRole('button', { name: 'File surface' });
    const second = screen.getByRole('button', { name: 'Second surface' });

    await fireEvent.contextMenu(second, { clientX: 80, clientY: 60 });
    const status = await screen.findByRole('menuitem', { name: 'Status' });
    await fireEvent.pointerEnter(status);
    expect(screen.getByRole('menu', { name: 'Status' })).toBeTruthy();

    await fireEvent.contextMenu(first, { clientX: 220, clientY: 140 });

    expect(screen.queryByRole('menu', { name: 'Status' })).toBeNull();
    expect(screen.queryByRole('menu', { name: 'Second actions' })).toBeNull();
    expect(screen.getByRole('menu', { name: 'File actions' })).toBeTruthy();
  });

  test('clears submenu state after an external close and reopen', async () => {
    render(ContextMenuFixture);
    const trigger = screen.getByRole('button', { name: 'Second surface' });

    await fireEvent.contextMenu(trigger);
    await fireEvent.pointerEnter(await screen.findByRole('menuitem', { name: 'Status' }));
    expect(screen.getByRole('menu', { name: 'Status' })).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Close second externally' }));
    expect(screen.queryByRole('menu', { name: 'Second actions' })).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'Open second externally' }));
    expect(screen.getByRole('menu', { name: 'Second actions' })).toBeTruthy();
    expect(screen.queryByRole('menu', { name: 'Status' })).toBeNull();
    await fireEvent.pointerEnter(screen.getByRole('menuitem', { name: 'Status' }));
    expect(screen.getByRole('menu', { name: 'Status' })).toBeTruthy();
  });

  test('resets an open submenu when the same context menu is invoked again', async () => {
    render(ContextMenuFixture, { props: { modal: false } });
    const trigger = screen.getByRole('button', { name: 'Second surface' });

    await fireEvent.contextMenu(trigger, { clientX: 80, clientY: 60 });
    await fireEvent.pointerEnter(await screen.findByRole('menuitem', { name: 'Status' }));
    expect(screen.getByRole('menu', { name: 'Status' })).toBeTruthy();

    await fireEvent.contextMenu(trigger, { clientX: 220, clientY: 140 });
    expect(screen.queryByRole('menu', { name: 'Status' })).toBeNull();
  });
});
