<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { tick } from 'svelte';
  import { AesirIcon } from '../aesir-icon/index.js';
  import { isEditableTarget, isReservedShortcut, matchesShortcut } from '../keyboard/shortcut.js';
  import { autoUpdateAnchoredPosition, portal, registerDismissableOverlay } from '../overlay/overlay.js';
  import { listenShared } from '../../utils/shared-event.js';
  type MenuValue = string | null;
  type MenubarItem = {
    label: string;
    value?: string;
    icon?: string;
    role?: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';
    checked?: boolean;
    disabled?: boolean;
    variant?: 'default' | 'destructive';
    shortcut?: string | string[];
    action?: (item: MenubarItem) => void;
  };
  type MenubarMenu = {
    label: string;
    value?: string;
    disabled?: boolean;
    items?: MenubarItem[];
  };
  type MenubarProps = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'onselect'> & {
    menus?: MenubarMenu[];
    value?: MenuValue;
    label?: string;
    onselect?: (item: MenubarItem) => void;
    class?: string;
  };

  let { menus = [], value = $bindable(null), label = 'Application menu', onselect, class: className, ...restProps }: MenubarProps = $props();
  let root = $state<HTMLDivElement>();
  let content = $state<HTMLDivElement>();
  let position = $state('');
  let focusedValue = $state<string | null>(null);
  let hoverOpenedMenu: string | null = null;
  const rovingValue = $derived.by(() => {
    const enabled = menus.filter((menu) => !menu.disabled);
    if (enabled.some((menu) => (menu.value ?? menu.label) === focusedValue)) return focusedValue;
    if (enabled.some((menu) => (menu.value ?? menu.label) === value)) return value;
    return enabled[0]?.value ?? enabled[0]?.label ?? null;
  });
  const activeAnchor = $derived.by(() => {
    if (!root || !value || !menus.some((menu) => (menu.value ?? menu.label) === value)) return undefined;
    return [...root.querySelectorAll<HTMLButtonElement>('.menubar__trigger')].find((trigger) => trigger.dataset.menuValue === value);
  });
  const close = () => {
    hoverOpenedMenu = null;
    value = null;
  };
  const triggers = () => [...(root?.querySelectorAll<HTMLButtonElement>('.menubar__trigger:not(:disabled)') ?? [])];
  const items = () => [...(content?.querySelectorAll<HTMLButtonElement>(':is([role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]):not(:disabled)') ?? [])];
  const openMenu = (menuValue: string) => {
    const openedByHover = hoverOpenedMenu === menuValue && value === menuValue;
    hoverOpenedMenu = null;
    if (!openedByHover) value = value === menuValue ? null : menuValue;
  };
  const move = (event: KeyboardEvent & { currentTarget: HTMLButtonElement }, delta: number) => {
    event.preventDefault();
    const all = triggers();
    const next = (all.indexOf(event.currentTarget) + delta + all.length) % all.length;
    const nextTrigger = all[next];
    nextTrigger?.focus();
    if (value && nextTrigger) value = nextTrigger.dataset.menuValue ?? null;
  };
  const choose = (item: MenubarItem, { restoreFocus = true }: { restoreFocus?: boolean } = {}) => {
    if (!item.disabled) {
      const trigger = activeAnchor;
      item.action?.(item);
      onselect?.(item);
      close();
      if (restoreFocus) trigger?.focus();
    }
  };
  const onContentKeydown = (event: KeyboardEvent) => {
    const all = items();
    const current = all.indexOf(((content?.getRootNode() as Document | ShadowRoot | undefined)?.activeElement ?? document.activeElement) as HTMLButtonElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const start = current < 0 ? (direction > 0 ? -1 : 0) : current;
      all[(start + direction + all.length) % all.length]?.focus();
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const allTriggers = triggers();
      const currentTrigger = activeAnchor ? allTriggers.indexOf(activeAnchor) : -1;
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextTrigger = allTriggers[(currentTrigger + direction + allTriggers.length) % allTriggers.length];
      if (nextTrigger) value = nextTrigger.dataset.menuValue ?? null;
    }
    if (event.key === 'Tab') close();
  };
  $effect(() => {
    if (!value || !activeAnchor || !content) return;
    const activeContent = content;
    const activeValue = value;
    const stop = autoUpdateAnchoredPosition(activeAnchor, content, {}, (next: { style: string }) => (position = next.style));
    void tick().then(() => {
      if (value === activeValue && content === activeContent) items()[0]?.focus();
    });
    return stop;
  });
  $effect(() => {
    if (!value || !root) return;
    return registerDismissableOverlay(root.ownerDocument, {
      branches: () => [root, content],
      exclusive: true,
      onDismiss: (reason: string) => {
        const trigger = activeAnchor;
        close();
        if (reason === 'escape') trigger?.focus();
      }
    });
  });
  $effect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      const item = menus.flatMap((menu) => menu.items ?? []).find((candidate) => !candidate.disabled && matchesShortcut(event, candidate.shortcut));
      if (!item) return;
      event.preventDefault();
      choose(item, { restoreFocus: false });
    };
    return listenShared(document, 'keydown', onShortcut);
  });
</script>

<div bind:this={root} class={`menubar ${className ?? ''}`.trim()} role="menubar" aria-label={label} {...restProps}>
  {#each menus as menu (menu.value ?? menu.label)}
    {@const menuValue = menu.value ?? menu.label}
    <button
      class="menubar__trigger"
      type="button"
      role="menuitem"
      aria-haspopup="menu"
      aria-expanded={value === menuValue}
      tabindex={menu.disabled || rovingValue !== menuValue ? -1 : 0}
      data-menu-value={menuValue}
      disabled={menu.disabled}
      onfocus={() => (focusedValue = menuValue)}
      onclick={() => openMenu(menuValue)}
      onpointerenter={(event) => {
        if (event.pointerType === 'mouse' && value && value !== menuValue && !menu.disabled) {
          hoverOpenedMenu = menuValue;
          value = menuValue;
        }
      }}
      onpointerleave={() => {
        if (hoverOpenedMenu === menuValue) hoverOpenedMenu = null;
      }}
      onkeydown={(event) => {
        if (event.key === 'ArrowRight') move(event, 1);
        if (event.key === 'ArrowLeft') move(event, -1);
        if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault();
          const all = triggers();
          const target = event.key === 'Home' ? all[0] : all[all.length - 1];
          target?.focus();
          if (value && target) value = target.dataset.menuValue ?? null;
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          value = menuValue;
        }
      }}
    >
      {menu.label}
    </button>
  {/each}
</div>
{#if value}
  {@const activeMenu = menus.find((menu) => (menu.value ?? menu.label) === value)}
  {#if activeMenu}
    {@const hasIndicators = activeMenu.items?.some((item) => item.icon || item.role === 'menuitemcheckbox' || item.role === 'menuitemradio')}
    <div use:portal bind:this={content} class="menubar__content aesir-overlay-motion" data-motion="popover" data-state="open" role="menu" tabindex="-1" style={position} onkeydown={onContentKeydown}>
      {#each activeMenu.items ?? [] as item, index (item.value ?? item.label ?? index)}
        {@const itemRole = item.role ?? 'menuitem'}
        <button
          type="button"
          role={itemRole}
          aria-checked={itemRole === 'menuitemcheckbox' || itemRole === 'menuitemradio' ? item.checked : undefined}
          disabled={item.disabled}
          data-variant={item.variant}
          onclick={() => choose(item)}
        >
          {#if hasIndicators}<span class="menubar__icon">
              {#if itemRole === 'menuitemcheckbox' || itemRole === 'menuitemradio'}{#if item.checked}<AesirIcon name="check" size={15} />{/if}{:else if item.icon}<AesirIcon
                  name={item.icon}
                  size={15}
                />{/if}
            </span>{/if}
          <span>{item.label}</span>
          {#if item.shortcut && !isReservedShortcut(item.shortcut)}<kbd>{item.shortcut}</kbd>{/if}
        </button>
      {/each}
    </div>
  {/if}
{/if}

<style>
  .menubar {
    display: flex;
    width: fit-content;
    gap: var(--ds-spacing-1);
    padding: var(--ds-spacing-1);
    border: 1px solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background);
  }
  .menubar__trigger,
  :global(.menubar__content button) {
    border: 0;
    background: transparent;
    color: var(--ds-foreground);
    font-family: inherit;
    font-size: var(--ds-font-size-sm);
    cursor: pointer;
  }
  .menubar__trigger {
    height: var(--ds-spacing-8);
    padding: 0 var(--ds-spacing-2-5);
    border-radius: var(--ds-radius-md);
  }
  .menubar__trigger:hover,
  .menubar__trigger[aria-expanded='true'],
  :global(.menubar__content button:hover),
  :global(.menubar__content button:focus-visible) {
    background: var(--ds-surface);
    outline: none;
  }
  :global(.menubar__content) {
    position: fixed;
    z-index: var(--aesir-overlay-z-popover, 50);
    box-sizing: border-box;
    width: max-content;
    min-width: var(--ds-spacing-48);
    max-width: none;
    padding: var(--ds-spacing-1-5);
    border: 1px solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background-secondary);
    box-shadow: 0 var(--ds-spacing-2) var(--ds-spacing-6) color-mix(in oklch, var(--ds-fixed-black) 14%, transparent);
    overflow-y: auto;
  }
  :global(.menubar__content button) {
    box-sizing: border-box;
    display: flex;
    width: 100%;
    min-height: var(--ds-spacing-8);
    align-items: center;
    gap: var(--ds-spacing-2);
    padding: var(--ds-spacing-1) var(--ds-spacing-2-5);
    border-radius: var(--ds-radius-md);
    text-align: left;
    white-space: normal;
  }
  :global(.menubar__content button > span:not(.menubar__icon)) {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  :global(.menubar__content button:disabled) {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .menubar__trigger:disabled {
    cursor: not-allowed;
  }
  :global(.menubar__content button[data-variant='destructive']) {
    color: var(--ds-foreground-muted-red);
  }
  :global(.menubar__icon) {
    display: grid;
    width: var(--ds-spacing-4);
    flex: none;
    place-items: center;
  }
  :global(.menubar__content kbd) {
    margin-left: auto;
    color: var(--ds-foreground-muted);
    font: inherit;
    font-size: var(--ds-font-size-xs);
  }
</style>
