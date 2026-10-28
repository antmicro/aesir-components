<svelte:options customElement="aesir-avatar" />

<script>
  import { AesirAvatar } from '@aesir/svelte/components/aesir-avatar';

  let { src, alt = '', fallback = '', size = 'default', gradient = false, loading = 'lazy', decoding = 'async', ariaLabel } = $props();
</script>

<AesirAvatar {src} {alt} {fallback} {size} {gradient} {loading} {decoding} aria-label={ariaLabel} />
