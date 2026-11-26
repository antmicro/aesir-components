import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import Toaster from '../../src/components/aesir-toast/aesir-toaster.svelte';
import { toast, toasts } from '../../src/components/aesir-toast/toast-store.js';
import { applyTheme } from './setup.js';

test.each([
  ['light', false],
  ['dark', false],
  ['light', true],
  ['dark', true]
])('updates toast variant colors using the %s theme (coloredStates: %s) palette', async (mode, coloredStates) => {
  applyTheme(mode);
  if (coloredStates) await render(Toaster, { coloredStates });
  else await render(Toaster);
  const reference = document.createElement('div');
  reference.style.position = 'fixed';
  reference.style.left = '-9999px';
  document.body.append(reference);
  const id = toast({ title: 'Status update', description: 'Notification details', duration: 0, action: { label: 'Undo' } });

  try {
    for (const [variant, iconPalette, color] of [
      ['default', null],
      ['info', null],
      ['info', null, 'teal'],
      ['success', 'green'],
      ['warning', 'orange'],
      ['destructive', null],
      ['loading', null]
    ]) {
      toast.update(id, { variant, color });
      const card = page.getByRole('article');
      await expect.element(card).toHaveAttribute('data-variant', variant);
      reference.style.background = variant === 'destructive' ? 'var(--ds-emphasis-red)' : 'var(--ds-background-secondary)';
      reference.style.border = variant === 'destructive' ? '1px solid var(--ds-border-red)' : '1px solid var(--ds-border)';
      reference.style.color = variant === 'destructive' && mode === 'light' ? 'var(--ds-foreground-inverted)' : 'var(--ds-foreground)';
      const palette = color ?? (coloredStates ? { info: 'blue', success: 'green', warning: 'orange', destructive: 'red' }[variant] : undefined);
      if (palette) {
        reference.style.background = `var(--ds-surface-${palette})`;
        reference.style.border = `1px solid var(--ds-border-${palette})`;
        reference.style.color = `var(--ds-foreground-${palette})`;
      }
      const expected = getComputedStyle(reference);
      const actual = getComputedStyle(card.element());
      await expect.poll(() => getComputedStyle(card.element()).backgroundColor).toBe(expected.backgroundColor);
      expect(actual.borderTopColor).toBe(expected.borderTopColor);
      expect(actual.color).toBe(expected.color);
      const foreground = expected.color;
      if (iconPalette && !coloredStates) reference.style.color = `var(--ds-foreground-muted-${iconPalette})`;
      expect(getComputedStyle(card.element().querySelector('.aesir-toast__icon')).color).toBe(getComputedStyle(reference).color);
      expect(getComputedStyle(card.element().querySelector('p')).color).toBe(foreground);
      expect(getComputedStyle(card.element().querySelector('.aesir-toast__action')).backgroundColor).toBe(foreground);
      await expect.poll(() => getComputedStyle(card.element().querySelector('.aesir-toast__close')).backgroundColor).toBe(expected.backgroundColor);
    }
  } finally {
    toasts.set([]);
    reference.remove();
  }
});
