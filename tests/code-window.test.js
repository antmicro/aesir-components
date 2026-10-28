import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { afterEach, expect, test, vi } from 'vitest';
import { AesirCodeWindow } from '../src/components/aesir-code-window/index.js';

afterEach(() => vi.useRealTimers());

test('reports the copied snapshot, not source changed while the clipboard is pending', async () => {
  userEvent.setup();
  let complete;
  vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(() => new Promise((resolve) => (complete = resolve)));
  const oncopied = vi.fn();
  const { rerender } = render(AesirCodeWindow, { code: 'before', oncopied });
  await fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
  await rerender({ code: 'after', oncopied });
  complete();
  await waitFor(() => expect(oncopied).toHaveBeenCalledWith('before'));
});

test('does not label a changed source as copied', async () => {
  vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const { rerender } = render(AesirCodeWindow, { code: 'before' });
  await fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy());

  await rerender({ code: 'after' });
  expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
  expect(screen.queryByText('Copied')).toBeNull();
});

test('ignores stale clipboard completions and cleans up feedback timers', async () => {
  userEvent.setup();
  vi.useFakeTimers();
  const completions = [];
  vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(() => new Promise((resolve) => completions.push(resolve)));
  const oncopied = vi.fn();
  const oncopyerror = vi.fn();
  const { unmount } = render(AesirCodeWindow, { code: 'source', oncopied, oncopyerror });
  const button = screen.getByRole('button', { name: 'Copy code' });
  await fireEvent.click(button);
  await fireEvent.click(button);
  completions[1]();
  await vi.advanceTimersByTimeAsync(0);
  expect(oncopied).toHaveBeenCalledTimes(1);
  completions[0]();
  await vi.advanceTimersByTimeAsync(0);
  expect(oncopied).toHaveBeenCalledTimes(1);
  expect(oncopyerror).not.toHaveBeenCalled();
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

test('does not publish copy feedback after unmount', async () => {
  userEvent.setup();
  let complete;
  vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(() => new Promise((resolve) => (complete = resolve)));
  const oncopied = vi.fn();
  const oncopyerror = vi.fn();
  const { unmount } = render(AesirCodeWindow, { code: 'source', oncopied, oncopyerror });
  await fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
  unmount();
  complete();
  await Promise.resolve();
  await Promise.resolve();
  expect(oncopied).not.toHaveBeenCalled();
  expect(oncopyerror).not.toHaveBeenCalled();
});

test('keeps line treatments separate from the copied source', async () => {
  const user = userEvent.setup();
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const code = 'before\nafter';
  const { container } = render(AesirCodeWindow, { code, filename: 'example.js', highlightedLinesNumbers: [1], removedLinesNumbers: [1], addedLinesNumbers: [2] });

  expect(container.querySelectorAll('.aesir-code-window__line-number')).toHaveLength(2);
  expect(container.querySelector('[data-removed]')?.textContent).toContain('before');
  expect(container.querySelector('[data-added]')?.textContent).toContain('after');
  await user.click(screen.getByRole('button', { name: 'Copy code' }));
  expect(writeText).toHaveBeenCalledWith(code);
});

test('renders CR, CRLF, and LF as separate lines while copying the original source', async () => {
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const code = 'first\rsecond\r\nthird\nfourth';
  const { container } = render(AesirCodeWindow, { code });

  expect([...container.querySelectorAll('.aesir-code-window__line-content')].map((line) => line.textContent)).toEqual(['first', 'second', 'third', 'fourth']);
  await fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
  expect(writeText).toHaveBeenCalledWith(code);
});

test('uses a filename-free copy action without a toolbar', () => {
  const { container } = render(AesirCodeWindow, { code: 'const ready = true;' });
  expect(container.querySelector('.aesir-code-window__toolbar')).toBeNull();
  expect(container.querySelector('.aesir-code-window__floating-copy')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
});

test('copies raw source while displaying custom highlighted content', async () => {
  const user = userEvent.setup();
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  const children = createRawSnippet(() => ({ render: () => '<pre>Highlighted source</pre>' }));
  const { container } = render(AesirCodeWindow, { code: 'const raw = true;', children });

  expect(container.querySelector('.aesir-code-window__viewport')?.textContent).toContain('Highlighted source');
  expect(container.querySelector('.aesir-code-window__line')).toBeNull();
  expect(container.querySelector('.aesir-code-window__floating-copy')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Copy code' }));
  expect(writeText).toHaveBeenCalledWith('const raw = true;');
});
