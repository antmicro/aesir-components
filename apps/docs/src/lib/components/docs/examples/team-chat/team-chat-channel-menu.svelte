<script>
  import { tick } from 'svelte';
  import { AesirDropdown, AesirIcon } from '@aesir/svelte';
  import AtSign from '@lucide/svelte/icons/at-sign';
  import BellOff from '@lucide/svelte/icons/bell-off';

  const customIcons = { 'at-sign': AtSign, 'bell-off': BellOff };

  let { room, open = $bindable(false), anchor, inDrawer = false, onselect } = $props();
  const items = $derived(
    room
      ? [
          { type: 'label', label: `# ${room.name}` },
          { value: 'about', label: 'About', icon: 'info' },
          { value: 'members', label: 'Members', icon: 'users' },
          { value: 'copy-name', label: 'Copy channel name', icon: 'copy' },
          { value: 'star', label: room.starred ? 'Unstar channel' : 'Star channel', icon: 'star', role: 'menuitemcheckbox', checked: Boolean(room.starred) },
          { value: 'unread', label: 'Mark as unread', icon: 'mail' },
          { type: 'separator' },
          { type: 'label', label: 'Notify you about…' },
          { value: 'all', label: 'All new posts', icon: 'bell', role: 'menuitemradio', checked: (room.notifications ?? 'all') === 'all' },
          { value: 'mentions', label: 'Just mentions', icon: 'at-sign', role: 'menuitemradio', checked: room.notifications === 'mentions' },
          { value: 'muted', label: 'Mute channel', icon: 'bell-off', role: 'menuitemradio', checked: room.notifications === 'muted' }
        ]
      : []
  );

  async function select(item) {
    const channel = room;
    await tick();
    onselect?.(item.value, channel);
  }
</script>

<AesirDropdown
  bind:open
  {items}
  anchorElement={anchor}
  focusElement={anchor}
  label={room ? `Channel options for ${room.name}` : 'Channel options'}
  contentStyle={inDrawer ? '--aesir-overlay-z-popover: calc(var(--aesir-overlay-z-dialog, 70) + 1);' : undefined}
  onselect={select}
>
  {#snippet itemContent({ item })}
    <span class="channel-option">
      <AesirIcon icon={customIcons[item.icon]} name={item.icon} size={15} />
      <span>{item.label}</span>
    </span>
  {/snippet}
</AesirDropdown>

<style>
  .channel-option {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
</style>
