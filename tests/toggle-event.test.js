import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import Toggle from '../src/components/aesir-toggle/aesir-toggle.svelte';

test('lets a consumer cancel a toggle click before pressed state changes', async () => {
  const user = userEvent.setup();
  const onpressedchange = vi.fn();
  const onclick = vi.fn((event) => event.preventDefault());
  render(Toggle, { 'aria-label': 'Bold', onclick, onpressedchange });
  const toggle = screen.getByRole('button', { name: 'Bold' });

  await user.click(toggle);

  expect(onclick).toHaveBeenCalledOnce();
  expect(toggle.getAttribute('aria-pressed')).toBe('false');
  expect(onpressedchange).not.toHaveBeenCalled();
});

test('keeps owned pressed attributes in sync when extra attributes conflict', async () => {
  const user = userEvent.setup();
  render(Toggle, { 'aria-label': 'Bold', pressed: true, 'aria-pressed': false, 'data-state': 'off' });
  const toggle = screen.getByRole('button', { name: 'Bold' });

  expect(toggle.getAttribute('aria-pressed')).toBe('true');
  expect(toggle.dataset.state).toBe('on');

  await user.click(toggle);
  expect(toggle.getAttribute('aria-pressed')).toBe('false');
  expect(toggle.dataset.state).toBe('off');
});
