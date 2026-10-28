import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, test, vi } from 'vitest';
import ScrollAreaFixture from '../fixtures/scroll-area-fixture.svelte';

describe('scroll area', () => {
  test('renders interactive tracks only for overflowing axes and updates on resize', async () => {
    await render(ScrollAreaFixture);
    const viewport = page.getByRole('region', { name: 'Scrollable grid' });
    await vi.waitFor(() => expect(document.querySelectorAll('[data-slot="scroll-area-scrollbar"]')).toHaveLength(2));
    expect(viewport.element().tabIndex).toBe(0);
    expect(document.querySelectorAll('.custom-track')).toHaveLength(2);
    expect(document.querySelectorAll('.custom-thumb')).toHaveLength(2);
    await page.getByRole('button', { name: 'Toggle content size' }).click();
    await vi.waitFor(() => expect(document.querySelectorAll('[data-slot="scroll-area-scrollbar"]')).toHaveLength(0));
  });

  test('updates the thumb with native scrolling and supports track clicks', async () => {
    await render(ScrollAreaFixture);
    const viewport = page.getByRole('region', { name: 'Scrollable grid' }).element();
    const verticalTrack = document.querySelector('[data-slot="scroll-area-scrollbar"][data-orientation="vertical"]');
    const thumb = verticalTrack.querySelector('[data-slot="scroll-area-thumb"]');
    viewport.scrollTop = 100;
    await vi.waitFor(() => expect(thumb.style.transform).not.toBe('translateY(0px)'));
    verticalTrack.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientY: verticalTrack.getBoundingClientRect().bottom - 2 }));
    expect(viewport.scrollTop).toBeGreaterThan(100);
  });

  test('keeps two-axis tracks outside the corner and lets end clicks reach the scroll limits', async () => {
    await render(ScrollAreaFixture);
    const viewport = page.getByRole('region', { name: 'Scrollable grid' }).element();
    const area = viewport.closest('[data-slot="scroll-area"]');
    const verticalTrack = area.querySelector('[data-slot="scroll-area-scrollbar"][data-orientation="vertical"]');
    const horizontalTrack = area.querySelector('[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]');
    const corner = area.querySelector('[data-slot="scroll-area-corner"]');
    const verticalRect = verticalTrack.getBoundingClientRect();
    const horizontalRect = horizontalTrack.getBoundingClientRect();
    const cornerRect = corner.getBoundingClientRect();

    expect(verticalRect.bottom).toBeCloseTo(cornerRect.top, 1);
    expect(horizontalRect.right).toBeCloseTo(cornerRect.left, 1);

    verticalTrack.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientY: verticalRect.bottom - 1 }));
    expect(viewport.scrollTop).toBeCloseTo(viewport.scrollHeight - viewport.clientHeight, 0);
    horizontalTrack.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: horizontalRect.right - 1 }));
    expect(viewport.scrollLeft).toBeCloseTo(viewport.scrollWidth - viewport.clientWidth, 0);
  });

  test('reveals a hover scrollbar for keyboard focus and keeps native keyboard scrolling', async () => {
    await render(ScrollAreaFixture);
    const viewport = page.getByRole('region', { name: 'Focus scroll area' }).element();
    const area = viewport.closest('[data-slot="scroll-area"]');
    expect(area.querySelector('[data-slot="scroll-area-scrollbar"]')).toBeNull();
    await vi.waitFor(() => expect(viewport.tabIndex).toBe(0));
    viewport.focus();
    expect(document.activeElement).toBe(viewport);
    await vi.waitFor(() => expect(area.querySelector('[data-slot="scroll-area-scrollbar"]')).not.toBeNull());
    await userEvent.keyboard('{ArrowDown}');
    await vi.waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
    page.getByRole('button', { name: 'Toggle content size' }).element().focus();
    await vi.waitFor(() => expect(area.querySelector('[data-slot="scroll-area-scrollbar"]')).toBeNull());
  });

  test('tracks overflow when a second child is inserted and removed', async () => {
    await render(ScrollAreaFixture);
    const viewport = page.getByRole('region', { name: 'Dynamic children' }).element();
    const area = viewport.closest('[data-slot="scroll-area"]');
    expect(area.querySelector('[data-slot="scroll-area-scrollbar"]')).toBeNull();
    expect(viewport.tabIndex).toBe(-1);

    await page.getByRole('button', { name: 'Toggle second child' }).click();
    await vi.waitFor(() => expect(area.querySelector('[data-slot="scroll-area-scrollbar"]')).not.toBeNull());
    expect(viewport.tabIndex).toBe(0);
    await page.getByRole('button', { name: 'Toggle second child' }).click();
    await vi.waitFor(() => expect(area.querySelector('[data-slot="scroll-area-scrollbar"]')).toBeNull());
    expect(viewport.tabIndex).toBe(-1);
  });

  test('tracks overflow when a nested child resizes inside a fixed-size wrapper', async () => {
    await render(ScrollAreaFixture);
    const viewport = page.getByRole('region', { name: 'Nested dynamic content' }).element();
    const area = viewport.closest('[data-slot="scroll-area"]');
    expect(viewport.scrollHeight).toBeLessThanOrEqual(viewport.clientHeight);
    expect(area.querySelector('[data-slot="scroll-area-scrollbar"]')).toBeNull();

    await page.getByRole('button', { name: 'Toggle nested content size' }).click();
    await vi.waitFor(() => expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight));
    await vi.waitFor(() => expect(area.querySelector('[data-slot="scroll-area-scrollbar"]')).not.toBeNull());
    expect(viewport.tabIndex).toBe(0);

    await page.getByRole('button', { name: 'Toggle nested content size' }).click();
    await vi.waitFor(() => expect(area.querySelector('[data-slot="scroll-area-scrollbar"]')).toBeNull());
    expect(viewport.tabIndex).toBe(-1);
  });
});
