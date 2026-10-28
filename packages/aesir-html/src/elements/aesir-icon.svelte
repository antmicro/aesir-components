<svelte:options
  customElement={{
    tag: 'aesir-icon',
    props: {
      size: { type: 'Number' },
      strokeWidth: { type: 'Number', attribute: 'stroke-width' }
    }
  }}
/>

<script>
  import { AesirIcon } from '@aesir/svelte/components/aesir-icon';

  let { name, label, size = 20, strokeWidth = 2 } = $props();
</script>

<AesirIcon {name} {label} {size} {strokeWidth} />
