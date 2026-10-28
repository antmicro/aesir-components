<script>
  import { AesirButton, AesirIcon } from '@aesir/svelte';
  import House from '@lucide/svelte/icons/house';
  import MessagesSquare from '@lucide/svelte/icons/messages-square';
  import Bell from '@lucide/svelte/icons/bell';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';

  let { tab = 'home', unread = {}, onselect } = $props();
  const destinations = [
    { id: 'home', label: 'Home', icon: House },
    { id: 'dms', label: 'DMs', icon: MessagesSquare },
    { id: 'activity', label: 'Activity', icon: Bell },
    { id: 'more', label: 'More', icon: Ellipsis }
  ];
</script>

<nav class="desktop-navigation" aria-label="Workspace navigation">
  {#each destinations as entry (entry.id)}
    <AesirButton
      variant="ghost"
      class="desktop-destination"
      aria-label={unread[entry.id] ? `${entry.label}, unread` : entry.label}
      aria-current={tab === entry.id ? 'page' : undefined}
      onclick={() => onselect?.(entry.id)}
    >
      <span class="destination-icon">
        <AesirIcon icon={entry.icon} size={20} />
        {#if unread[entry.id]}<span class="destination-dot" aria-hidden="true"></span>{/if}
      </span>
      <span>{entry.label}</span>
    </AesirButton>
  {/each}
</nav>

<style>
  .desktop-navigation {
    display: flex;
    flex-direction: column;
    width: var(--ds-spacing-16);
    flex: none;
    gap: var(--ds-spacing-1);
    padding: var(--ds-spacing-2) var(--ds-spacing-1);
    border-right: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-surface);
  }
  .desktop-navigation :global(.desktop-destination) {
    width: 100%;
    height: auto;
    min-height: var(--ds-spacing-14);
    flex-direction: column;
    gap: var(--ds-spacing-1);
    padding: var(--ds-spacing-1);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
  }
  .destination-icon {
    position: relative;
    display: grid;
    width: var(--ds-spacing-8);
    height: var(--ds-spacing-8);
    place-items: center;
    border-radius: var(--ds-radius-lg);
  }
  .desktop-navigation :global(.desktop-destination[aria-current='page']) {
    color: var(--ds-accent-text-muted);
  }
  :global(.desktop-destination[aria-current='page']) .destination-icon {
    background: var(--ds-accent-surface);
  }
  .destination-dot {
    position: absolute;
    top: var(--ds-spacing-0-5);
    right: var(--ds-spacing-0-5);
    width: var(--ds-spacing-1-5);
    height: var(--ds-spacing-1-5);
    border-radius: var(--ds-radius-full);
    background: var(--ds-accent);
  }
</style>
