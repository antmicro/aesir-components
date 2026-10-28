<script lang="ts">
  import AesirButton from '../../src/components/aesir-button/aesir-button.svelte';

  let activations = $state(0);
</script>

<AesirButton onclick={() => (activations += 1)}>Save</AesirButton>
<AesirButton disabled onclick={() => (activations += 1)}>Disabled</AesirButton>
<AesirButton href="/settings" disabled onclick={() => (activations += 1)}>Disabled link</AesirButton>
<output aria-label="Activations">{activations}</output>
