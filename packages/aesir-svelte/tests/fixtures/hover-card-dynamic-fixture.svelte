<script>
  import AesirHoverCard from '../../src/components/aesir-hover-card/aesir-hover-card.svelte';
  import AesirDialog from '../../src/components/aesir-dialog/aesir-dialog.svelte';

  let open = $state(true);
  let disabled = $state(false);
  let dialogOpen = $state(false);
</script>

<button type="button" onclick={() => (disabled = true)}>Disable preview</button>
<button type="button" onclick={() => (disabled = false)}>Enable preview</button>
<button type="button" onclick={() => (open = true)}>Open preview externally</button>
<button type="button" onclick={() => (dialogOpen = true)}>Open dialog</button>
<output aria-label="Preview state">{open ? 'open' : 'closed'}</output>

<AesirDialog bind:open={dialogOpen} title="Modal dialog">
  <p>Dialog content</p>
</AesirDialog>

<AesirHoverCard bind:open {disabled} openDelay={0} closeDelay={0}>
  {#snippet trigger(props)}
    <button type="button" {...props}>Preview item</button>
  {/snippet}
  {#snippet content()}
    <span>Preview details</span>
  {/snippet}
</AesirHoverCard>
