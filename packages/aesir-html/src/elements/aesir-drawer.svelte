<svelte:options
  customElement={{
    tag: 'aesir-drawer',
    props: {
      open: { type: 'Boolean', reflect: true },
      hasHeader: { type: 'Boolean', attribute: 'has-header' },
      hasFooter: { type: 'Boolean', attribute: 'has-footer' },
      closeLabel: { attribute: 'close-label' }
    }
  }}
/>

<script>
  import { AesirDrawer } from '@aesir/svelte/components/aesir-drawer';

  let { open = $bindable(false), side = 'left', label = 'Drawer', closeLabel = 'Close drawer', hasHeader = false, hasFooter = false } = $props();
</script>

{#if hasHeader && hasFooter}
  <AesirDrawer bind:open {side} {label} {closeLabel}>
    {#snippet header()}<slot name="header"></slot>{/snippet}
    <slot></slot>
    {#snippet footer()}<slot name="footer"></slot>{/snippet}
  </AesirDrawer>
{:else if hasHeader}
  <AesirDrawer bind:open {side} {label} {closeLabel}>
    {#snippet header()}<slot name="header"></slot>{/snippet}
    <slot></slot>
  </AesirDrawer>
{:else if hasFooter}
  <AesirDrawer bind:open {side} {label} {closeLabel}>
    <slot></slot>
    {#snippet footer()}<slot name="footer"></slot>{/snippet}
  </AesirDrawer>
{:else}
  <AesirDrawer bind:open {side} {label} {closeLabel}><slot></slot></AesirDrawer>
{/if}
