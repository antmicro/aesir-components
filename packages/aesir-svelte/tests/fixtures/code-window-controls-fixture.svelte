<script>
  import { AesirButton, AesirCodeWindow } from '../../src/index.js';

  let lastAction = $state('');
</script>

<AesirCodeWindow filename="example.svelte" code="const ready = true;">
  {#snippet controls()}
    <AesirButton size="sm" variant="ghost" onclick={() => (lastAction = 'Source')}>Source</AesirButton>
    <AesirButton size="sm" variant="ghost" onclick={() => (lastAction = 'Preview')}>Preview</AesirButton>
    <AesirButton size="sm" variant="ghost" onclick={() => (lastAction = 'Download')}>Download</AesirButton>
  {/snippet}
</AesirCodeWindow>

<output aria-label="Last code action">{lastAction}</output>
