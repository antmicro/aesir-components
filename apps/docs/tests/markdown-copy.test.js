import { afterEach, expect, test, vi } from 'vitest';
import { markdownCopy } from '../src/lib/components/docs/markdown-copy.js';

vi.mock('@aesir/svelte/components/aesir-toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

test('markdown copy preserves UTF-8 and ignores repeated clicks while pending', async () => {
  document.body.innerHTML = '<main><button class="docs-copy-button"><span>Copy</span></button></main>';
  const root = document.querySelector('main');
  const button = root.querySelector('button');
  const source = 'const greeting = "Zażółć 🌍";';
  button.dataset.copyB64 = Buffer.from(source, 'utf8').toString('base64');
  let complete;
  const writeText = vi.fn(() => new Promise((resolve) => (complete = resolve)));
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const action = markdownCopy(root);
  try {
    button.querySelector('span').click();
    button.click();
    expect(writeText).toHaveBeenCalledExactlyOnceWith(source);
    complete();
    await vi.waitFor(() => expect(button.dataset.copyState).toBe('success'));
    expect(button.hasAttribute('aria-busy')).toBe(false);
    action.destroy();
    button.click();
    expect(writeText).toHaveBeenCalledTimes(1);
  } finally {
    action.destroy();
  }
});
