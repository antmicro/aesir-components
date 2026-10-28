<svelte:options customElement="aesir-scroll-area" />

<script>
  import { AesirScrollArea } from '@aesir/svelte/components/aesir-scroll-area';

  let { orientation = 'vertical' } = $props();
</script>

<AesirScrollArea {orientation}>
  <slot></slot>
</AesirScrollArea>
