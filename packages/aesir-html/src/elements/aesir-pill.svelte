<svelte:options customElement="aesir-pill" />

<script>
  import { AesirPill } from '@aesir/svelte/components/aesir-pill';

  let { href, size = 'default' } = $props();
</script>

<AesirPill {href} {size}>
  <slot></slot>
</AesirPill>
