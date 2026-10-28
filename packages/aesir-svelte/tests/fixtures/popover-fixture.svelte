<script>
  import { AesirPopover } from '../../src/components/aesir-popover/index.js';

  let open = $state(false);
</script>

<AesirPopover bind:open>
  {#snippet trigger(props)}<button type="button" {...props}>Display options</button>{/snippet}
  {#snippet content({ close })}
    <p>Popover content</p>
    <button type="button" onclick={close}>Apply</button>
  {/snippet}
</AesirPopover>

<button type="button">Outside</button>
<output aria-label="Popover state">{open ? 'open' : 'closed'}</output>
