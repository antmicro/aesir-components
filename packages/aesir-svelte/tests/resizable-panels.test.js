import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import AesirResizablePanels from '../src/components/aesir-resizable-panels/aesir-resizable-panels.svelte';

describe('AesirResizablePanels', () => {
  test('resizes from the captured pointer and stops on capture loss or unmount', async () => {
    const onsizechange = vi.fn();
    const { unmount } = render(AesirResizablePanels, { onsizechange });
    const handle = screen.getByRole('separator');
    handle.setPointerCapture = vi.fn();
    const pointer = (type, pointerId, clientX) => fireEvent(handle, new PointerEvent(type, { bubbles: true, pointerId, clientX, button: 0 }));

    await pointer('pointerdown', 1, 0);
    expect(handle.setPointerCapture).toHaveBeenCalledWith(1);
    await pointer('pointermove', 2, 16);
    expect(onsizechange).not.toHaveBeenCalled();
    await pointer('pointermove', 1, 16);
    expect(handle.getAttribute('aria-valuenow')).toBe('60');
    await pointer('lostpointercapture', 1, 16);
    await pointer('pointermove', 1, 32);
    expect(onsizechange).toHaveBeenCalledTimes(1);

    await pointer('pointerdown', 1, 16);
    unmount();
    await fireEvent(window, new PointerEvent('pointermove', { pointerId: 1, clientX: 100 }));
    expect(onsizechange).toHaveBeenCalledTimes(1);
  });

  test('supports arrow, accelerated arrow, Home, and End keyboard resizing', async () => {
    const user = userEvent.setup();
    const onsizechange = vi.fn();
    render(AesirResizablePanels, { size: 50, min: 20, max: 80, onsizechange });
    const handle = screen.getByRole('separator');

    handle.focus();
    await user.keyboard('{ArrowRight}');
    expect(handle.getAttribute('aria-valuenow')).toBe('52');
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(handle.getAttribute('aria-valuenow')).toBe('62');
    await user.keyboard('{Home}');
    expect(handle.getAttribute('aria-valuenow')).toBe('20');
    await user.keyboard('{End}');
    expect(handle.getAttribute('aria-valuenow')).toBe('80');
    expect(onsizechange).toHaveBeenCalledTimes(4);
  });

  test('only consumes arrow keys along the current resize axis', async () => {
    const onsizechange = vi.fn();
    const { rerender } = render(AesirResizablePanels, { size: 50, orientation: 'horizontal', onsizechange });
    const handle = screen.getByRole('separator');
    const press = async (key) => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      await fireEvent(handle, event);
      return event.defaultPrevented;
    };

    expect(await press('ArrowDown')).toBe(false);
    expect(handle.getAttribute('aria-valuenow')).toBe('50');
    expect(await press('ArrowRight')).toBe(true);
    expect(handle.getAttribute('aria-valuenow')).toBe('52');

    await rerender({ size: 50, orientation: 'vertical', onsizechange });
    expect(await press('ArrowRight')).toBe(false);
    expect(handle.getAttribute('aria-valuenow')).toBe('50');
    expect(await press('ArrowDown')).toBe(true);
    expect(handle.getAttribute('aria-valuenow')).toBe('52');
    expect(onsizechange.mock.calls).toEqual([[52], [52]]);
  });

  test('clamps pointer and keyboard resizing to the public range', async () => {
    const user = userEvent.setup();
    render(AesirResizablePanels, { size: 50, min: 30, max: 70 });
    const handle = screen.getByRole('separator');
    const root = handle.closest('.aesir-resizable-panels');
    root.getBoundingClientRect = () => new DOMRect(0, 0, 100, 100);
    handle.setPointerCapture = vi.fn();

    await fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientX: 50 });
    await fireEvent.pointerMove(handle, { pointerId: 1, clientX: 500 });
    expect(handle.getAttribute('aria-valuenow')).toBe('70');
    await fireEvent.pointerUp(handle, { pointerId: 1 });

    handle.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(handle.getAttribute('aria-valuenow')).toBe('70');
  });

  test('uses the visible size after limits change for accessibility and the next resize', async () => {
    const user = userEvent.setup();
    const onsizechange = vi.fn();
    const { rerender } = render(AesirResizablePanels, { size: 50, min: 20, max: 80, onsizechange });
    const handle = screen.getByRole('separator');
    const root = handle.closest('.aesir-resizable-panels');

    await rerender({ size: 50, min: 60, max: 80, onsizechange });
    expect(root.style.getPropertyValue('--aesir-panel-size')).toBe('60%');
    expect(handle.getAttribute('aria-valuenow')).toBe('60');
    expect(onsizechange).not.toHaveBeenCalled();

    root.getBoundingClientRect = () => new DOMRect(0, 0, 100, 100);
    handle.setPointerCapture = vi.fn();
    await fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientX: 0 });
    await fireEvent.pointerMove(handle, { pointerId: 1, clientX: 10 });
    expect(handle.getAttribute('aria-valuenow')).toBe('70');
    await fireEvent.pointerUp(handle, { pointerId: 1 });

    await rerender({ size: 50, min: 60, max: 80, onsizechange });
    handle.focus();
    await user.keyboard('{ArrowRight}');
    expect(handle.getAttribute('aria-valuenow')).toBe('62');
    expect(onsizechange.mock.calls).toEqual([[70], [62]]);
  });

  test('keeps the layout and separator range valid when numeric props become non-finite', async () => {
    const { rerender } = render(AesirResizablePanels, { size: 40, min: 10, max: 90 });
    const handle = screen.getByRole('separator');
    const root = handle.closest('.aesir-resizable-panels');

    await rerender({ size: Number.NaN, min: Number.NaN, max: Number.POSITIVE_INFINITY });

    expect(root.style.getPropertyValue('--aesir-panel-size')).toBe('50%');
    expect(handle.getAttribute('aria-valuemin')).toBe('20');
    expect(handle.getAttribute('aria-valuemax')).toBe('80');
    expect(handle.getAttribute('aria-valuenow')).toBe('50');

    await rerender({ size: 150, min: -20, max: 120 });
    expect(root.style.getPropertyValue('--aesir-panel-size')).toBe('100%');
    expect(handle.getAttribute('aria-valuemin')).toBe('0');
    expect(handle.getAttribute('aria-valuemax')).toBe('100');
    expect(handle.getAttribute('aria-valuenow')).toBe('100');

    await rerender({ size: 30, min: 70, max: 20 });
    expect(root.style.getPropertyValue('--aesir-panel-size')).toBe('70%');
    expect(handle.getAttribute('aria-valuemin')).toBe('70');
    expect(handle.getAttribute('aria-valuemax')).toBe('70');
    expect(handle.getAttribute('aria-valuenow')).toBe('70');
  });

  test('makes a disabled separator inert and removes it from the tab order', async () => {
    const user = userEvent.setup();
    const onsizechange = vi.fn();
    render(AesirResizablePanels, { size: 50, disabled: true, onsizechange });
    const handle = screen.getByRole('separator');
    handle.setPointerCapture = vi.fn();

    expect(handle.getAttribute('aria-disabled')).toBe('true');
    expect(handle.getAttribute('tabindex')).toBe('-1');
    handle.focus();
    await user.keyboard('{ArrowRight}{End}');
    await fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientX: 0 });
    await fireEvent.pointerMove(handle, { pointerId: 1, clientX: 100 });

    expect(handle.getAttribute('aria-valuenow')).toBe('50');
    expect(handle.setPointerCapture).not.toHaveBeenCalled();
    expect(onsizechange).not.toHaveBeenCalled();
  });

  test('reports the inverse separator orientation for vertical layouts', () => {
    render(AesirResizablePanels, { orientation: 'vertical', label: 'Resize rows' });

    expect(screen.getByRole('separator', { name: 'Resize rows' }).getAttribute('aria-orientation')).toBe('horizontal');
  });

  test('keeps the panel sizing variable when consumers provide root styles', async () => {
    const { rerender } = render(AesirResizablePanels, { size: 35, style: 'background: red;' });
    const root = screen.getByRole('separator').closest('.aesir-resizable-panels');

    expect(root.style.background).toBe('red');
    expect(root.style.getPropertyValue('--aesir-panel-size')).toBe('35%');

    await rerender({ size: 45, style: 'background: blue;' });
    expect(root.style.background).toBe('blue');
    expect(root.style.getPropertyValue('--aesir-panel-size')).toBe('45%');
  });

  test('preserves a consumer size update during an active drag when the pointer has not moved', async () => {
    const onsizechange = vi.fn();
    const { rerender } = render(AesirResizablePanels, { size: 50, onsizechange });
    const handle = screen.getByRole('separator');
    const root = handle.closest('.aesir-resizable-panels');
    root.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    handle.setPointerCapture = vi.fn();

    await fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientX: 100 });
    await rerender({ size: 70, onsizechange });
    expect(handle.getAttribute('aria-valuenow')).toBe('70');

    await fireEvent.pointerMove(handle, { pointerId: 1, clientX: 100 });
    expect(handle.getAttribute('aria-valuenow')).toBe('70');
    expect(onsizechange).not.toHaveBeenCalled();

    await fireEvent.pointerMove(handle, { pointerId: 1, clientX: 110 });
    expect(handle.getAttribute('aria-valuenow')).toBe('75');
    expect(onsizechange.mock.calls).toEqual([[75]]);
  });

  test('uses the current container width after it changes during a drag', async () => {
    const onsizechange = vi.fn();
    render(AesirResizablePanels, { size: 50, onsizechange });
    const handle = screen.getByRole('separator');
    const root = handle.closest('.aesir-resizable-panels');
    let width = 200;
    root.getBoundingClientRect = () => new DOMRect(0, 0, width, 100);
    handle.setPointerCapture = vi.fn();

    await fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientX: 100 });
    await fireEvent.pointerMove(handle, { pointerId: 1, clientX: 120 });
    expect(handle.getAttribute('aria-valuenow')).toBe('60');

    width = 400;
    await fireEvent.pointerMove(handle, { pointerId: 1, clientX: 140 });
    expect(handle.getAttribute('aria-valuenow')).toBe('65');
    expect(onsizechange.mock.calls).toEqual([[60], [65]]);
  });

  test.each([
    ['becomes disabled', { disabled: true, orientation: 'horizontal' }],
    ['changes orientation', { disabled: false, orientation: 'vertical' }]
  ])('cancels a drag when the layout %s', async (_reason, changedProps) => {
    const onsizechange = vi.fn();
    const { rerender } = render(AesirResizablePanels, { size: 50, disabled: false, orientation: 'horizontal', onsizechange });
    const handle = screen.getByRole('separator');
    const root = handle.closest('.aesir-resizable-panels');
    root.getBoundingClientRect = () => new DOMRect(0, 0, 100, 100);
    handle.setPointerCapture = vi.fn();
    handle.hasPointerCapture = vi.fn(() => true);
    handle.releasePointerCapture = vi.fn();

    await fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientX: 0 });
    expect(root.dataset.resizing).toBe('true');

    await rerender({ size: 50, ...changedProps, onsizechange });
    expect(root.hasAttribute('data-resizing')).toBe(false);
    expect(handle.releasePointerCapture).toHaveBeenCalledWith(1);
    await fireEvent.pointerMove(handle, { pointerId: 1, clientX: 20 });
    expect(handle.getAttribute('aria-valuenow')).toBe('50');
    expect(onsizechange).not.toHaveBeenCalled();

    await rerender({ size: 50, disabled: false, orientation: 'horizontal', onsizechange });
    await fireEvent.pointerMove(handle, { pointerId: 1, clientX: 30 });
    expect(handle.getAttribute('aria-valuenow')).toBe('50');
    expect(onsizechange).not.toHaveBeenCalled();
  });
});
