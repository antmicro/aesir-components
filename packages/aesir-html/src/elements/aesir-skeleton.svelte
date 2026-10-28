<svelte:options customElement={{ tag: 'aesir-skeleton', props: { animated: { type: 'Boolean', reflect: true } } }} />

<script>
  import { AesirSkeleton } from '@aesir/svelte/components/aesir-skeleton';
  let { width, height, radius = 'md', animated = true } = $props();
</script>

<AesirSkeleton {width} {height} {radius} {animated} />
