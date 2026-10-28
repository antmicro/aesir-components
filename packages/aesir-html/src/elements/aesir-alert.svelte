<svelte:options
  customElement={{
    tag: 'aesir-alert',
    props: {
      title: { attribute: 'alert-title' },
      hasAction: { type: 'Boolean', attribute: 'has-action' }
    }
  }}
/>

<script>
  import { AesirAlert } from '@aesir/svelte/components/aesir-alert';

  let { variant = 'default', icon, title, description, role, hasAction = false } = $props();
</script>

{#if hasAction}
  <AesirAlert {variant} {icon} {title} {description} {role}>
    <slot></slot>
    {#snippet action()}<slot name="action"></slot>{/snippet}
  </AesirAlert>
{:else}
  <AesirAlert {variant} {icon} {title} {description} {role}>
    <slot></slot>
  </AesirAlert>
{/if}
