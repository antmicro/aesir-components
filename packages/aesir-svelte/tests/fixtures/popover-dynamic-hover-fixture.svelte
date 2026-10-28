<script>
  import AesirPopover from '../../src/components/aesir-popover/aesir-popover.svelte';

  let open = $state(false);
  let openOnHover = $state(true);
</script>

<button type="button" onclick={() => (openOnHover = false)}>Disable hover opening</button>
<output aria-label="Popover state">{open ? 'open' : 'closed'}</output>

<AesirPopover bind:open {openOnHover} openDelay={100} closeDelay={0}>
  {#snippet trigger(props)}
    <button type="button" {...props}>Open preview</button>
  {/snippet}
  {#snippet content()}
    <span>Preview content</span>
    <button type="button" onclick={() => (open = false)}>Close via parent</button>
  {/snippet}
</AesirPopover>
