import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import Skeleton from '../src/components/aesir-skeleton/aesir-skeleton.svelte';

describe('AesirSkeleton', () => {
  test('stays hidden from assistive technology and accepts dimensions', () => {
    render(Skeleton, { width: 120, height: '2rem', radius: 'full', animated: false, 'data-testid': 'skeleton' });
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton.getAttribute('aria-hidden')).toBe('true');
    expect(skeleton.getAttribute('style')).toContain('width: 120px');
    expect(skeleton.getAttribute('style')).toContain('height: 2rem');
    expect(skeleton.hasAttribute('data-animated')).toBe(false);
  });

  test('retains explicit zero dimensions when props change', async () => {
    const { rerender } = render(Skeleton, { width: 120, height: 24, 'data-testid': 'skeleton' });
    const skeleton = screen.getByTestId('skeleton');

    await rerender({ width: 0, height: 0, 'data-testid': 'skeleton' });

    expect(skeleton.style.width).toBe('0px');
    expect(skeleton.style.height).toBe('0px');
  });
});
