<script>
  import { AesirButton, AesirIcon } from '@aesir/svelte';
  import SquarePen from '@lucide/svelte/icons/square-pen';

  let { title, onnewmessage } = $props();
</script>

<header class="chat-sidebar-heading">
  <h2 tabindex="-1" data-mobile-heading>{title}</h2>
  <AesirButton variant="ghost" size="icon-sm" aria-label="New message" onclick={onnewmessage}>
    <AesirIcon icon={SquarePen} size={16} />
  </AesirButton>
</header>

<style>
  .chat-sidebar-heading {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--ds-spacing-14);
    flex: none;
    gap: var(--ds-spacing-2);
    padding: var(--ds-spacing-2) var(--ds-spacing-3);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  h2 {
    margin: 0;
    min-width: 0;
    color: var(--ds-foreground);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
    line-height: var(--ds-font-line-height-sm);
    white-space: nowrap;
  }
</style>
