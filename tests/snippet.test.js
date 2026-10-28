import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { AesirSnippet } from '../src/components/aesir-snippet/index.js';

test('copies only the snippet value and keeps the action visible beside overflow', async () => {
  const user = userEvent.setup();
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  render(AesirSnippet, { text: 'npm install @aesir/svelte', prompt: true, label: 'Copy install command' });

  const snippet = screen.getByRole('region', { name: 'Snippet value' });
  const button = screen.getByRole('button', { name: 'Copy install command' });
  expect(snippet.textContent).toContain('$');
  expect(snippet.textContent).toContain('npm install @aesir/svelte');
  expect(button.parentElement).toBe(snippet.parentElement);

  await user.click(button);
  expect(writeText).toHaveBeenCalledWith('npm install @aesir/svelte');
  expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy();
});

test('clears copy feedback when the snippet value changes', async () => {
  const user = userEvent.setup();
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const { rerender } = render(AesirSnippet, { text: 'first command' });

  await user.click(screen.getByRole('button', { name: 'Copy snippet' }));
  expect(writeText).toHaveBeenCalledWith('first command');
  expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy();

  await rerender({ text: 'second command' });
  expect(screen.getByRole('region', { name: 'Snippet value' }).textContent.trim()).toBe('second command');
  expect(screen.getByRole('button', { name: 'Copy snippet' })).toBeTruthy();
  expect(screen.queryByText('Copied')).toBeNull();

  await user.click(screen.getByRole('button', { name: 'Copy snippet' }));
  expect(writeText).toHaveBeenLastCalledWith('second command');
  expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy();
});
