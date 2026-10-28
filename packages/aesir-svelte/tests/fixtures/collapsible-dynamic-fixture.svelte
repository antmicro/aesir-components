<script>
  import Collapsible from '../../src/components/aesir-collapsible/aesir-collapsible.svelte';

  let { open = true, triggerPosition = 'top', stateOverride, positionOverride, longContent = false } = $props();
</script>

<Collapsible title="More settings" {open} {triggerPosition} data-state={stateOverride} data-trigger-position={positionOverride}>
  <button type="button">Internal action</button>
  {#if longContent}
    <span data-testid="long-content">AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA</span>
  {/if}
</Collapsible>
