<svelte:options customElement={{ tag: 'aesir-loader', props: { decorative: { type: 'Boolean', reflect: true } } }} />

<script>
  import { AesirLoader } from '@aesir/svelte/components/aesir-loader';
  let { size = 'default', variant = 'ring', pattern = 'pulse', label = 'Loading', decorative = false } = $props();
</script>

<AesirLoader {size} {variant} {pattern} {label} {decorative} />
