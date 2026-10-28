<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getContext, setContext, tick } from 'svelte';
  import { AesirIcon } from '../aesir-icon/index.js';
  import { AesirKbd } from '../aesir-kbd/index.js';
  import { positionSubmenu } from '../aesir-dropdown/submenu-position.js';
  import type { ContextMenuContext } from './types.js';

  type ContextMenuSubmenuProps = {
    label: string;
    icon?: string;
    shortcut?: string;
    disabled?: boolean;
    children?: Snippet;
  };

  let { label, icon, shortcut, disabled = false, children }: ContextMenuSubmenuProps = $props();
  const menu = getContext<ContextMenuContext>('context-menu');
  const level = getContext<number>('context-menu-submenu-level') ?? 0;
  const submenuId = $props.id();
  let contentRef = $state<HTMLDivElement>();
  const open = $derived(menu?.submenu.openPath[level] === submenuId);

  setContext('context-menu-submenu-level', level + 1);

  const focusFirst = async () => {
    await tick();
    contentRef?.querySelector<HTMLElement>('[role^="menuitem"]:not(:disabled):not([aria-disabled="true"])')?.focus();
  };
  const openSubmenu = (focusContent = false) => {
    menu?.submenu.openImmediately(level, submenuId);
    if (focusContent) focusFirst();
  };
  const onTriggerKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowRight' && event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    openSubmenu(true);
  };
</script>

<div
  class="context-menu-submenu"
  role="presentation"
  onpointerenter={(event) => event.pointerType !== 'touch' && !disabled && menu?.submenu.openFromPointer(event, level, submenuId)}
  onpointerleave={(event) => event.pointerType !== 'touch' && menu?.submenu.scheduleClose(level)}
>
  <button
    type="button"
    class="context-menu-submenu__trigger"
    role="menuitem"
    data-submenu-trigger={submenuId}
    data-submenu-level={level}
    data-shortcut={shortcut || undefined}
    aria-haspopup="menu"
    aria-expanded={open}
    {disabled}
    tabindex="-1"
    onclick={(event) => openSubmenu(event.detail === 0)}
    onpointerenter={(event) => event.pointerType !== 'touch' && !disabled && menu?.submenu.openFromPointer(event, level, submenuId)}
    onkeydown={onTriggerKeydown}
  >
    <span class="context-menu-submenu__label">
      {#if icon}<AesirIcon name={icon} size={15} />{/if}
      <span>{label}</span>
    </span>
    {#if shortcut}<AesirKbd class="context-menu-submenu__shortcut" small aria-hidden="true">{shortcut}</AesirKbd>{/if}
    <AesirIcon name="chevron-right" size={14} class="context-menu-submenu__arrow" />
  </button>
  {#if open}
    <div
      bind:this={contentRef}
      use:positionSubmenu
      class="context-menu-submenu__content"
      data-submenu-level={level}
      data-menu-level={level + 1}
      role="menu"
      aria-label={label}
      tabindex="-1"
      onpointerenter={(event) => event.pointerType !== 'touch' && menu?.submenu.openFromPointer(event, level, submenuId)}
    >
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .context-menu-submenu {
    position: relative;
  }

  .context-menu-submenu__trigger {
    display: grid;
    width: 100%;
    align-items: center;
    grid-template-columns: minmax(0, 1fr) auto var(--ds-spacing-4);
    gap: var(--ds-spacing-4);
    padding: var(--ds-spacing-2) var(--ds-spacing-3);
    border: 0;
    border-radius: var(--ds-radius-md);
    background: transparent;
    color: var(--ds-foreground);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      background-color var(--ds-motion-duration-instant) var(--ds-motion-easing-subtle),
      color var(--ds-motion-duration-instant) var(--ds-motion-easing-subtle);
  }

  .context-menu-submenu__trigger:hover,
  .context-menu-submenu__trigger:focus-visible,
  .context-menu-submenu__trigger[aria-expanded='true'] {
    background: var(--ds-surface-hover);
    outline: none;
  }

  .context-menu-submenu__trigger:disabled {
    cursor: not-allowed;
    opacity: var(--ds-opacity-50);
  }

  .context-menu-submenu__label {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-2);
  }

  :global(.context-menu-submenu__shortcut),
  :global(.context-menu-submenu__arrow) {
    flex: none;
  }

  .context-menu-submenu__content {
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
    box-shadow: 0 var(--ds-spacing-2) var(--ds-spacing-6) color-mix(in oklch, var(--ds-fixed-black) 14%, transparent);
    transform-origin: left top;
  }

  .context-menu-submenu__content:global([data-side='left']) {
    right: calc(100% - var(--ds-spacing-px));
    left: auto;
    transform-origin: right top;
  }

  .context-menu-submenu:has(> .context-menu-submenu__content:global([data-side='left'])) > .context-menu-submenu__trigger :global(.context-menu-submenu__arrow) {
    transform: rotate(180deg);
  }
</style>
