import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import IconSwap from '../src/components/aesir-icon-swap/aesir-icon-swap.svelte';

describe('AesirIconSwap', () => {
  test('renders both decorative states and exposes the active state', async () => {
    const { rerender } = render(IconSwap, { name: 'sun', activeName: 'moon', 'data-testid': 'swap' });
    expect(screen.getByTestId('swap').querySelectorAll('svg')).toHaveLength(2);
    expect(screen.getByTestId('swap').hasAttribute('data-active')).toBe(false);
    await rerender({ name: 'sun', activeName: 'moon', active: true, 'data-testid': 'swap' });
    expect(screen.getByTestId('swap').hasAttribute('data-active')).toBe(true);
  });

  test('preserves the size custom property alongside caller styles when props change', async () => {
    const { rerender } = render(IconSwap, {
      name: 'sun',
      activeName: 'moon',
      size: 20,
      style: 'color: red',
      'data-testid': 'styled-swap'
    });
    const swap = screen.getByTestId('styled-swap');
    expect(swap.style.getPropertyValue('--aesir-icon-swap-size').trim()).toBe('20px');
    expect(swap.style.color).toBe('red');

    await rerender({
      name: 'sun',
      activeName: 'moon',
      size: '1.5rem',
      style: 'color: blue',
      'data-testid': 'styled-swap'
    });
    expect(swap.style.getPropertyValue('--aesir-icon-swap-size').trim()).toBe('1.5rem');
    expect(swap.style.color).toBe('blue');
  });
});
