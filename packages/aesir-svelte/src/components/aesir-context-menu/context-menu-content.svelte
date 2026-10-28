<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes, MouseEventHandler } from 'svelte/elements';
  import { getContext, onDestroy, setContext, tick } from 'svelte';
  import { matchesShortcut } from '../keyboard/shortcut.js';
  import ContextMenuPortal from './context-menu-portal.svelte';
  import type { ContextMenuContext } from './types.js';

  type ContextMenuContentProps = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'onclick' | 'style'> & {
    ref?: HTMLDivElement;
    class?: string;
    style?: string;
    onclick?: MouseEventHandler<HTMLDivElement>;
    children?: Snippet;
    portalProps?: HTMLAttributes<HTMLDivElement>;
  };

  let { ref = $bindable(), class: className, style: contentStyle, onclick, children, portalProps, ...restProps }: ContextMenuContentProps = $props();
  const menu = getContext<ContextMenuContext>('context-menu');
  let localRef = $state<HTMLDivElement>();
  let style = $state('');
  let typeahead = '';
  let typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

  setContext('context-menu-submenu-level', 0);
  onDestroy(() => clearTimeout(typeaheadTimer));

  $effect(() => {
    ref = localRef;
    menu?.setContent?.(localRef);
    return () => menu?.setContent?.(undefined);
  });

  const isOpen = $derived.by(() => menu?.getOpen?.() ?? false);

  const onMenuClick: MouseEventHandler<HTMLDivElement> = (event) => {
    onclick?.(event);
    const item = (event.target as Element).closest<HTMLElement>('[role^="menuitem"]');
    if (item && item.getAttribute('aria-haspopup') !== 'menu' && item.getAttribute('aria-disabled') !== 'true' && !item.matches(':disabled')) {
      menu?.setOpen?.(false, { restoreFocus: true });
    }
  };

  const menuItems = (container: ParentNode | undefined = localRef) =>
    [...(container?.querySelectorAll<HTMLElement>(':is([role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]):not(:disabled):not([aria-disabled="true"])') ?? [])].filter(
      (item) => item.closest('[role="menu"]') === container
    );
  const focusItem = (index: number, container: ParentNode | undefined = localRef) => {
    const items = menuItems(container);
    if (!items.length) return;
    items[(index + items.length) % items.length]?.focus();
  };

  const onMenuKeydown = (event: KeyboardEvent) => {
    const shortcutItem = [...(localRef?.querySelectorAll<HTMLElement>('[data-shortcut]:not(:disabled)') ?? [])].find((item) =>
      matchesShortcut(event, item.dataset.shortcut, { allowUnmodified: true })
    );
    if (shortcutItem) {
      event.preventDefault();
      shortcutItem.click();
      return;
    }
    const target = event.target as HTMLElement;
    const activeMenu = target.closest<HTMLElement>('[role="menu"]') ?? localRef;
    const items = menuItems(activeMenu);
    const current = items.indexOf(((localRef?.getRootNode() as Document | ShadowRoot | undefined)?.activeElement ?? document.activeElement) as HTMLElement);
    const submenuTrigger = target.closest<HTMLElement>('[data-submenu-trigger]');

    if (event.key === 'Tab' && menu?.getModal()) {
      event.preventDefault();
    } else if (event.key === 'ArrowRight' && submenuTrigger) {
      event.preventDefault();
      const level = Number(submenuTrigger.dataset.submenuLevel);
      menu?.submenu.openImmediately(level, submenuTrigger.dataset.submenuTrigger);
      requestAnimationFrame(() => focusItem(0, submenuTrigger.nextElementSibling ?? undefined));
    } else if (event.key === 'ArrowLeft' && activeMenu !== localRef) {
      event.preventDefault();
      event.stopPropagation();
      const trigger = activeMenu?.previousElementSibling as HTMLElement | null;
      menu?.submenu.closeFrom(Number(activeMenu?.dataset.menuLevel) - 1);
      requestAnimationFrame(() => trigger?.focus());
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem(current + 1, activeMenu);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem(current - 1, activeMenu);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusItem(0, activeMenu);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusItem(items.length - 1, activeMenu);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (activeMenu !== localRef) {
        const trigger = activeMenu?.previousElementSibling as HTMLElement | null;
        menu?.submenu.closeFrom(Number(activeMenu?.dataset.menuLevel) - 1);
        requestAnimationFrame(() => trigger?.focus());
      } else menu?.setOpen?.(false, { restoreFocus: true });
    } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      typeahead += event.key.toLocaleLowerCase();
      clearTimeout(typeaheadTimer);
      typeaheadTimer = setTimeout(() => (typeahead = ''), 500);
      const start = Math.max(current + 1, 0);
      const match = [...items.slice(start), ...items.slice(0, start)].find((item) => item.textContent?.trim().toLocaleLowerCase().startsWith(typeahead));
      if (match) {
        event.preventDefault();
        match.focus();
      }
    }
  };

  $effect(() => {
    if (!isOpen) return;
    const position = menu?.getPosition?.();
    if (!position) return;

    tick().then(() => {
      if (!localRef) return;
      const gutter = 8;
      const rect = localRef.getBoundingClientRect();
      const left = Math.min(Math.max(position.x, gutter), Math.max(window.innerWidth - rect.width - gutter, gutter));
      const top = Math.min(Math.max(position.y, gutter), Math.max(window.innerHeight - rect.height - gutter, gutter));
      style = `top: ${top}px; left: ${left}px;`;
      focusItem(0);
    });
  });
</script>

{#if isOpen}
  <ContextMenuPortal {...portalProps}>
    <div
      bind:this={localRef}
      data-slot="context-menu-content"
      role="menu"
      tabindex="-1"
      style={`${style}${contentStyle ?? ''}`}
      class={`context-menu-content ${className ?? ''}`.trim()}
      onclick={onMenuClick}
      onkeydown={onMenuKeydown}
      onpointermove={(event) => menu?.submenu.trackPointer(event)}
      {...restProps}
    >
      {@render children?.()}
    </div>
  </ContextMenuPortal>
{/if}

<style>
  .context-menu-content {
    position: fixed;
    z-index: var(--aesir-overlay-z-popover, 50);
    display: grid;
    width: max-content;
    min-width: var(--ds-spacing-48);
    max-width: calc(100vw - var(--ds-spacing-4));
    max-height: calc(100dvh - var(--ds-spacing-4));
    overflow-y: auto;
    padding: var(--ds-spacing-1-5);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background-secondary);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
    box-shadow: 0 var(--ds-spacing-2) var(--ds-spacing-6) color-mix(in oklch, var(--ds-fixed-black) 14%, transparent);
    outline: none;
  }

  .context-menu-content:has(> :global(.context-menu-submenu)) {
    max-height: none;
    overflow: visible;
  }
</style>
