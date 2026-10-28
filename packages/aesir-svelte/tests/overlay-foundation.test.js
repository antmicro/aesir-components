import { fireEvent, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  canShowTooltip,
  getAnchoredPosition,
  getFloatingOverlayZIndex,
  lockDocumentOverlay,
  registerDismissableOverlay,
  registerExclusiveOverlay,
  registerModalOverlay,
  trapFocus
} from '../src/components/overlay/overlay.js';

const releases = [];

afterEach(() => {
  while (releases.length) releases.pop()();
  document.body.replaceChildren();
});

describe('overlay layer registry', () => {
  test('allows a nested floating panel while keeping the menu background blocked', async () => {
    const menu = document.createElement('div');
    const popover = document.createElement('div');
    const outside = document.createElement('button');
    const insideClick = vi.fn();
    const outsideClick = vi.fn();
    popover.addEventListener('click', insideClick);
    outside.addEventListener('click', outsideClick);
    document.body.append(menu, popover, outside);
    releases.push(registerDismissableOverlay(document, { branches: () => [menu], modal: true, onDismiss: vi.fn() }));
    releases.push(registerDismissableOverlay(document, { branches: () => [popover], onDismiss: vi.fn() }));
    await fireEvent.click(popover);
    expect(insideClick).toHaveBeenCalledOnce();
    await fireEvent.click(outside);
    expect(outsideClick).not.toHaveBeenCalled();
  });
  test('blocks hover and secondary menus behind a modal menu, restores its parent layer, and consumes the dismissal gesture', async () => {
    const dialog = document.createElement('div');
    const menu = document.createElement('div');
    const item = document.createElement('button');
    const outside = document.createElement('button');
    menu.append(item);
    menu.style.zIndex = '121';
    document.body.append(dialog, menu, outside);
    const hover = vi.fn();
    const context = vi.fn();
    const click = vi.fn();
    outside.addEventListener('pointerenter', hover);
    outside.addEventListener('contextmenu', context);
    outside.addEventListener('click', click);
    const parent = registerModalOverlay(document, { branches: () => [dialog] });
    releases.push(parent);
    const release = registerDismissableOverlay(document, { branches: () => [menu], modal: true, onDismiss: () => release() });
    releases.push(release);
    expect(document.querySelector('[data-aesir-menu-backdrop]').style.zIndex).toBe('calc(120)');
    expect(canShowTooltip(item)).toBe(true);
    expect(canShowTooltip(dialog)).toBe(false);
    await fireEvent.pointerEnter(outside);
    await fireEvent.contextMenu(outside);
    expect(hover).not.toHaveBeenCalled();
    expect(context).not.toHaveBeenCalled();
    await fireEvent.pointerDown(outside, { button: 0 });
    await fireEvent.click(outside);
    expect(click).not.toHaveBeenCalled();
    expect(document.querySelector('[data-aesir-menu-backdrop]')).toBeNull();
    expect(canShowTooltip(dialog)).toBe(true);
    expect(document.documentElement.style.overflow).toBe('hidden');
    parent();
    expect(document.documentElement.style.overflow).toBe('');
    await fireEvent.click(outside);
    expect(click).toHaveBeenCalledOnce();
  });
  test('raises a floating panel above its owning modal backdrop, respecting custom stacking levels', () => {
    const backdrop = document.createElement('div');
    backdrop.style.zIndex = '120';
    const dialog = document.createElement('div');
    const anchor = document.createElement('button');
    dialog.append(anchor);
    backdrop.append(dialog);
    document.body.append(backdrop);
    const release = registerModalOverlay(document, { branches: () => [dialog] });
    releases.push(release);
    expect(getFloatingOverlayZIndex(anchor)).toBe(121);
    expect(getFloatingOverlayZIndex(document.body)).toBeUndefined();
    release();
    expect(getFloatingOverlayZIndex(anchor)).toBeUndefined();
  });

  test('retains a higher configured popover layer and uses the dialog token fallback', () => {
    const dialog = document.createElement('div');
    dialog.style.setProperty('--aesir-overlay-z-dialog', '200');
    dialog.style.setProperty('--aesir-overlay-z-popover', '300');
    document.body.append(dialog);
    releases.push(registerModalOverlay(document, { branches: () => [dialog] }));
    expect(getFloatingOverlayZIndex(dialog)).toBe(300);
    dialog.style.removeProperty('--aesir-overlay-z-popover');
    expect(getFloatingOverlayZIndex(dialog)).toBe(201);
  });

  test('replaces only the previous overlay in the same exclusive group', () => {
    const closeFirst = vi.fn();
    const closeSecond = vi.fn();
    const closePopover = vi.fn();
    const releaseFirst = registerExclusiveOverlay(document, 'context-menu', closeFirst);
    releases.push(releaseFirst);

    const releasePopover = registerExclusiveOverlay(document, 'popover', closePopover);
    releases.push(releasePopover);
    expect(closeFirst).not.toHaveBeenCalled();

    const releaseSecond = registerExclusiveOverlay(document, 'context-menu', closeSecond);
    releases.push(releaseSecond);
    expect(closeFirst).toHaveBeenCalledOnce();
    expect(closePopover).not.toHaveBeenCalled();

    releaseFirst();
    const releaseThird = registerExclusiveOverlay(document, 'context-menu', vi.fn());
    releases.push(releaseThird);
    expect(closeSecond).toHaveBeenCalledOnce();
  });

  test('allows tooltip triggers only within the topmost modal', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    const trigger = document.createElement('button');
    inner.append(trigger);
    outer.append(inner);
    document.body.append(outer);
    releases.push(registerModalOverlay(document, { branches: () => [outer] }));
    expect(canShowTooltip(trigger)).toBe(true);
    expect(canShowTooltip(document.body)).toBe(false);
    const releaseInner = registerModalOverlay(document, { branches: () => [inner] });
    releases.push(releaseInner);
    expect(canShowTooltip(outer)).toBe(false);
    expect(canShowTooltip(trigger)).toBe(true);
    releaseInner();
    expect(canShowTooltip(outer)).toBe(true);
  });

  test('reference-counts document scroll locks and restores the previous inline value', () => {
    document.documentElement.style.overflow = 'clip';
    const releaseFirst = lockDocumentOverlay(document);
    const releaseSecond = lockDocumentOverlay(document);

    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.documentElement.dataset.overlayOpen).toBe('true');
    releaseFirst();
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.documentElement.dataset.overlayOpen).toBe('true');
    releaseSecond();

    expect(document.documentElement.style.overflow).toBe('clip');
    expect(document.documentElement.dataset.overlayOpen).toBeUndefined();
    document.documentElement.style.overflow = '';
  });

  test('makes overlay release functions idempotent', () => {
    const release = lockDocumentOverlay(document);

    release();
    release();

    expect(document.documentElement.dataset.overlayOpen).toBeUndefined();
    expect(document.documentElement.style.overflow).toBe('');
  });

  test('traps focus around visible, enabled tab stops rather than hidden or programmatic targets', async () => {
    const dialog = document.createElement('div');
    dialog.tabIndex = -1;
    dialog.innerHTML =
      '<div hidden><button>Hidden ancestor</button></div><button tabindex="-1">Programmatic</button><fieldset disabled><button>Disabled</button></fieldset><div style="display:none"><button>CSS hidden</button></div><button id="first">First</button><button id="last">Last</button><div inert><button>Inert</button></div>';
    document.body.append(dialog);
    const trap = trapFocus(dialog);
    releases.push(() => trap.destroy());
    await waitFor(() => expect(document.activeElement.id).toBe('first'));
    await fireEvent.keyDown(document.activeElement, { key: 'Tab', shiftKey: true });
    expect(document.activeElement.id).toBe('last');
    await fireEvent.keyDown(document.activeElement, { key: 'Tab' });
    expect(document.activeElement.id).toBe('first');
    dialog.focus();
    await fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement.id).toBe('last');
  });

  test('applies the requested height limit without exceeding the available space', () => {
    const anchor = document.createElement('button');
    const overlay = document.createElement('div');
    document.body.append(anchor, overlay);
    anchor.getBoundingClientRect = () => new DOMRect(20, 20, 100, 40);
    expect(getAnchoredPosition(anchor, overlay, { maxHeight: 120 }).style).toContain('max-height:120px;');

    anchor.getBoundingClientRect = () => new DOMRect(20, 0, 100, window.innerHeight - 40);
    expect(getAnchoredPosition(anchor, overlay, { maxHeight: 120 }).style).toContain('max-height:24px;');
  });

  test.each([
    { boxSizing: 'border-box', width: 61.25 },
    { boxSizing: 'content-box', width: 43.25 }
  ])('rounds the untransformed $boxSizing width up instead of clipping a fractional glyph', ({ boxSizing, width }) => {
    const anchor = document.createElement('button');
    const overlay = document.createElement('div');
    overlay.style.cssText = `box-sizing:${boxSizing};width:${width}px;padding:6px 8px;border:1px solid;transform:scale(0.97)`;
    Object.defineProperties(overlay, {
      offsetWidth: { value: 61 },
      scrollWidth: { value: 61 }
    });
    document.body.append(anchor, overlay);

    expect(getAnchoredPosition(anchor, overlay).style).toContain('width:62px;');
    expect(getAnchoredPosition(anchor, overlay, { width: 80 }).style).toContain('width:80px;');
  });

  test('dismisses only the topmost layer with Escape', async () => {
    const dismissPopover = vi.fn();
    const dismissDialog = vi.fn();
    const branch = document.createElement('div');
    document.body.append(branch);

    releases.push(registerDismissableOverlay(document, { branches: () => [branch], onDismiss: dismissPopover }));
    const releaseDialog = registerModalOverlay(document, dismissDialog);
    releases.push(releaseDialog);

    await fireEvent.keyDown(document, { key: 'Escape' });
    expect(dismissDialog).toHaveBeenCalledOnce();
    expect(dismissPopover).not.toHaveBeenCalled();

    releaseDialog();
    await fireEvent.keyDown(document, { key: 'Escape' });
    expect(dismissPopover).toHaveBeenCalledWith('escape', expect.any(KeyboardEvent));
  });

  test('replaces a floating overlay without relying on an outside pointer event', () => {
    const closeFirst = vi.fn();
    const closeSecond = vi.fn();
    const first = document.createElement('div');
    const second = document.createElement('div');
    document.body.append(first, second);

    releases.push(registerDismissableOverlay(document, { branches: () => [first], onDismiss: closeFirst, exclusive: true }));
    releases.push(registerDismissableOverlay(document, { branches: () => [second], onDismiss: closeSecond, exclusive: true }));

    expect(closeFirst).toHaveBeenCalledWith('exclusive');
    expect(closeSecond).not.toHaveBeenCalled();
  });

  test('ignores pointer presses in registered branches and dismisses outside', async () => {
    const dismiss = vi.fn();
    const branch = document.createElement('div');
    const child = document.createElement('button');
    branch.append(child);
    document.body.append(branch);
    releases.push(registerDismissableOverlay(document, { branches: () => [branch], onDismiss: dismiss }));

    await fireEvent.pointerDown(child);
    expect(dismiss).not.toHaveBeenCalled();

    await fireEvent.pointerDown(document.body);
    expect(dismiss).toHaveBeenCalledWith('pointerdown', expect.any(Event));
  });

  test('ignores non-primary outside pointer presses', async () => {
    const dismiss = vi.fn();
    const branch = document.createElement('div');
    document.body.append(branch);
    releases.push(registerDismissableOverlay(document, { branches: () => [branch], onDismiss: dismiss }));

    await fireEvent.pointerDown(document.body, { button: 2 });

    expect(dismiss).not.toHaveBeenCalled();
  });

  test('flips horizontal overlays and keeps their origin on the anchor side', () => {
    const anchor = document.createElement('button');
    const overlay = document.createElement('div');
    anchor.getBoundingClientRect = () => new DOMRect(900, 100, 100, 40);
    Object.defineProperties(overlay, {
      offsetWidth: { configurable: true, value: 160 },
      scrollWidth: { configurable: true, value: 160 },
      offsetHeight: { configurable: true, value: 80 },
      scrollHeight: { configurable: true, value: 80 }
    });
    document.body.append(anchor, overlay);

    const position = getAnchoredPosition(anchor, overlay, { placement: 'right', align: 'center' });

    expect(position.placement).toBe('left');
    expect(position.left).toBe(732);
    expect(position.top).toBe(80);
    expect(position.originX).toBe(160);
    expect(position.originY).toBe(40);
  });
});
