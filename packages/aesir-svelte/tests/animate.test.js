import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import Animate from '../src/components/aesir-animate/aesir-animate.svelte';

afterEach(() => vi.unstubAllGlobals());

function mockIntersectionObservers() {
  const observers = [];
  class MockIntersectionObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.observe = vi.fn();
      this.disconnect = vi.fn();
      observers.push(this);
    }
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  return observers;
}

describe('AesirAnimate', () => {
  test('renders the requested element and exposes animation configuration', () => {
    render(Animate, { as: 'section', animation: 'zoom', duration: 300, delay: '50ms', class: 'consumer-animation', 'aria-label': 'Animated region' });
    const region = screen.getByRole('region', { name: 'Animated region' });
    expect(region.tagName).toBe('SECTION');
    expect(region.dataset.animation).toBe('zoom');
    expect(region.classList.contains('consumer-animation')).toBe(true);
    expect(region.getAttribute('style')).toContain('--aesir-animate-duration: 300ms');
  });

  test('observes the new element with current intersection options after props change', async () => {
    const observers = mockIntersectionObservers();

    const { container, rerender } = render(Animate, { as: 'section', threshold: 0.1, rootMargin: '0px' });
    const oldElement = container.querySelector('.aesir-animate');
    expect(observers).toHaveLength(1);
    expect(observers[0].observe).toHaveBeenCalledWith(oldElement);

    await rerender({ as: 'article', threshold: 0.8, rootMargin: '12px' });

    const newElement = container.querySelector('.aesir-animate');
    expect(newElement.tagName).toBe('ARTICLE');
    expect(newElement).not.toBe(oldElement);
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
    expect(observers).toHaveLength(2);
    expect(observers[1].observe).toHaveBeenCalledWith(newElement);
    expect(observers[1].options).toEqual({ threshold: 0.8, rootMargin: '12px' });

    observers[0].callback([{ isIntersecting: true, intersectionRatio: 1 }]);
    await tick();
    expect(newElement.dataset.visible).toBe('false');
  });

  test('reacts to once and threshold changes without leaving an obsolete observer', async () => {
    const observers = mockIntersectionObservers();
    const { container, rerender } = render(Animate, { once: true, threshold: 0.1 });
    const element = container.querySelector('.aesir-animate');

    observers[0].callback([{ isIntersecting: true, intersectionRatio: 1 }]);
    await tick();
    expect(element.dataset.visible).toBe('true');
    expect(observers[0].disconnect).toHaveBeenCalledOnce();

    await rerender({ once: false, threshold: 0.1 });
    expect(observers).toHaveLength(2);
    expect(observers[1].observe).toHaveBeenCalledWith(element);

    observers[1].callback([{ isIntersecting: false, intersectionRatio: 0 }]);
    await tick();
    expect(element.dataset.visible).toBe('false');

    await rerender({ once: false, threshold: 0.7 });
    expect(observers[1].disconnect).toHaveBeenCalledOnce();
    expect(observers[2].options.threshold).toBe(0.7);

    await rerender({ once: true, threshold: 0.7 });
    expect(observers[2].disconnect).toHaveBeenCalledOnce();
    expect(observers[3].observe).toHaveBeenCalledWith(element);
  });

  test('waits for the visible area to reach threshold and hides below it when repeating', async () => {
    const observers = mockIntersectionObservers();
    const { container } = render(Animate, { threshold: 0.6, once: false });
    const element = container.querySelector('.aesir-animate');

    observers[0].callback([{ isIntersecting: true, intersectionRatio: 0.2 }]);
    await tick();
    expect(element.dataset.visible).toBe('false');

    observers[0].callback([{ isIntersecting: true, intersectionRatio: 0.8 }]);
    await tick();
    expect(element.dataset.visible).toBe('true');

    observers[0].callback([{ isIntersecting: true, intersectionRatio: 0.4 }]);
    await tick();
    expect(element.dataset.visible).toBe('false');
  });
});
