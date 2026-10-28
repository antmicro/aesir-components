<svelte:options
  customElement={{
    tag: 'aesir-kbd',
    props: {
      meta: { type: 'Boolean' },
      shift: { type: 'Boolean' },
      alt: { type: 'Boolean' },
      ctrl: { type: 'Boolean' },
      small: { type: 'Boolean' }
    }
  }}
/>

<script>
  import { AesirKbd } from '@aesir/svelte/components/aesir-kbd';

  let { meta = false, shift = false, alt = false, ctrl = false, small = false } = $props();
</script>

<AesirKbd {meta} {shift} {alt} {ctrl} {small}><slot></slot></AesirKbd>
