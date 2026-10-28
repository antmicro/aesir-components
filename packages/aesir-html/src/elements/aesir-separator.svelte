<svelte:options customElement={{ tag: 'aesir-separator', props: { decorative: { type: 'Boolean', reflect: true } } }} />

<script>
  import { AesirSeparator } from '@aesir/svelte/components/aesir-separator';
  let { orientation = 'horizontal', decorative = true } = $props();
</script>

<AesirSeparator {orientation} {decorative} />
