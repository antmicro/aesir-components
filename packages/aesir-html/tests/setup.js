import { afterEach } from 'vitest';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverMock;

window.matchMedia ??= (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent() {
    return true;
  }
});

afterEach(() => {
  document.body.replaceChildren();
  document.head.querySelectorAll('[id$="-host-styles"]').forEach((style) => style.remove());
  document.documentElement.classList.remove('aesir-html-ready');
});

export async function settleCustomElement(element) {
  document.body.append(element);
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  return element;
}
