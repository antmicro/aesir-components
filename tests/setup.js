import { vi } from 'vitest';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock;
globalThis.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn()
}));

globalThis.requestAnimationFrame = (callback) => setTimeout(() => callback(performance.now()), 0);
globalThis.cancelAnimationFrame = (handle) => clearTimeout(handle);

if (typeof HTMLElement !== 'undefined') {
  HTMLElement.prototype.getBoundingClientRect = () => new DOMRect(0, 0, 160, 40);
  HTMLElement.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.getAnimations = vi.fn(() => []);
  HTMLElement.prototype.animate = vi.fn(() => {
    const animation = {
      currentTime: 0,
      playState: 'running',
      onfinish: null,
      cancel: vi.fn(),
      finish: vi.fn(),
      pause: vi.fn(),
      play: vi.fn(),
      reverse: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      finished: Promise.resolve()
    };
    setTimeout(() => {
      animation.playState = 'finished';
      animation.onfinish?.();
    }, 0);
    return animation;
  });
  Object.defineProperties(HTMLElement.prototype, {
    offsetWidth: { configurable: true, get: () => 160 },
    offsetHeight: { configurable: true, get: () => 40 },
    scrollWidth: { configurable: true, get: () => 160 },
    scrollHeight: { configurable: true, get: () => 40 }
  });
}
