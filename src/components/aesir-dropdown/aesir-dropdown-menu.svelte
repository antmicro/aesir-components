<script lang="ts">
  import type { DropdownItem, DropdownItemContent, DropdownSubmenuController } from './types.js';
  import AesirIcon from '../aesir-icon/aesir-icon.svelte';
  import { isReservedShortcut } from '../keyboard/shortcut.js';
  import { positionSubmenu } from './submenu-position.js';

  type DropdownMenuProps = {
    items: DropdownItem[];
    level?: number;
    mobile?: boolean;
    controller: DropdownSubmenuController;
    onselect: (item: DropdownItem, event: MouseEvent) => void;
    onopen?: (item: DropdownItem, level: number, event: MouseEvent) => void;
    itemContent?: DropdownItemContent;
  };

  let { items, level = 0, mobile = false, controller, onselect, onopen, itemContent }: DropdownMenuProps = $props();
</script>

{#snippet menuContent(entries: DropdownItem[], depth: number)}
  {#each entries as item, index (`${item.type ?? 'item'}:${item.value ?? item.label ?? index}`)}
    {@const itemRole = item.role ?? 'menuitem'}
    {#if item.type === 'separator'}
      <div class="separator aesir-dropdown__separator" role="separator"></div>
    {:else if item.type === 'label'}
      <div class="label aesir-dropdown__label" part="label" role="presentation">{item.label}</div>
    {:else if item.items?.length}
      <div
        class="submenu-anchor aesir-dropdown__submenu-anchor"
        role="none"
        onpointerenter={(event) => !mobile && event.pointerType === 'mouse' && !item.disabled && controller.openFromPointer(event, depth, item.value)}
        onpointerleave={(event) => !mobile && event.pointerType === 'mouse' && controller.scheduleClose(depth)}
      >
        <button
          type="button"
          role="menuitem"
          tabindex="-1"
          data-submenu-trigger={item.value}
          data-submenu-level={depth}
          aria-haspopup="menu"
          aria-expanded={controller.openPath[depth] === item.value}
          disabled={item.disabled}
          onclick={(event) => (onopen ? onopen(item, depth, event) : controller.openImmediately(depth, item.value))}
        >
          <span class="item-label aesir-dropdown__item-label">
            {#if item.icon}<AesirIcon name={item.icon} size={15} />{/if}
            <span>{item.label}</span>
          </span>
          <AesirIcon class="item-chevron aesir-dropdown__item-chevron" name="chevron-right" size={14} />
        </button>
        {#if !mobile && controller.openPath[depth] === item.value}
          <div
            class="submenu aesir-dropdown__submenu"
            use:positionSubmenu
            data-submenu-level={depth}
            data-menu-level={depth + 1}
            data-has-submenus={item.items.some((child) => child.items?.length) || undefined}
            role="menu"
            aria-label={item.label}
          >
            {@render menuContent(item.items, depth + 1)}
          </div>
        {/if}
      </div>
    {:else if item.href}
      <!-- eslint-disable svelte/no-navigation-without-resolve -->
      <a
        href={item.disabled ? undefined : item.href}
        target={item.target}
        rel={item.rel ?? (item.target === '_blank' ? 'noreferrer' : undefined)}
        role={itemRole}
        tabindex="-1"
        aria-disabled={item.disabled || undefined}
        aria-checked={itemRole === 'menuitemradio' || itemRole === 'menuitemcheckbox' ? item.checked : undefined}
        data-variant={item.variant}
        data-featured={item.featured || undefined}
        onclick={(event) => {
          if (item.disabled) {
            event.preventDefault();
            return;
          }
          onselect(item, event);
        }}
      >
        {#if itemContent}
          {@render itemContent({ item })}
        {:else}
          <span class="item-label aesir-dropdown__item-label">
            {#if item.icon}<AesirIcon name={item.icon} size={15} />{/if}
            <span>{item.label}</span>
          </span>
          {#if item.shortcut && !isReservedShortcut(item.shortcut)}<kbd>{item.shortcut}</kbd>{/if}
        {/if}
      </a>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    {:else}
      <button
        type="button"
        role={itemRole}
        tabindex="-1"
        disabled={item.disabled}
        aria-checked={itemRole === 'menuitemradio' || itemRole === 'menuitemcheckbox' ? item.checked : undefined}
        data-variant={item.variant}
        data-featured={item.featured || undefined}
        onclick={(event) => {
          if (item.disabled) {
            event.preventDefault();
            return;
          }
          onselect(item, event);
        }}
      >
        {#if itemContent}
          {@render itemContent({ item })}
        {:else}
          <span class="item-label aesir-dropdown__item-label">
            {#if item.icon}<AesirIcon name={item.icon} size={15} />{/if}
            <span>{item.label}</span>
          </span>
          {#if item.shortcut && !isReservedShortcut(item.shortcut)}<kbd>{item.shortcut}</kbd>{/if}
        {/if}
      </button>
    {/if}
  {/each}
{/snippet}

{@render menuContent(items, level)}

<style>
  .submenu-anchor {
    position: relative;
  }

  .item-label {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-2);
  }

  :global(.item-chevron),
  kbd {
    flex: none;
    margin-left: auto;
  }

  .submenu {
    position: absolute;
    top: calc(var(--ds-spacing-1) * -1 + var(--aesir-submenu-shift-y, 0px));
    left: calc(100% - var(--ds-spacing-px));
    z-index: 1;
    display: grid;
    width: max-content;
    min-width: var(--ds-spacing-48);
    max-height: calc(100dvh - var(--ds-spacing-4));
    overflow-y: auto;
    padding: var(--ds-spacing-1-5);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background-secondary);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
    box-shadow: 0 var(--ds-spacing-2) var(--ds-spacing-6) color-mix(in oklch, var(--ds-fixed-black) 14%, transparent);
    transform-origin: left top;
  }

  .submenu:global([data-has-submenus]) {
    max-height: none;
    overflow: visible;
  }

  .submenu:global([data-side='left']) {
    right: calc(100% - var(--ds-spacing-px));
    left: auto;
    transform-origin: right top;
  }

  .submenu-anchor:has(> .submenu:global([data-side='left'])) > button :global(.item-chevron) {
    transform: rotate(180deg);
  }

  .separator {
    height: var(--ds-spacing-px);
    margin: var(--ds-spacing-1) var(--ds-spacing-2);
    background: var(--ds-border);
  }

  .label {
    padding: var(--ds-spacing-2) var(--ds-spacing-3) var(--ds-spacing-1);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
  }

  :is(button, a) {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: flex-start;
    gap: var(--ds-spacing-4);
    padding: var(--ds-spacing-2) var(--ds-spacing-3);
    border: 0;
    border-radius: var(--ds-radius-md);
    background: transparent;
    color: var(--ds-foreground);
    font: inherit;
    font-size: inherit;
    line-height: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    transition:
      background-color var(--ds-motion-duration-instant) var(--ds-motion-easing-subtle),
      color var(--ds-motion-duration-instant) var(--ds-motion-easing-subtle);
  }

  :is(button, a):hover,
  :is(button, a):focus-visible {
    outline: none;
    background: var(--ds-surface-hover);
  }

  :is(button, a)[data-variant='destructive'] {
    color: var(--ds-foreground-red);
  }

  button:disabled,
  a[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: var(--ds-opacity-50);
  }

  kbd {
    color: var(--ds-foreground-muted);
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-xs);
  }
</style>
