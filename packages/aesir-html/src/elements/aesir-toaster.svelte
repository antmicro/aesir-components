<svelte:options customElement={{ tag: 'aesir-toaster', props: { coloredStates: { type: 'Boolean', attribute: 'colored-states' } } }} />

<script>
  import { AesirToaster } from '@aesir/svelte/components/aesir-toast';

  let { coloredStates = false } = $props();
</script>

<AesirToaster {coloredStates} />
