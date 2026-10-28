import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import Separator from '../src/components/aesir-separator/aesir-separator.svelte';

describe('AesirSeparator', () => {
  test('is decorative by default and exposes orientation when semantic', async () => {
    const { rerender } = render(Separator, { 'data-testid': 'separator' });
    expect(screen.getByTestId('separator').getAttribute('role')).toBe('presentation');
    await rerender({ decorative: false, orientation: 'vertical', 'data-testid': 'separator' });
    expect(screen.getByRole('separator').getAttribute('aria-orientation')).toBe('vertical');
  });
});
