import { toast } from '@aesir/svelte/components/aesir-toast';
import { copyToClipboard } from './copy.js';

// Markdown fences are generated HTML, so their buttons use delegated events.
export function markdownCopy(node) {
  const timers = new Map();
  let destroyed = false;

  const copy = async (event) => {
    const button = event.target?.closest?.('.docs-copy-button');
    if (!button || !node.contains(button) || button.getAttribute('aria-busy') === 'true') return;
    const encoded = button.getAttribute('data-copy-b64');
    if (!encoded) return;

    clearTimeout(timers.get(button));
    timers.delete(button);
    button.dataset.copyState = 'idle';
    button.setAttribute('aria-busy', 'true');
    try {
      // The build encodes UTF-8 bytes; atob alone corrupts non-ASCII source.
      const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
      const value = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      const copied = await copyToClipboard(value, { successLabel: 'Code copied', showValue: false });
      if (copied && !destroyed && node.contains(button)) {
        button.dataset.copyState = 'success';
        timers.set(
          button,
          setTimeout(() => {
            button.dataset.copyState = 'idle';
            timers.delete(button);
          }, 1200)
        );
      }
    } catch {
      toast.error('Copy failed', 'The code could not be decoded.');
    } finally {
      button.removeAttribute('aria-busy');
    }
  };

  node.addEventListener('click', copy);
  return {
    destroy() {
      destroyed = true;
      node.removeEventListener('click', copy);
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    }
  };
}
