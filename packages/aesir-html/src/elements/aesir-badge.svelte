<svelte:options customElement="aesir-badge" />

<script>
  import { AesirBadge } from '@aesir/svelte/components/aesir-badge';

  let { variant = 'default', size = 'default', font = 'default' } = $props();
</script>

<AesirBadge {variant} {size} {font}>
  <slot></slot>
</AesirBadge>
