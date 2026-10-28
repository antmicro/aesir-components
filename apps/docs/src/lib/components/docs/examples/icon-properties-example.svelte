<script lang="ts">
  import { AesirButton, AesirIcon } from '@aesir/svelte';
  import AlertCircle from '@lucide/svelte/icons/alert-circle';
  import Check from '@lucide/svelte/icons/check';
  import Info from '@lucide/svelte/icons/info';
  import Settings from '@lucide/svelte/icons/settings';

  const sizes = [16, 20, 24, 32];
  const statuses = [
    { label: 'Info', icon: Info, color: '--ds-emphasis-blue', surface: '--ds-surface-blue' },
    { label: 'Success', icon: Check, color: '--ds-emphasis-green', surface: '--ds-surface-green' },
    { label: 'Warning', icon: AlertCircle, color: '--ds-emphasis-orange', surface: '--ds-surface-orange' }
  ];
</script>

<div class="icon-properties">
  <div class="icon-properties__group" aria-label="Icon sizes">
    {#each sizes as size (size)}
      <span class="icon-properties__sample">
        <AesirIcon icon={Settings} {size} />
        <small>{size}px</small>
      </span>
    {/each}
  </div>

  <div class="icon-properties__group" aria-label="Status colors">
    {#each statuses as status (status.label)}
      <span class="icon-properties__sample">
        <span class="icon-properties__status" style={`--icon-color: var(${status.color}); --icon-surface: var(${status.surface})`}>
          <AesirIcon icon={status.icon} size={20} color={`var(${status.color})`} />
        </span>
        <small>{status.label}</small>
      </span>
    {/each}
  </div>

  <div class="icon-properties__group" aria-label="Icon buttons">
    <AesirButton size="icon" variant="outline" aria-label="Settings"><AesirIcon icon={Settings} /></AesirButton>
    <AesirButton size="icon" variant="accent" aria-label="Confirm"><AesirIcon icon={Check} /></AesirButton>
  </div>
</div>

<style>
  .icon-properties,
  .icon-properties__group,
  .icon-properties__sample {
    display: flex;
    align-items: center;
  }

  .icon-properties {
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--ds-spacing-8);
  }

  .icon-properties__group {
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--ds-spacing-3);
  }

  .icon-properties__sample {
    flex-direction: column;
    gap: var(--ds-spacing-2);
    color: var(--ds-foreground-muted);
  }

  .icon-properties__sample small {
    font-size: var(--ds-font-size-xs);
  }

  .icon-properties__status {
    display: grid;
    width: var(--ds-spacing-10);
    height: var(--ds-spacing-10);
    place-items: center;
    border: var(--ds-spacing-px) solid var(--icon-color);
    border-radius: var(--ds-radius-md);
    background: var(--icon-surface);
  }
</style>
