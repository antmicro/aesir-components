<svelte:options
  customElement={{
    tag: 'aesir-icon-swap',
    props: {
      active: { type: 'Boolean', reflect: true },
      activeName: { attribute: 'active-name' },
      size: { type: 'Number' }
    }
  }}
/>

<script>
  import { AesirIconSwap } from '@aesir/svelte/components/aesir-icon-swap';

  let { name, activeName, active = false, size = 16 } = $props();
</script>

<AesirIconSwap {name} {activeName} {active} {size} />
