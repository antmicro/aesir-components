<script>
  import { AesirDrawer } from '../../src/components/aesir-drawer/index.js';

  let open = $state(false);
  let closeCount = $state(0);
</script>

<button type="button" onclick={() => (open = true)}>Open details</button>

<AesirDrawer bind:open label="Project details" onclose={() => (closeCount += 1)}>
  {#snippet header()}<strong>Project details</strong>{/snippet}
  <button type="button">First action</button>
  {#snippet footer({ close })}<button type="button" onclick={close}>Done</button>{/snippet}
</AesirDrawer>

<output aria-label="Drawer state">{open ? 'open' : 'closed'}</output>
<output aria-label="Close count">{closeCount}</output>
