import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import PopoverFixture from './fixtures/popover-fixture.svelte';
import DynamicHoverFixture from './fixtures/popover-dynamic-hover-fixture.svelte';
import { tick } from 'svelte';

describe('AesirPopover', () => {
  test('exposes trigger state, portals content, and closes with Escape', async () => {
    const user = userEvent.setup();
    render(PopoverFixture);
    const trigger = screen.getByRole('button', { name: 'Display options' });

    await user.click(trigger);
    const popover = await screen.findByRole('dialog');

    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(popover.parentElement).toBe(document.body);

    await user.keyboard('{Escape}');

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  test('restores focus to the trigger after Escape from popover content', async () => {
    const user = userEvent.setup();
    render(PopoverFixture);
    const trigger = screen.getByRole('button', { name: 'Display options' });

    await user.click(trigger);
    const apply = await screen.findByRole('button', { name: 'Apply' });
    apply.focus();
    expect(document.activeElement).toBe(apply);

    await user.keyboard('{Escape}');

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  test('closes from its content callback and outside pointer presses', async () => {
    const user = userEvent.setup();
    render(PopoverFixture);
    const trigger = screen.getByRole('button', { name: 'Display options' });

    await user.click(trigger);
    await user.click(await screen.findByRole('button', { name: 'Apply' }));
    expect(screen.getByRole('status', { name: 'Popover state' }).textContent).toBe('closed');

    await user.click(trigger);
    await fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.getByRole('status', { name: 'Popover state' }).textContent).toBe('closed');
  });

  test('ignores secondary outside presses', async () => {
    const user = userEvent.setup();
    render(PopoverFixture);
    const trigger = screen.getByRole('button', { name: 'Display options' });

    await user.click(trigger);
    await screen.findByRole('dialog');
    await fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }), { button: 2 });

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  test('removes the portal and global handlers when unmounted open', async () => {
    const user = userEvent.setup();
    const { unmount } = render(PopoverFixture);

    await user.click(screen.getByRole('button', { name: 'Display options' }));
    await screen.findByRole('dialog');
    unmount();

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(() => document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))).not.toThrow();
    expect(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))).not.toThrow();
  });

  test('cancels a pending hover opening when hover behavior is disabled', async () => {
    vi.useFakeTimers();
    try {
      render(DynamicHoverFixture);
      await fireEvent.pointerEnter(screen.getByRole('button', { name: 'Open preview' }), { pointerType: 'mouse' });
      await fireEvent.click(screen.getByRole('button', { name: 'Disable hover opening' }));
      vi.advanceTimersByTime(100);
      await tick();

      expect(screen.getByRole('status', { name: 'Popover state' }).textContent).toBe('closed');
      expect(screen.queryByRole('dialog')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  test('closes a hover-only opening when hover behavior is disabled', async () => {
    vi.useFakeTimers();
    try {
      render(DynamicHoverFixture);
      await fireEvent.pointerEnter(screen.getByRole('button', { name: 'Open preview' }), { pointerType: 'mouse' });
      vi.advanceTimersByTime(100);
      await tick();
      expect(screen.getByRole('status', { name: 'Popover state' }).textContent).toBe('open');

      await fireEvent.click(screen.getByRole('button', { name: 'Disable hover opening' }));
      expect(screen.getByRole('status', { name: 'Popover state' }).textContent).toBe('closed');
    } finally {
      vi.useRealTimers();
    }
  });

  test('keeps a click-opened popover when hover behavior is disabled', async () => {
    render(DynamicHoverFixture);
    await fireEvent.click(screen.getByRole('button', { name: 'Open preview' }));
    expect(screen.getByRole('status', { name: 'Popover state' }).textContent).toBe('open');

    await fireEvent.click(screen.getByRole('button', { name: 'Disable hover opening' }));
    expect(screen.getByRole('status', { name: 'Popover state' }).textContent).toBe('open');
  });

  test('allows hover opening again after the parent closes a click-opened popover', async () => {
    vi.useFakeTimers();
    try {
      render(DynamicHoverFixture);
      const trigger = screen.getByRole('button', { name: 'Open preview' });
      await fireEvent.click(trigger);
      expect(screen.getByRole('status', { name: 'Popover state' }).textContent).toBe('open');

      await fireEvent.click(screen.getByRole('button', { name: 'Close via parent' }));
      expect(screen.getByRole('status', { name: 'Popover state' }).textContent).toBe('closed');

      await fireEvent.pointerEnter(trigger, { pointerType: 'mouse' });
      vi.advanceTimersByTime(100);
      await tick();
      expect(screen.getByRole('status', { name: 'Popover state' }).textContent).toBe('open');
    } finally {
      vi.useRealTimers();
    }
  });
});
