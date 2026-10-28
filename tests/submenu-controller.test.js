import { expect, test, vi } from 'vitest';
import { SubmenuController } from '../src/components/aesir-dropdown/submenu-controller.svelte.js';

test('switching branches cancels delayed work belonging to their descendants', () => {
  vi.useFakeTimers();
  const submenu = new SubmenuController(() => undefined);
  try {
    submenu.openImmediately(0, 'old');
    submenu.openImmediately(1, 'child');
    submenu.openFromPointer({ clientX: 0, clientY: 0 }, 1, 'pending-child');
    submenu.openImmediately(0, 'new');
    vi.runAllTimers();
    expect([...submenu.openPath]).toEqual(['new']);
  } finally {
    submenu.destroy();
    vi.useRealTimers();
  }
});
