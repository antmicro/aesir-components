import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import AccordionFocusFixture from './fixtures/accordion-focus-fixture.svelte';

describe('AesirAccordion focus', () => {
  test('moves focus to the trigger when a parent closes the focused panel', async () => {
    const { rerender } = render(AccordionFocusFixture, { value: 'one' });
    const trigger = screen.getByRole('button', { name: 'One' });
    const action = screen.getByRole('button', { name: 'Action in One' });
    const panel = screen.getByRole('region', { name: 'One' });

    action.focus();
    expect(document.activeElement).toBe(action);

    await rerender({ value: undefined });

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(panel.getAttribute('aria-hidden')).toBe('true');
    expect(document.activeElement).toBe(trigger);
  });

  test('moves focus to a remaining trigger when the focused panel is removed', async () => {
    const items = [
      { value: 'one', title: 'One' },
      { value: 'two', title: 'Two' }
    ];
    const { rerender } = render(AccordionFocusFixture, { items, value: 'one' });
    const action = screen.getByRole('button', { name: 'Action in One' });
    action.focus();

    await rerender({ items: [items[1]], value: 'one' });

    const remainingTrigger = screen.getByRole('button', { name: 'Two' });
    expect(remainingTrigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(remainingTrigger);
  });
});
