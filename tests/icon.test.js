import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import Icon from '../src/components/aesir-icon/aesir-icon.svelte';

describe('AesirIcon', () => {
  test('is decorative without a label and named when it conveys meaning', async () => {
    const { rerender, container } = render(Icon, { name: 'search' });
    expect(container.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    await rerender({ name: 'search', label: 'Search' });
    expect(screen.getByRole('img', { name: 'Search' })).toBeTruthy();
  });

  test('forwards accessible SVG attributes for registered and node icons', async () => {
    const { rerender, container } = render(Icon, { name: 'search', 'aria-label': 'Find' });
    expect(screen.getByRole('img', { name: 'Find' })).toBeTruthy();
    expect(container.querySelector('svg').hasAttribute('aria-hidden')).toBe(false);

    container.insertAdjacentHTML('afterbegin', '<span id="icon-caption">Custom circle</span>');
    await rerender({
      icon: [['circle', { cx: 12, cy: 12, r: 6 }]],
      'aria-labelledby': 'icon-caption'
    });
    expect(screen.getByRole('img', { name: 'Custom circle' })).toBeTruthy();
    expect(container.querySelector('svg').hasAttribute('aria-hidden')).toBe(false);

    await rerender({ name: 'search', role: 'presentation', 'aria-hidden': 'false' });
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('role')).toBe('presentation');
    expect(svg.getAttribute('aria-hidden')).toBe('false');
  });
});
