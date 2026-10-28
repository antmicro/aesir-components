import { onMount } from 'svelte';

export function blockDisabledClick(host, isDisabled) {
  onMount(() => {
    const block = (event) => {
      const origin = event.composedPath()[0];
      if (!isDisabled() || (origin !== host && !host.shadowRoot?.contains(origin))) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    host.addEventListener('click', block, true);
    return () => host.removeEventListener('click', block, true);
  });
}
