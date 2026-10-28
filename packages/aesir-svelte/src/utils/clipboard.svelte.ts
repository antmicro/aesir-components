import { onDestroy } from 'svelte';

/** Copy feedback belongs to the latest request and ends with its component. */
export function createClipboard<Key = true>() {
  let copied = $state<Key>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let request = 0;
  let destroyed = false;

  onDestroy(() => {
    destroyed = true;
    clearTimeout(timer);
  });

  return {
    get copied() {
      return copied;
    },
    async copy(text: string, key: Key): Promise<boolean | undefined> {
      if (destroyed) return;
      const current = ++request;
      clearTimeout(timer);
      copied = undefined;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return destroyed || current !== request ? undefined : false;
      }
      if (destroyed || current !== request) return;
      copied = key;
      timer = setTimeout(() => (copied = undefined), 1200);
      return true;
    }
  };
}
