import { render } from 'vitest-browser-svelte';
import { describe, expect, test, vi } from 'vitest';
import Breadcrumb from '../../src/components/aesir-breadcrumb/aesir-breadcrumb.svelte';

describe('AesirBreadcrumb on narrow screens', () => {
  test('keeps the current page visible on mount and after the path changes', async () => {
    const style = 'width: 180px';
    const rendered = await render(Breadcrumb, {
      style,
      items: [{ label: 'A long first section', href: '/first' }, { label: 'A long second section', href: '/second' }, { label: 'Current' }]
    });
    const navigation = document.querySelector('[data-slot="breadcrumb"]');

    const currentPageIsVisible = () => {
      const current = navigation.querySelector('[aria-current="page"]');
      const navigationBounds = navigation.getBoundingClientRect();
      const currentBounds = current.getBoundingClientRect();

      expect(navigation.scrollWidth).toBeGreaterThan(navigation.clientWidth);
      expect(currentBounds.left).toBeGreaterThanOrEqual(navigationBounds.left - 1);
      expect(currentBounds.right).toBeLessThanOrEqual(navigationBounds.right + 1);
    };

    await vi.waitFor(currentPageIsVisible);

    await rendered.rerender({
      style,
      items: [{ label: 'A long first section', href: '/first' }, { label: 'A long second section', href: '/second' }, { label: 'An even longer third section', href: '/third' }, { label: 'Updated' }]
    });

    await vi.waitFor(currentPageIsVisible);

    navigation.style.width = '140px';
    await vi.waitFor(currentPageIsVisible);
  });
});
