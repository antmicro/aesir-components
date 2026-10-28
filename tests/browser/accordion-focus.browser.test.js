import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { describe, expect, test } from 'vitest';
import AccordionFocusFixture from '../fixtures/accordion-focus-fixture.svelte';

describe('accordion focus in a browser', () => {
  test('returns focus to the trigger before a panel becomes inert', async () => {
    const rendered = await render(AccordionFocusFixture, { value: 'one' });
    const trigger = page.getByRole('button', { name: 'One' });
    const action = page.getByRole('button', { name: 'Action in One' });
    action.element().focus();
    await expect.element(action).toHaveFocus();

    await rendered.rerender({ value: undefined });

    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect.element(trigger).toHaveFocus();
  });
});
