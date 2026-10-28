import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import ResizablePanels from '../src/components/aesir-resizable-panels/aesir-resizable-panels.svelte';

test('keeps the separator value within a fractional range after limits change', async () => {
  const { rerender } = render(ResizablePanels, { size: 50, min: 20, max: 80 });
  const separator = screen.getByRole('separator');
  const root = separator.closest('.aesir-resizable-panels');

  await rerender({ size: 50, min: 25.5, max: 25.5 });

  expect(root.style.getPropertyValue('--aesir-panel-size')).toBe('25.5%');
  expect(separator.getAttribute('aria-valuemin')).toBe('25.5');
  expect(separator.getAttribute('aria-valuemax')).toBe('25.5');
  expect(separator.getAttribute('aria-valuenow')).toBe('25.5');
});
