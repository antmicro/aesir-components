import { onMount } from 'svelte';

export function restoreOnFormReset(control: () => HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined, restore: (event: Event) => void) {
  onMount(() => {
    const root = control()?.getRootNode();
    if (!root) return;
    const onreset = (event: Event) => {
      if (event.target !== control()?.form) return;
      // A reset button can reach capture listeners before a form listener cancels the event.
      setTimeout(() => {
        if (!event.defaultPrevented && event.target === control()?.form) restore(event);
      }, 0);
    };
    root.addEventListener('reset', onreset, true);
    return () => root.removeEventListener('reset', onreset, true);
  });
}
