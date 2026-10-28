import { get } from 'svelte/store';
import { expect, test, vi } from 'vitest';
import { toast, toasts } from '../src/components/aesir-toast/toast-store.js';

test('updates default lifetimes without resetting explicit timers or ordinary content edits', async () => {
  vi.useFakeTimers();
  try {
    const error = toast.info('Working');
    const action = toast.info('Done');
    const explicit = toast.info('Timed', undefined, { duration: 1000 });
    const ordinary = toast.info('Ordinary');
    await vi.advanceTimersByTimeAsync(500);
    toast.update(error, { variant: 'destructive' });
    toast.update(action, { action: { label: 'Undo' } });
    toast.update(explicit, { variant: 'destructive' });
    toast.update(ordinary, { title: 'Updated' });
    await vi.advanceTimersByTimeAsync(3720);
    expect(get(toasts).map((item) => item.id)).toEqual([error, action]);
    toast.update(error, { variant: 'success' });
    toast.update(action, { action: undefined });
    await vi.runAllTimersAsync();
    expect(get(toasts)).toEqual([]);
  } finally {
    vi.useRealTimers();
  }
});

test('errors and actionable notifications persist unless duration is explicit', async () => {
  vi.useFakeTimers();
  try {
    const error = toast.error('Failed');
    const action = toast.success('Deleted', undefined, { action: { label: 'Undo' } });
    toast.info('Saved');
    toast.error('Temporary', undefined, { duration: 500 });
    await vi.runAllTimersAsync();
    expect(get(toasts).map((item) => item.id)).toEqual([error, action]);
    toast.dismiss(error);
    toast.dismiss(action);
    await vi.runAllTimersAsync();
  } finally {
    vi.useRealTimers();
  }
});

test('a notification with no visible action label uses the normal lifetime', async () => {
  vi.useFakeTimers();
  try {
    const initial = toast.info('Saved', undefined, { action: { label: '' } });
    const updated = toast.info('Updated', undefined, { action: { label: 'Undo' } });
    toast.update(updated, { action: { label: '' } });

    await vi.advanceTimersByTimeAsync(4220);

    const remainingIds = get(toasts).map((item) => item.id);
    expect(remainingIds).not.toContain(initial);
    expect(remainingIds).not.toContain(updated);
  } finally {
    for (const item of get(toasts)) toast.dismiss(item.id);
    await vi.runAllTimersAsync();
    vi.useRealTimers();
  }
});

test('promise failures persist by default', async () => {
  vi.useFakeTimers();
  try {
    await expect(toast.promise(Promise.reject(new Error('failed')))).rejects.toThrow('failed');
    await vi.runAllTimersAsync();
    expect(get(toasts)[0]?.variant).toBe('destructive');
    for (const item of get(toasts)) toast.dismiss(item.id);
    await vi.runAllTimersAsync();
  } finally {
    vi.useRealTimers();
  }
});

test('promise result clears loading-only content and uses the result lifetime', async () => {
  vi.useFakeTimers();
  try {
    const task = toast.promise(Promise.resolve('saved'), {
      loading: { title: 'Saving', description: 'Please wait', action: { label: 'Cancel' } },
      success: 'Saved'
    });
    const id = get(toasts)[0].id;
    await task;
    expect(get(toasts)).toEqual([expect.objectContaining({ id, title: 'Saved', description: undefined, action: undefined, variant: 'success', state: 'open' })]);
    await vi.advanceTimersByTimeAsync(4220);
    expect(get(toasts)).toEqual([]);
  } finally {
    for (const item of get(toasts)) toast.dismiss(item.id);
    await vi.runAllTimersAsync();
    vi.useRealTimers();
  }
});

test('a completed promise can reopen a closing toast without the old exit timer deleting it', async () => {
  vi.useFakeTimers();
  try {
    let complete;
    const task = toast.promise(new Promise((resolve) => (complete = resolve)));
    const id = get(toasts)[0].id;
    toast.dismiss(id);
    complete('done');
    await task;
    await vi.advanceTimersByTimeAsync(220);
    expect(get(toasts)).toEqual([expect.objectContaining({ id, state: 'open', variant: 'success' })]);
    await vi.runAllTimersAsync();
    expect(get(toasts)).toEqual([]);
    toast.update(id, { duration: 1000 });
    toast.dismiss(id);
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    vi.useRealTimers();
  }
});
