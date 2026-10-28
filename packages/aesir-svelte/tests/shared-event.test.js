import { describe, expect, it, vi } from 'vitest';
import { listenShared } from '../src/utils/shared-event.js';

describe('listenShared', () => {
  it('uses one native listener for multiple subscribers and releases it after the last one', () => {
    const target = new EventTarget();
    const add = vi.spyOn(target, 'addEventListener');
    const remove = vi.spyOn(target, 'removeEventListener');
    const first = vi.fn();
    const second = vi.fn();

    const releaseFirst = listenShared(target, 'change', first);
    const releaseSecond = listenShared(target, 'change', second);

    expect(add).toHaveBeenCalledTimes(1);
    target.dispatchEvent(new Event('change'));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    releaseFirst();
    expect(remove).not.toHaveBeenCalled();
    releaseSecond();
    expect(remove).toHaveBeenCalledTimes(1);
    releaseSecond();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('keeps capture and bubble listeners in separate registries', () => {
    const target = new EventTarget();
    const add = vi.spyOn(target, 'addEventListener');

    const releaseBubble = listenShared(target, 'keydown', vi.fn());
    const releaseCapture = listenShared(target, 'keydown', vi.fn(), true);

    expect(add).toHaveBeenCalledTimes(2);
    releaseBubble();
    releaseCapture();
  });
});
