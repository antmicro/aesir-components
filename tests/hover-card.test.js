import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { expect, test, vi } from 'vitest';
import HoverCardDynamicFixture from './fixtures/hover-card-dynamic-fixture.svelte';

test('pointer activation closes immediately and does not open again from pointer focus or a pending timer', async () => {
  render(HoverCardDynamicFixture);
  const trigger = screen.getByRole('button', { name: 'Preview item' });
  expect(screen.getByRole('group', { name: 'Preview' })).toBeTruthy();
  await fireEvent.pointerDown(trigger);
  expect(screen.queryByRole('group', { name: 'Preview' })).toBeNull();

  vi.useFakeTimers();
  try {
    trigger.focus();
    await vi.advanceTimersByTimeAsync(100);
    await tick();
    expect(screen.queryByRole('group', { name: 'Preview' })).toBeNull();
    await fireEvent.click(trigger);
    await vi.advanceTimersByTimeAsync(500);
    expect(screen.queryByRole('group', { name: 'Preview' })).toBeNull();
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);

    // A later keyboard focus must still offer the accessible preview.
    trigger.blur();
    await tick();
    trigger.focus();
    await vi.advanceTimersByTimeAsync(1);
    await tick();
    expect(screen.getByRole('group', { name: 'Preview' })).toBeTruthy();
  } finally {
    vi.useRealTimers();
  }
});

test('click activation cancels a preview opening queued by focus', async () => {
  render(HoverCardDynamicFixture);
  await fireEvent.click(screen.getByRole('button', { name: 'Disable preview' }));
  await fireEvent.click(screen.getByRole('button', { name: 'Enable preview' }));
  const trigger = screen.getByRole('button', { name: 'Preview item' });
  vi.useFakeTimers();
  try {
    trigger.focus();
    await fireEvent.click(trigger);
    await vi.advanceTimersByTimeAsync(100);
    await tick();
    expect(screen.queryByRole('group', { name: 'Preview' })).toBeNull();
  } finally {
    vi.useRealTimers();
  }
});

test('restores keyboard previews after a pointer click that did not focus the trigger', async () => {
  render(HoverCardDynamicFixture);
  const trigger = screen.getByRole('button', { name: 'Preview item' });
  await fireEvent.pointerDown(trigger);
  await fireEvent.click(trigger);
  expect(document.activeElement).not.toBe(trigger);
  vi.useFakeTimers();
  try {
    await fireEvent.keyDown(document.body, { key: 'Tab' });
    trigger.focus();
    await vi.advanceTimersByTimeAsync(1);
    await tick();
    expect(screen.getByRole('group', { name: 'Preview' })).toBeTruthy();
  } finally {
    vi.useRealTimers();
  }
});

test('does not reopen a disabled hover card when it becomes enabled again', async () => {
  render(HoverCardDynamicFixture);

  expect(screen.getByRole('group', { name: 'Preview' })).toBeTruthy();
  await fireEvent.click(screen.getByRole('button', { name: 'Disable preview' }));
  expect(screen.queryByRole('group', { name: 'Preview' })).toBeNull();
  expect(screen.getByRole('status', { name: 'Preview state' }).textContent).toBe('closed');

  await fireEvent.click(screen.getByRole('button', { name: 'Enable preview' }));
  expect(screen.queryByRole('group', { name: 'Preview' })).toBeNull();
});

test('does not retain an external open request while disabled', async () => {
  render(HoverCardDynamicFixture);

  await fireEvent.click(screen.getByRole('button', { name: 'Disable preview' }));
  await fireEvent.click(screen.getByRole('button', { name: 'Open preview externally' }));
  expect(screen.getByRole('status', { name: 'Preview state' }).textContent).toBe('closed');
  expect(screen.queryByRole('group', { name: 'Preview' })).toBeNull();

  await fireEvent.click(screen.getByRole('button', { name: 'Enable preview' }));
  expect(screen.queryByRole('group', { name: 'Preview' })).toBeNull();
});

test('closes an open hover card when a modal dialog opens', async () => {
  render(HoverCardDynamicFixture);

  expect(screen.getByRole('group', { name: 'Preview' })).toBeTruthy();
  await fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));

  expect(screen.getByRole('dialog', { name: 'Modal dialog' })).toBeTruthy();
  expect(screen.queryByRole('group', { name: 'Preview' })).toBeNull();
  expect(screen.getByRole('status', { name: 'Preview state' }).textContent).toBe('closed');
});

test('does not open a hover card behind an active modal dialog', async () => {
  render(HoverCardDynamicFixture);

  await fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
  await fireEvent.click(screen.getByRole('button', { name: 'Open preview externally' }));

  expect(screen.getByRole('dialog', { name: 'Modal dialog' })).toBeTruthy();
  expect(screen.queryByRole('group', { name: 'Preview' })).toBeNull();
  expect(screen.getByRole('status', { name: 'Preview state' }).textContent).toBe('closed');
});

test('ignores touch pointer entry on devices that also have a fine hover pointer', async () => {
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = vi.fn().mockImplementation((query) => ({ matches: query === '(hover: hover) and (pointer: fine)' }));

  try {
    render(HoverCardDynamicFixture);
    await fireEvent.click(screen.getByRole('button', { name: 'Disable preview' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Enable preview' }));

    vi.useFakeTimers();
    await fireEvent.pointerEnter(screen.getByRole('button', { name: 'Preview item' }), { pointerType: 'touch' });
    await vi.advanceTimersByTimeAsync(1);
    await tick();

    expect(screen.queryByRole('group', { name: 'Preview' })).toBeNull();
    expect(screen.getByRole('status', { name: 'Preview state' }).textContent).toBe('closed');

    await fireEvent.pointerEnter(screen.getByRole('button', { name: 'Preview item' }), { pointerType: 'mouse' });
    await vi.advanceTimersByTimeAsync(1);
    await tick();
    expect(screen.getByRole('group', { name: 'Preview' })).toBeTruthy();
  } finally {
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
  }
});
