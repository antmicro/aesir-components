<svelte:options
  customElement={{
    tag: 'aesir-popover',
    props: {
      open: { type: 'Boolean', reflect: true },
      offset: { type: 'Number' },
      openOnHover: { type: 'Boolean' },
      openDelay: { type: 'Number' },
      closeDelay: { type: 'Number' }
    }
  }}
/>

<script>
  import { AesirPopover } from '@aesir/svelte/components/aesir-popover';
  import { connectSlottedTrigger } from '../trigger-attributes.js';

  let { open = $bindable(false), placement = 'bottom', align = 'center', offset = 8, openOnHover = false, openDelay = 700, closeDelay = 300 } = $props();
</script>

<AesirPopover bind:open {placement} {align} {offset} {openOnHover} {openDelay} {closeDelay}>
  {#snippet trigger(props)}
    <span use:connectSlottedTrigger={props}><slot></slot></span>
  {/snippet}
  {#snippet content()}<slot name="content"></slot>{/snippet}
</AesirPopover>
