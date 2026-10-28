import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { describe, expect, test } from 'vitest';
import CollapsibleDynamicFixture from '../fixtures/collapsible-dynamic-fixture.svelte';

describe('AesirCollapsible dynamic state', () => {
  test('moves focus to the trigger when a focused descendant is collapsed externally', async () => {
    const rendered = await render(CollapsibleDynamicFixture, { open: true });
    const trigger = page.getByRole('button', { name: 'More settings' });
    const action = page.getByRole('button', { name: 'Internal action' });

    action.element().focus();
    expect(document.activeElement).toBe(action.element());

    await rendered.rerender({ open: false });

    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger.element());
  });

  test('keeps the open panel and bottom trigger layout when extra data attributes conflict', async () => {
    await render(CollapsibleDynamicFixture, {
      open: true,
      triggerPosition: 'bottom',
      stateOverride: 'closed',
      positionOverride: 'top'
    });
    const trigger = page.getByRole('button', { name: 'More settings' }).element();
    const content = document.querySelector('.aesir-collapsible__content');
    content.style.transition = 'none';

    expect(content.getBoundingClientRect().height).toBeGreaterThan(0);
    expect(getComputedStyle(trigger).order).toBe('2');
  });

  test('keeps long text visible inside a narrow open panel', async () => {
    await render(CollapsibleDynamicFixture, { open: true, longContent: true });
    const root = document.querySelector('.aesir-collapsible');
    root.style.width = '200px';
    const text = document.querySelector('[data-testid="long-content"]');
    const clip = document.querySelector('.aesir-collapsible__content-clip');

    expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(clip.getBoundingClientRect().right);
  });
});
