// @vitest-environment node
import { get } from 'svelte/store';
import { expect, test, vi } from 'vitest';
import { toast, toasts } from '../src/components/aesir-toast/toast-store.js';

test('never retains notifications or timers across SSR requests', async () => {
  vi.useFakeTimers();
  try {
    const id = toast.success('Private request data');
    toast.update(id, { title: 'Other request', duration: 1000 });
    toast.dismiss(id);
    expect(await toast.promise(Promise.resolve('result'))).toBe('result');
    await expect(
      toast.promise(() => {
        throw new Error('failed');
      })
    ).rejects.toThrow('failed');
    expect(get(toasts)).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    vi.useRealTimers();
  }
});
