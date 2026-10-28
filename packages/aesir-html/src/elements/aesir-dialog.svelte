<svelte:options
  customElement={{
    tag: 'aesir-dialog',
    props: {
      open: { type: 'Boolean', reflect: true },
      title: { attribute: 'dialog-title' },
      hasFooter: { type: 'Boolean', attribute: 'has-footer' },
      closeLabel: { attribute: 'close-label' }
    }
  }}
/>

<script>
  import { AesirDialog } from '@aesir/svelte/components/aesir-dialog';

  let { open = $bindable(false), title, description, closeLabel = 'Close dialog', hasFooter = false } = $props();
</script>

{#if hasFooter}
  <AesirDialog bind:open {title} {description} {closeLabel}>
    <slot></slot>
    {#snippet footer()}<slot name="footer"></slot>{/snippet}
  </AesirDialog>
{:else}
  <AesirDialog bind:open {title} {description} {closeLabel}>
    <slot></slot>
  </AesirDialog>
{/if}
