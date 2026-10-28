<svelte:options customElement={{ tag: 'aesir-menubar', props: { open: { type: 'String', reflect: true } } }} />

<script>
  import { AesirMenubar } from '@aesir/svelte/components/aesir-menubar';
  import { parseJson } from '../parse.js';
  let { menus = [], open = $bindable(null), label = 'Application menu' } = $props();
  const host = $host();
  const parsed = $derived(parseJson(menus));
</script>

<AesirMenubar menus={parsed} bind:value={open} {label} onselect={(item) => host.dispatchEvent(new CustomEvent('select', { detail: item, bubbles: true, composed: true }))} />
