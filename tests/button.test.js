import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import ButtonFixture from './fixtures/button-fixture.svelte';
import AesirButton from '../src/components/aesir-button/aesir-button.svelte';

describe('AesirButton', () => {
  test('renders an explicitly empty href as a link and follows later href changes', async () => {
    const { container, rerender } = render(AesirButton, { href: '', 'aria-label': 'Current page' });
    const link = container.querySelector('a');
    expect(link.getAttribute('href')).toBe('');

    await rerender({ href: undefined, 'aria-label': 'Current page' });
    expect(screen.getByRole('button', { name: 'Current page' })).toBeTruthy();

    await rerender({ href: '', 'aria-label': 'Current page' });
    expect(container.querySelector('a').getAttribute('href')).toBe('');
  });

  test('keeps disabled links inert even when forwarded attributes conflict', () => {
    const onclick = vi.fn();
    render(AesirButton, { href: '/settings', disabled: true, tabindex: 0, 'aria-disabled': 'false', 'data-disabled': false, 'aria-label': 'Settings', onclick });
    const link = screen.getByRole('link', { name: 'Settings' });

    expect(link.getAttribute('tabindex')).toBe('-1');
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.dataset.disabled).toBe('true');
    expect(link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))).toBe(false);
    expect(onclick).not.toHaveBeenCalled();
  });

  test('preserves native button and disabled-link semantics', async () => {
    const user = userEvent.setup();
    render(ButtonFixture);

    const button = screen.getByRole('button', { name: 'Save' });
    const disabledButton = screen.getByRole('button', { name: 'Disabled' });
    const disabledLink = screen.getByRole('link', { name: 'Disabled link' });
    const activations = screen.getByRole('status', { name: 'Activations' });

    expect(button.getAttribute('type')).toBe('button');
    expect(disabledButton.hasAttribute('disabled')).toBe(true);
    expect(disabledButton.dataset.disabled).toBe('true');
    expect(disabledLink.getAttribute('aria-disabled')).toBe('true');
    expect(disabledLink.dataset.disabled).toBe('true');
    expect(disabledLink.getAttribute('tabindex')).toBe('-1');

    await user.click(button);
    await user.click(disabledButton);
    await user.click(disabledLink);

    expect(activations.textContent).toBe('1');
  });

  test('does not invoke consumer handlers for synthetic clicks on disabled controls', async () => {
    render(ButtonFixture);
    const disabledButton = screen.getByRole('button', { name: 'Disabled' });
    const disabledLink = screen.getByRole('link', { name: 'Disabled link' });
    const activations = screen.getByRole('status', { name: 'Activations' });

    disabledButton.click();
    await fireEvent.click(disabledLink);

    expect(activations.textContent).toBe('0');
  });

  test('prevents disabled links from navigating', async () => {
    render(ButtonFixture);
    const disabledLink = screen.getByRole('link', { name: 'Disabled link' });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    const dispatched = disabledLink.dispatchEvent(event);

    expect(dispatched).toBe(false);
    expect(event.defaultPrevented).toBe(true);
  });

  test('keeps disabled links out of sequential keyboard navigation', async () => {
    const user = userEvent.setup();
    render(ButtonFixture);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save' }));
    await user.tab();

    expect(document.activeElement).not.toBe(screen.getByRole('link', { name: 'Disabled link' }));
  });
});
