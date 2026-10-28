import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import TooltipFixture from './fixtures/tooltip-fixture.svelte';
import TooltipModalFixture from './fixtures/tooltip-modal-fixture.svelte';

describe('AesirTooltip', () => {
  test('opens inside a modal, blocks background help, and consumes Escape before the modal', async () => {
    const user = userEvent.setup();
    render(TooltipModalFixture);
    await user.click(screen.getByRole('button', { name: 'Open modal' }));
    await screen.findByRole('dialog', { name: 'Tooltip modal' });
    const help = screen.getByRole('button', { name: 'Help' });
    await user.hover(help);
    expect((await screen.findByRole('tooltip')).textContent).toBe('Modal help');
    await user.keyboard('{Escape}');
    expect(help.hasAttribute('aria-describedby')).toBe(false);
    expect(screen.getByRole('dialog', { name: 'Tooltip modal' })).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
    await user.hover(screen.getByRole('button', { name: 'Background' }));
    expect(screen.getByRole('button', { name: 'Background' }).hasAttribute('aria-describedby')).toBe(false);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  test('opens on keyboard focus inside a modal', async () => {
    const user = userEvent.setup();
    render(TooltipModalFixture);
    await user.click(screen.getByRole('button', { name: 'Open modal' }));
    await screen.findByRole('dialog');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close dialog' })));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Help' }));
    expect((await screen.findByRole('tooltip')).textContent).toBe('Modal help');
  });
  test('describes its trigger on hover and closes with Escape', async () => {
    const user = userEvent.setup();
    render(TooltipFixture);
    const trigger = screen.getByRole('button', { name: 'Copy' });

    await user.hover(trigger);
    const tooltip = await screen.findByRole('tooltip');

    expect(tooltip.textContent).toBe('Copy URL');
    expect(tooltip.parentElement).toBe(document.body);
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);

    await user.keyboard('{Escape}');
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);
  });

  test('opens for keyboard focus and dismisses before another overlay opens', async () => {
    const user = userEvent.setup();
    render(TooltipFixture);
    const trigger = screen.getByRole('button', { name: 'Copy' });

    await user.tab();
    await screen.findByRole('tooltip');

    await fireEvent(document, new CustomEvent('aesir:tooltip-dismiss'));
    await waitFor(() => expect(trigger.hasAttribute('aria-describedby')).toBe(false));
  });

  test('stays open when the pointer leaves a focused trigger', async () => {
    const user = userEvent.setup();
    render(TooltipFixture);
    const trigger = screen.getByRole('button', { name: 'Copy' });

    await user.hover(trigger);
    await screen.findByRole('tooltip');
    await user.tab();
    expect(document.activeElement).toBe(trigger);

    await user.unhover(trigger);
    expect(trigger.hasAttribute('aria-describedby')).toBe(true);

    await user.tab();
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);
  });

  test('stays open when focus leaves a hovered trigger', async () => {
    const user = userEvent.setup();
    render(TooltipFixture);
    const trigger = screen.getByRole('button', { name: 'Copy' });

    await user.hover(trigger);
    await screen.findByRole('tooltip');
    await user.tab();
    expect(document.activeElement).toBe(trigger);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Outside' }));
    expect(trigger.hasAttribute('aria-describedby')).toBe(true);

    await user.unhover(trigger);
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);
  });

  test('does not open on devices without hover or a fine pointer', async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(hover: none), (pointer: coarse)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
    try {
      const user = userEvent.setup();
      render(TooltipFixture);
      const trigger = screen.getByRole('button', { name: 'Copy' });

      await user.hover(trigger);
      trigger.focus();

      expect(screen.queryByRole('tooltip')).toBeNull();
      expect(trigger.hasAttribute('aria-describedby')).toBe(false);
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  test('does not open when disabled', async () => {
    const user = userEvent.setup();
    render(TooltipFixture, { disabled: true });
    const trigger = screen.getByRole('button', { name: 'Copy' });

    await user.hover(trigger);
    trigger.focus();

    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);
  });

  test('removes an open tooltip when its content becomes empty', async () => {
    const user = userEvent.setup();
    const view = render(TooltipFixture);
    const trigger = screen.getByRole('button', { name: 'Copy' });

    await user.hover(trigger);
    await screen.findByRole('tooltip');
    await view.rerender({ content: '' });

    expect(trigger.hasAttribute('aria-describedby')).toBe(false);
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
  });
});
