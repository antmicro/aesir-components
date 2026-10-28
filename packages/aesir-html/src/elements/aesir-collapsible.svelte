<svelte:options
  customElement={{
    tag: 'aesir-collapsible',
    props: {
      open: { type: 'Boolean', reflect: true },
      title: { attribute: 'collapsible-title' },
      disabled: { type: 'Boolean', reflect: true },
      triggerPosition: { attribute: 'trigger-position', reflect: true }
    }
  }}
/>

<script>
  import { AesirCollapsible } from '@aesir/svelte/components/aesir-collapsible';
  import { blockDisabledClick } from '../disabled-click.js';

  let { open = $bindable(false), title, disabled = false, triggerPosition = 'top', indicator = 'chevron' } = $props();
  blockDisabledClick($host(), () => disabled);
</script>

<AesirCollapsible bind:open {title} {disabled} {triggerPosition} {indicator}>
  <slot></slot>
</AesirCollapsible>
