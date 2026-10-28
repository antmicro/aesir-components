import { getFocusableElements } from '@aesir/svelte/utilities/overlay';

// Events bubble through the slot, but ARIA states belong to the actual control.
export function connectSlottedTrigger(node, props) {
  let current = props;
  let target;
  const original = new Map();
  const restore = () => {
    for (const [name, value] of original) {
      if (value === null) target.removeAttribute(name);
      else target.setAttribute(name, value);
    }
    original.clear();
  };
  const sync = () => {
    const next = getFocusableElements(node)[0];
    if (next !== target) {
      restore();
      target = next;
    }
    if (!target) return;
    for (const [name, value] of Object.entries(current)) {
      if (!name.startsWith('aria-')) continue;
      if (!original.has(name)) original.set(name, target.getAttribute(name));
      if (value === undefined || value === null) target.removeAttribute(name);
      else target.setAttribute(name, String(value));
    }
  };
  node.addEventListener('slotchange', sync);
  node.addEventListener('focusin', sync, true);
  node.addEventListener('pointerdown', sync, true);
  // Native listeners follow the composed event path through slots. Svelte's
  // delegated listeners cannot walk from a light-DOM button to this wrapper.
  const listeners = Object.keys(props)
    .filter((key) => key.startsWith('on'))
    .map((key) => {
      const listener = (event) => current[key]?.(event);
      node.addEventListener(key.slice(2), listener);
      return [key.slice(2), listener];
    });
  sync();
  return {
    update(props) {
      current = props;
      sync();
    },
    destroy() {
      node.removeEventListener('slotchange', sync);
      node.removeEventListener('focusin', sync, true);
      node.removeEventListener('pointerdown', sync, true);
      for (const [type, listener] of listeners) node.removeEventListener(type, listener);
      restore();
    }
  };
}
