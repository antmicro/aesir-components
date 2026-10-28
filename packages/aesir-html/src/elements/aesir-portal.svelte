<svelte:options customElement={{ tag: 'aesir-portal', props: { disabled: { type: 'Boolean', reflect: true } } }} />

<script>
  import { AesirPortal } from '@aesir/svelte/components/aesir-portal';
  let { to, disabled = false } = $props();
</script>

<AesirPortal {to} {disabled}><slot></slot></AesirPortal>
