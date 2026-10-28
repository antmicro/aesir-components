import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import Toaster from '../../src/components/aesir-toast/aesir-toaster.svelte';
import { toast, toasts } from '../../src/components/aesir-toast/toast-store.js';
import { applyTheme } from './setup.js';

test.each([320, 1280])('keeps a short toast action on one line at a %ipx viewport', async (width) => {
  await page.viewport(width, 720);
  applyTheme('dark');
  await render(Toaster);
  toast.success('Event has been created', undefined, {
    duration: 0,
    action: { label: 'Undo' }
  });

  try {
    const action = page.getByRole('button', { name: 'Undo', exact: true });
    await expect.element(action).toBeVisible();
    const button = action.element();
    const text = document.createRange();
    text.selectNodeContents(button);
    const textLines = new Set([...text.getClientRects()].filter((rect) => rect.width > 0).map((rect) => Math.round(rect.top)));
    expect(textLines.size).toBe(1);

    const card = button.closest('.aesir-toast');
    expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    expect(button.getBoundingClientRect().left).toBeGreaterThanOrEqual(card.querySelector('.aesir-toast__content').getBoundingClientRect().right);
  } finally {
    toasts.set([]);
  }
});

test.each(['Restore the previously selected configuration', 'RestorePreviouslySelectedConfiguration'])('keeps the long action "%s" inside a narrow toast', async (label) => {
  await page.viewport(320, 720);
  applyTheme('light');
  await render(Toaster);
  toast.error('Could not save changes', undefined, {
    duration: 0,
    action: { label }
  });

  try {
    const action = page.getByRole('button', { name: label, exact: true });
    await expect.element(action).toBeVisible();
    const card = action.element().closest('.aesir-toast');
    expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    const text = document.createRange();
    text.selectNodeContents(action.element());
    expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(action.element().getBoundingClientRect().right + 0.5);
  } finally {
    toasts.set([]);
  }
});
