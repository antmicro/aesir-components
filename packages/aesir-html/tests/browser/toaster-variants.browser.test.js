import '../../dist/aesir-html.min.js';
import { afterEach, expect, test } from 'vitest';
import { mount } from './test-utils.js';
import { applyTheme } from './setup.js';

afterEach(() => document.body.replaceChildren());

test('applies toaster and per-toast color options from HTML', async () => {
  applyTheme('light');
  await mount('<aesir-toaster colored-states></aesir-toaster>');
  const host = document.querySelector('aesir-toaster');
  const reference = document.createElement('div');
  host.after(reference);

  const id = globalThis.Aesir.toast.info('Status update', undefined, { duration: 0 });
  const card = () => host.shadowRoot.querySelector(`[data-toast-id="${id}"]`);
  const background = () => card() && getComputedStyle(card()).backgroundColor;

  try {
    reference.style.backgroundColor = 'var(--ds-surface-blue)';
    await expect.poll(background).toBe(getComputedStyle(reference).backgroundColor);

    globalThis.Aesir.toast.update(id, { color: 'teal' });
    reference.style.backgroundColor = 'var(--ds-surface-teal)';
    await expect.poll(background).toBe(getComputedStyle(reference).backgroundColor);

    host.style.setProperty('--aesir-toast-surface', 'var(--ds-surface-purple)');
    reference.style.backgroundColor = 'var(--ds-surface-purple)';
    await expect.poll(background).toBe(getComputedStyle(reference).backgroundColor);
  } finally {
    globalThis.Aesir.toast.dismiss(id);
  }
});
