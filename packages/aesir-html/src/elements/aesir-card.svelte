<svelte:options
  customElement={{
    tag: 'aesir-card',
    props: {
      title: { attribute: 'card-title' },
      hasHeaderAction: { type: 'Boolean', attribute: 'has-header-action' },
      hasFooter: { type: 'Boolean', attribute: 'has-footer' }
    }
  }}
/>

<script>
  import { AesirCard } from '@aesir/svelte/components/aesir-card';

  let { title, description, hasHeaderAction = false, hasFooter = false } = $props();
</script>

{#if hasHeaderAction && hasFooter}
  <AesirCard {title} {description}>
    <slot></slot>
    {#snippet headerAction()}<slot name="header-action"></slot>{/snippet}
    {#snippet footer()}<slot name="footer"></slot>{/snippet}
  </AesirCard>
{:else if hasHeaderAction}
  <AesirCard {title} {description}>
    <slot></slot>
    {#snippet headerAction()}<slot name="header-action"></slot>{/snippet}
  </AesirCard>
{:else if hasFooter}
  <AesirCard {title} {description}>
    <slot></slot>
    {#snippet footer()}<slot name="footer"></slot>{/snippet}
  </AesirCard>
{:else}
  <AesirCard {title} {description}>
    <slot></slot>
  </AesirCard>
{/if}
