<script>
  import { AesirIcon } from '@aesir/svelte';
  import Bell from '@lucide/svelte/icons/bell';
  import Calendar from '@lucide/svelte/icons/calendar';
  import Home from '@lucide/svelte/icons/home';
  import Mail from '@lucide/svelte/icons/mail';
  import Search from '@lucide/svelte/icons/search';
  import Settings from '@lucide/svelte/icons/settings';
  import Star from '@lucide/svelte/icons/star';
  import User from '@lucide/svelte/icons/user';

  const icons = [
    { label: 'Home', icon: Home },
    { label: 'User', icon: User },
    { label: 'Settings', icon: Settings },
    { label: 'Search', icon: Search },
    { label: 'Bell', icon: Bell },
    { label: 'Mail', icon: Mail },
    { label: 'Calendar', icon: Calendar },
    { label: 'Star', icon: Star }
  ];
</script>

<div class="icon-grid">
  {#each icons as item (item.label)}
    <div class="icon-grid__item">
      <AesirIcon icon={item.icon} size={20} />
      <span>{item.label}</span>
    </div>
  {/each}
</div>

<style>
  .icon-grid {
    display: grid;
    width: 100%;
    grid-template-columns: repeat(auto-fit, minmax(var(--ds-spacing-20), 1fr));
    gap: var(--ds-spacing-4);
  }

  .icon-grid__item {
    display: grid;
    place-items: center;
    gap: var(--ds-spacing-2);
    padding: var(--ds-spacing-3);
    border-radius: var(--ds-radius-md);
    color: var(--ds-foreground-muted);
  }

  .icon-grid__item span {
    font-size: var(--ds-font-size-xs);
  }
</style>
