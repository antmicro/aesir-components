<script>
  import { tick } from 'svelte';
  import { AesirButton, AesirDropdown, AesirIcon } from '@aesir/svelte';
  import Smile from '@lucide/svelte/icons/smile';
  import Settings from '@lucide/svelte/icons/settings';
  import TeamChatAvatar from './team-chat-avatar.svelte';
  import { presenceLabels } from './team-chat-demo.js';

  let { person, onprofile, onstatus, onupdate, onpreferences } = $props();
  let accountButton = $state.raw();
  const items = $derived([
    { value: 'profile', label: 'Profile' },
    { type: 'separator' },
    { value: 'status', label: 'Update your status', icon: 'smile' },
    { value: 'availability', label: person.presence === 'online' ? 'Set yourself as away' : 'Set yourself as active', icon: person.presence === 'online' ? 'moon' : 'sun' },
    ...(person.status ? [{ value: 'clear-status', label: 'Clear status', icon: 'x' }] : []),
    { type: 'separator' },
    { value: 'preferences', label: 'Preferences' }
  ]);

  async function select(item) {
    await tick();
    if (item.value === 'profile') onprofile?.(accountButton);
    else if (item.value === 'status') onstatus?.(accountButton);
    else if (item.value === 'availability') onupdate?.({ presence: person.presence === 'online' ? 'away' : 'online' });
    else if (item.value === 'clear-status') onupdate?.({ status: '' });
    else if (item.value === 'preferences') onpreferences?.();
  }
</script>

<AesirDropdown {items} align="end" label="Account options" contentStyle="width: min(var(--ds-sizing-xs), calc(100vw - var(--ds-spacing-8)));" onselect={select}>
  {#snippet trigger(props)}
    <AesirButton {...props} bind:ref={accountButton} class="chat-avatar-trigger" variant="ghost" aria-label={`Open ${person.name}'s account menu`}>
      <TeamChatAvatar {person} size="xs" />
    </AesirButton>
  {/snippet}
  {#snippet itemContent({ item })}
    {#if item.value === 'profile'}
      <span class="account-identity">
        <TeamChatAvatar {person} size="sm" />
        <span class="account-identity__copy">
          <strong>{person.name}</strong>
          <small>{person.presence === 'online' ? 'Active' : presenceLabels[person.presence]} · Profile</small>
          {#if person.status}<small>{person.status}</small>{/if}
        </span>
      </span>
    {:else}
      <span class="account-option">
        <AesirIcon icon={item.value === 'status' ? Smile : item.value === 'preferences' ? Settings : undefined} name={item.icon} size={16} />
        <span>{item.label}</span>
      </span>
    {/if}
  {/snippet}
</AesirDropdown>

<style>
  .account-identity,
  .account-option {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-3);
  }
  .account-identity__copy {
    display: grid;
    min-width: 0;
    gap: var(--ds-spacing-1);
    overflow-wrap: anywhere;
  }
  .account-identity strong {
    font-weight: var(--ds-font-weight-medium);
  }
  .account-identity small {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
</style>
