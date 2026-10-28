<script>
  import { AesirDialog } from '../../src/components/aesir-dialog/index.js';
  import { AesirTooltip } from '../../src/components/aesir-tooltip/index.js';
  let open = $state(false);
</script>

<button onclick={() => (open = true)}>Open modal</button>
<AesirTooltip content="Background help" delay={0}>
  {#snippet trigger(props)}<button {...props}>Background</button>{/snippet}
</AesirTooltip>
<AesirDialog bind:open title="Tooltip modal">
  <AesirTooltip content="Modal help" delay={0}>
    {#snippet trigger(props)}<button {...props}>Help</button>{/snippet}
  </AesirTooltip>
</AesirDialog>
