<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { onDestroy } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { autoUpdateOverlayPosition, getFixedPositionOffset, getFocusableElements, portal, registerDismissableOverlay } from '../overlay/overlay.js';
  import { createPresence } from '../overlay/presence.svelte.js';
  import { matchesShortcut } from '../keyboard/shortcut.js';
  import AesirButton from '../aesir-button/aesir-button.svelte';
  import AesirIcon from '../aesir-icon/aesir-icon.svelte';
  import AesirScrollArea from '../aesir-scroll-area/aesir-scroll-area.svelte';
  import AesirDropdownMenu from './aesir-dropdown-menu.svelte';
  import { SubmenuController } from './submenu-controller.svelte.js';
  import type { DropdownCloseOptions, DropdownItem, DropdownItemContent, DropdownOpenOptions, DropdownSubmenuController, DropdownTriggerProps } from './types.js';

  type DropdownProps = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'onselect' | 'style'> & {
    class?: string;
    style?: string;
    contentClass?: string;
    contentStyle?: string;
    items?: DropdownItem[];
    open?: boolean;
    modal?: boolean;
    placement?: 'top' | 'bottom';
    align?: 'start' | 'center' | 'end';
    anchorElement?: HTMLElement;
    focusElement?: HTMLElement;
    contentKey?: string | number;
    contentDirection?: number;
    openOnHover?: boolean;
    openDelay?: number;
    closeDelay?: number;
    hoverFromTrigger?: boolean;
    offset?: number;
    matchTriggerWidth?: boolean;
    matchViewportWidth?: boolean;
    mobileLayout?: 'compact' | 'full';
    mobileBreakpoint?: number;
    label?: string;
    error?: boolean;
    closeOnSelect?: boolean;
    onselect?: (item: DropdownItem) => void;
    trigger?: Snippet<[DropdownTriggerProps]>;
    itemContent?: DropdownItemContent;
  };

  let {
    class: className = '',
    style: rootStyle,
    contentClass = '',
    contentStyle,
    items = [],
    open = $bindable(false),
    modal = true,
    placement = 'bottom',
    align = 'start',
    anchorElement,
    focusElement,
    contentKey,
    contentDirection = 1,
    openOnHover = false,
    openDelay = 90,
    closeDelay = 160,
    hoverFromTrigger = true,
    offset = 8,
    matchTriggerWidth = false,
    matchViewportWidth = false,
    mobileLayout = 'compact',
    mobileBreakpoint = 640,
    label = 'Dropdown menu',
    error = false,
    closeOnSelect = true,
    onselect,
    trigger,
    itemContent,
    ...restProps
  }: DropdownProps = $props();
  let triggerRef = $state<HTMLSpanElement>();
  let menuRef = $state<HTMLDivElement>();
  let instant = $state(false);
  let position = $state('');
  let resolvedPlacement = $state('bottom');
  let contentHeight = $state<number>();
  let mobile = $state(false);
  let mobileDirection = $state(1);
  let mobileNavigating = $state(false);
  const submenu: DropdownSubmenuController = new SubmenuController(() => menuRef);
  const mobileItems = $derived(submenu.openPath.reduce((entries, value) => entries.find((item) => item.value === value)?.items ?? entries, items));
  const mobileParent = $derived(
    submenu.openPath
      .slice(0, -1)
      .reduce((entries, value) => entries.find((item) => item.value === value)?.items ?? entries, items)
      .find((item) => item.value === submenu.openPath.at(-1))
  );
  const measureContent = (node: HTMLElement) => {
    const observer = new ResizeObserver(() => {
      if (!node.inert) contentHeight = node.offsetHeight;
    });
    observer.observe(node);
    return { destroy: () => observer.disconnect() };
  };
  const presence = createPresence(() => open, 180);
  let hoverTimer: ReturnType<typeof setTimeout> | undefined;
  let pathResetTimer: ReturnType<typeof setTimeout> | undefined;
  let typeaheadTimer: ReturnType<typeof setTimeout> | undefined;
  let typeahead = '';
  let focusLastOnOpen = false;
  let hoverOpened = false;
  const enter = (event: PointerEvent) => {
    if (mobile || !openOnHover || event.pointerType !== 'mouse') return;
    clearTimeout(hoverTimer);
    instant = false;
    if (open) return;
    hoverTimer = setTimeout(() => {
      clearTimeout(pathResetTimer);
      submenu.reset();
      hoverOpened = true;
      instant = false;
      open = true;
    }, openDelay);
  };
  const leave = (event: PointerEvent) => {
    if (mobile || !openOnHover || event.pointerType !== 'mouse') return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      const activeElement = (menuRef?.getRootNode() as Document | ShadowRoot | undefined)?.activeElement;
      if (!menuRef?.contains(activeElement ?? null)) close();
    }, closeDelay);
  };

  const menuItems = (menu: ParentNode | undefined = menuRef) =>
    [...(menu?.querySelectorAll<HTMLElement>(':is([role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]):not(:disabled):not([aria-disabled="true"])') ?? [])].filter(
      (element) => !element.closest('[inert]') && element.closest('[role="menu"]') === menu
    );
  const contentTransition = (_node: Element, _params: unknown, { direction }: { direction: 'in' | 'out' | 'both' }) => {
    if (instant || (mobile ? !mobileNavigating : contentKey === undefined) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return { duration: 0 };
    const entering = direction === 'in';
    const transitionDirection = mobile ? mobileDirection : contentDirection;
    const distance = transitionDirection * (entering ? 16 : -16);
    return {
      duration: transitionDirection ? (entering ? 160 : 110) : entering ? 140 : 90,
      easing: cubicOut,
      css: (t: number, u: number) => `opacity:${t};transform:translateX(${u * distance}px);${entering ? '' : 'position:absolute;inset:0 0 auto;pointer-events:none;'}`
    };
  };
  const focusItem = (index: number, menu: ParentNode | undefined = menuRef) => {
    const elements = menuItems(menu);
    if (!elements.length) return;
    elements[(index + elements.length) % elements.length]?.focus();
  };
  const focusInitialItem = (menu: ParentNode | undefined = menuRef) => {
    const elements = menuItems(menu);
    const checkedIndex = elements.findIndex((element) => element.getAttribute('aria-checked') === 'true');
    focusItem(checkedIndex >= 0 ? checkedIndex : 0, menu);
  };
  const close = ({ restoreFocus = false, skipMotion = false }: DropdownCloseOptions = {}) => {
    clearTimeout(hoverTimer);
    clearTimeout(pathResetTimer);
    clearTimeout(typeaheadTimer);
    typeahead = '';
    submenu.reset({ preservePath: true });
    instant = skipMotion;
    open = false;
    pathResetTimer = setTimeout(() => !open && submenu.reset(), 180);
    if (restoreFocus) queueMicrotask(() => (focusElement ?? (triggerRef ? getFocusableElements(triggerRef)[0] : undefined))?.focus());
  };
  const updatePosition = () => {
    if (!triggerRef || !menuRef) return;
    const anchor = (anchorElement ?? triggerRef).getBoundingClientRect();
    const mobileFull = mobile && mobileLayout === 'full';
    const mobileCompact = mobile && !mobileFull && !matchTriggerWidth && !matchViewportWidth;
    const viewportGutter = mobileCompact ? 8 : anchorElement || matchViewportWidth ? 0 : 8;
    const viewportWidth = document.documentElement.clientWidth;
    const availableWidth = Math.max(viewportWidth - viewportGutter * 2, 0);
    if (!mobileFull && !matchTriggerWidth && !matchViewportWidth) {
      menuRef.style.removeProperty('width');
      menuRef.style.removeProperty('min-width');
    }
    const requestedWidth = mobileFull ? availableWidth : matchViewportWidth ? viewportWidth : matchTriggerWidth ? anchor.width : menuRef.offsetWidth;
    const menuWidth = Math.min(requestedWidth, availableWidth);
    if (mobileFull || matchTriggerWidth || matchViewportWidth) menuRef.style.width = `${menuWidth}px`;
    // Measure the preferred height without the previous anchor-space constraint.
    menuRef.style.setProperty('--aesir-dropdown-available-height', `${Math.max(window.innerHeight - viewportGutter * 2, 0)}px`);
    const preferredHeight = menuRef.offsetHeight;
    const containingBlock = getFixedPositionOffset(menuRef);
    const spaceAbove = Math.max(anchor.top - offset - viewportGutter, 0);
    const spaceBelow = Math.max(window.innerHeight - anchor.bottom - offset - viewportGutter, 0);
    const preferredSpace = placement === 'top' ? spaceAbove : spaceBelow;
    const oppositeSpace = placement === 'top' ? spaceBelow : spaceAbove;
    resolvedPlacement = preferredHeight > preferredSpace && oppositeSpace > preferredSpace ? (placement === 'top' ? 'bottom' : 'top') : placement;
    const availableHeight = resolvedPlacement === 'top' ? spaceAbove : spaceBelow;
    menuRef.style.setProperty('--aesir-dropdown-available-height', `${availableHeight}px`);
    const menuHeight = menuRef.offsetHeight;
    const viewportTop = resolvedPlacement === 'top' ? anchor.top - menuHeight - offset : anchor.bottom + offset;
    const maxViewportLeft = Math.max(viewportWidth - menuWidth - viewportGutter, viewportGutter);
    const alignedLeft = align === 'start' ? anchor.left : align === 'center' ? anchor.left + (anchor.width - menuWidth) / 2 : anchor.right - menuWidth;
    const viewportLeft = mobileFull ? viewportGutter : Math.min(Math.max(alignedLeft, viewportGutter), maxViewportLeft);
    const top = viewportTop - containingBlock.top;
    const left = viewportLeft - containingBlock.left;
    const originX = Math.min(Math.max(anchor.left + anchor.width / 2 - viewportLeft, 0), menuWidth);
    const originY = resolvedPlacement === 'top' ? menuHeight : 0;
    const widthConstraints = mobileFull || matchTriggerWidth || matchViewportWidth ? `width: ${menuWidth}px; min-width: ${menuWidth}px;` : `min-width: min(var(--ds-spacing-48), ${availableWidth}px);`;
    position = `top: ${top}px; left: ${left}px; max-width: ${availableWidth}px; ${widthConstraints} --aesir-dropdown-available-height: ${availableHeight}px; --aesir-overlay-transform-origin: ${originX}px ${originY}px;`;
  };
  const openMenu = ({ skipMotion = false }: DropdownOpenOptions = {}) => {
    clearTimeout(hoverTimer);
    clearTimeout(pathResetTimer);
    submenu.reset();
    hoverOpened = false;
    instant = skipMotion;
    mobileNavigating = false;
    contentHeight = undefined;
    focusLastOnOpen = false;
    open = true;
  };
  const onTriggerKeydown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openMenu({ skipMotion: true });
      focusLastOnOpen = event.key === 'ArrowUp';
    }
  };
  const selectItem = (item: DropdownItem, { skipMotion = false }: DropdownOpenOptions = {}) => {
    if (item.items?.length) return;
    item.action?.(item);
    onselect?.(item);
    if (closeOnSelect) close({ restoreFocus: true, skipMotion });
  };
  const openSubmenu = (item: DropdownItem, level: number, event?: MouseEvent) => {
    if (event) instant = event.detail === 0;
    mobileNavigating = true;
    mobileDirection = 1;
    submenu.openImmediately(level, item.value);
  };
  const back = (event?: MouseEvent) => {
    if (event) instant = event.detail === 0;
    mobileNavigating = true;
    mobileDirection = -1;
    submenu.closeFrom(submenu.openPath.length - 1);
    requestAnimationFrame(() => focusInitialItem());
  };
  const actionableItems = (entries: DropdownItem[]): DropdownItem[] => entries.flatMap((item) => (item.items?.length ? actionableItems(item.items) : item.type ? [] : [item]));
  const containsSubmenus = (entries: DropdownItem[]) => entries.some((item) => item.items?.length);
  const onMenuKeydown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const activeMenu = target.closest<HTMLElement>('[role="menu"]') ?? menuRef;
    if (!activeMenu) return;
    const elements = menuItems(activeMenu);
    const current = elements.indexOf(((menuRef?.getRootNode() as Document | ShadowRoot | undefined)?.activeElement ?? document.activeElement) as HTMLElement);
    const submenuTrigger = target.closest<HTMLElement>('[data-submenu-trigger]');
    if (event.key === 'ArrowRight' && submenuTrigger) {
      event.preventDefault();
      const level = Number(submenuTrigger.dataset.submenuLevel);
      if (mobile) {
        instant = true;
        openSubmenu({ value: submenuTrigger.dataset.submenuTrigger }, level);
        requestAnimationFrame(() => focusInitialItem());
      } else {
        submenu.openImmediately(level, submenuTrigger.dataset.submenuTrigger);
        requestAnimationFrame(() => focusInitialItem(submenuTrigger.nextElementSibling ?? undefined));
      }
    } else if (mobile && submenu.openPath.length && (event.key === 'ArrowLeft' || event.key === 'Escape')) {
      event.preventDefault();
      event.stopPropagation();
      instant = true;
      back();
    } else if (event.key === 'ArrowLeft' && activeMenu !== menuRef) {
      event.preventDefault();
      event.stopPropagation();
      const parent = activeMenu.previousElementSibling as HTMLElement | null;
      submenu.closeFrom(Number(activeMenu.dataset.menuLevel) - 1);
      requestAnimationFrame(() => parent?.focus());
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
      focusItem(elements.length - 1, activeMenu);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (activeMenu !== menuRef) {
        const parent = activeMenu.previousElementSibling as HTMLElement | null;
        submenu.closeFrom(Number(activeMenu.dataset.menuLevel) - 1);
        requestAnimationFrame(() => parent?.focus());
      } else close({ restoreFocus: true, skipMotion: true });
    } else if (event.key === 'Tab') {
      event.preventDefault();
      if (modal) return;
      const focusTarget = focusElement ?? (triggerRef ? getFocusableElements(triggerRef)[0] : undefined);
      const focusable = getFocusableElements(triggerRef?.ownerDocument.body ?? document.body).filter((element) => !menuRef?.contains(element));
      const triggerIndex = focusTarget ? focusable.indexOf(focusTarget) : -1;
      const nextIndex = event.shiftKey ? triggerIndex - 1 : triggerIndex + 1;
      close({ skipMotion: true });
      focusable[nextIndex]?.focus();
    } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      typeahead += event.key.toLocaleLowerCase();
      clearTimeout(typeaheadTimer);
      typeaheadTimer = setTimeout(() => (typeahead = ''), 500);
      const start = Math.max(current + 1, 0);
      const match = [...elements.slice(start), ...elements.slice(0, start)].find((element) => element.textContent?.trim().toLocaleLowerCase().startsWith(typeahead));
      if (match) {
        event.preventDefault();
        match.focus();
      }
    }
  };

  $effect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      updatePosition();
      if (!hoverOpened) {
        if (focusLastOnOpen) focusItem(-1);
        else focusInitialItem();
      }
    });
    return () => cancelAnimationFrame(frame);
  });

  $effect(() => {
    const key = contentKey;
    if (key === undefined || !open) return;
    const frame = requestAnimationFrame(() => {
      updatePosition();
    });
    return () => cancelAnimationFrame(frame);
  });

  $effect(() => {
    if (!open || !triggerRef || !menuRef) return;
    const anchor = anchorElement ?? triggerRef;
    return autoUpdateOverlayPosition(anchor, menuRef, () => {
      if (!anchor.getBoundingClientRect().width) close({ skipMotion: true });
      else updatePosition();
    });
  });

  $effect(() => {
    const mobileQuery = matchMedia(`(max-width: ${mobileBreakpoint}px), (pointer: coarse)`);
    const updateMobile = () => (mobile = mobileQuery.matches);
    updateMobile();
    mobileQuery.addEventListener('change', updateMobile);
    return () => mobileQuery.removeEventListener('change', updateMobile);
  });

  $effect(() => {
    if (!open || !triggerRef || !menuRef) return;
    return registerDismissableOverlay(triggerRef.ownerDocument, {
      branches: () => (modal ? [menuRef] : [triggerRef, menuRef]),
      exclusive: true,
      modal,
      onDismiss: (reason: string) => close({ restoreFocus: reason === 'escape' || (modal && reason === 'pointerdown'), skipMotion: reason === 'escape' })
    });
  });

  $effect(() => {
    if (!open || !triggerRef) return;
    const onKeydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const item = actionableItems(items).find((candidate) => !candidate.disabled && matchesShortcut(event, candidate.shortcut, { allowUnmodified: true }));
      if (item) {
        event.preventDefault();
        selectItem(item, { skipMotion: true });
      }
    };
    const ownerDocument = triggerRef.ownerDocument;
    ownerDocument.addEventListener('keydown', onKeydown);
    return () => ownerDocument.removeEventListener('keydown', onKeydown);
  });

  onDestroy(() => {
    clearTimeout(hoverTimer);
    clearTimeout(pathResetTimer);
    clearTimeout(typeaheadTimer);
    submenu.destroy();
  });
</script>

<span
  class={`aesir-dropdown__anchor ${className}`.trim()}
  part="anchor"
  bind:this={triggerRef}
  style={rootStyle}
  data-invalid={error ? true : undefined}
  onpointerenter={hoverFromTrigger ? enter : undefined}
  onpointerleave={leave}
  {...restProps}
>
  {@render trigger?.({
    onpointerenter: enter,
    onclick: (event) => {
      const skipMotion = event.detail === 0;
      if (open) close({ skipMotion });
      else openMenu({ skipMotion });
    },
    onkeydown: onTriggerKeydown,
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-invalid': error ? true : undefined
  })}
</span>

{#if presence.present}
  <div
    use:portal
    bind:this={menuRef}
    class={`aesir-dropdown aesir-overlay-motion ${contentClass}`.trim()}
    part="content"
    data-instant={instant || undefined}
    data-motion="popover"
    data-placement={resolvedPlacement}
    data-state={presence.state}
    data-menu-level="0"
    data-has-submenus={containsSubmenus(items) || undefined}
    data-scroll-area={!containsSubmenus(items) && contentKey === undefined ? true : undefined}
    data-mobile={mobile || undefined}
    role="menu"
    inert={!open}
    aria-label={label}
    tabindex="-1"
    style={`${position}${contentStyle ?? ''}`}
    onkeydown={onMenuKeydown}
    onpointerenter={enter}
    onpointerleave={leave}
    onpointermove={submenu.trackPointer}
  >
    {#if mobile && containsSubmenus(items)}
      <div class="aesir-dropdown__viewport" style:height={contentHeight !== undefined ? `${contentHeight}px` : undefined}>
        {#each [{ key: submenu.openPath.join('/'), items: mobileItems }] as panel (panel.key)}
          <div
            class="aesir-dropdown__content"
            use:measureContent
            transition:contentTransition
            onintrostart={(event) => {
              event.currentTarget.inert = false;
              contentHeight = event.currentTarget.offsetHeight;
            }}
            onintroend={() => (mobileNavigating = false)}
            onoutrostart={(event) => (event.currentTarget.inert = true)}
          >
            {#if submenu.openPath.length}
              <div class="aesir-dropdown__mobile-header" role="presentation">
                <AesirButton type="button" role="menuitem" variant="ghost" size="icon-lg" class="aesir-dropdown__back" aria-label={`Back from ${mobileParent?.label ?? 'submenu'}`} onclick={back}>
                  <AesirIcon name="chevron-left" size={18} />
                </AesirButton>
                <span class="aesir-dropdown__mobile-title">{mobileParent?.label}</span>
              </div>
              <div class="aesir-dropdown__separator" role="separator"></div>
            {/if}
            <AesirDropdownMenu
              items={panel.items}
              level={submenu.openPath.length}
              {mobile}
              controller={submenu}
              {itemContent}
              onopen={openSubmenu}
              onselect={(item, event) => selectItem(item, { skipMotion: event.detail === 0 })}
            />
          </div>
        {/each}
      </div>
    {:else if contentKey !== undefined}
      <div class="aesir-dropdown__viewport" style:height={contentHeight !== undefined ? `${contentHeight}px` : undefined}>
        {#each [{ key: contentKey, items }] as panel (panel.key)}
          <div
            class="aesir-dropdown__content"
            use:measureContent
            transition:contentTransition
            onintrostart={(event) => {
              event.currentTarget.inert = false;
              contentHeight = event.currentTarget.offsetHeight;
            }}
            onoutrostart={(event) => (event.currentTarget.inert = true)}
          >
            <AesirDropdownMenu items={panel.items} controller={submenu} {itemContent} onselect={(item, event) => selectItem(item, { skipMotion: event.detail === 0 })} />
          </div>
        {/each}
      </div>
    {:else if containsSubmenus(items)}
      <AesirDropdownMenu {items} controller={submenu} {itemContent} onselect={(item, event) => selectItem(item, { skipMotion: event.detail === 0 })} />
    {:else}
      <AesirScrollArea class="aesir-dropdown__scroll-area">
        <AesirDropdownMenu {items} controller={submenu} {itemContent} onselect={(item, event) => selectItem(item, { skipMotion: event.detail === 0 })} />
      </AesirScrollArea>
    {/if}
  </div>
{/if}

<style>
  :global {
    .aesir-dropdown__viewport {
      position: relative;
      min-width: 0;
      grid-column: 1 / -1;
    }
    .aesir-dropdown__content {
      display: grid;
      min-width: 0;
    }
    .aesir-overlay-motion {
      opacity: 1;
      transform: none;
      transition:
        opacity var(--aesir-overlay-motion-duration, var(--ds-motion-duration-fast)) var(--ds-motion-easing-out),
        transform var(--aesir-overlay-motion-duration, var(--ds-motion-duration-fast)) var(--ds-motion-easing-out);
    }

    .aesir-overlay-motion[data-motion='zoom'] {
      --aesir-overlay-start-transform: scale(0.97);
    }

    .aesir-overlay-motion[data-motion='popover'] {
      --aesir-overlay-start-transform: scale(0.97);

      transform-origin: var(--aesir-overlay-transform-origin, center);
    }

    .aesir-overlay-motion[data-motion='tooltip'] {
      --aesir-overlay-start-transform: scale(0.98);

      transform-origin: var(--aesir-overlay-transform-origin, center);
    }

    .aesir-overlay-motion[data-state='closed'] {
      opacity: 0;
      transform: var(--aesir-overlay-start-transform, none);
      transition-duration: var(--aesir-overlay-exit-duration, var(--ds-motion-duration-fast));
      pointer-events: none;
    }

    .aesir-overlay-motion[data-instant] {
      transition: none;
    }

    @starting-style {
      .aesir-overlay-motion {
        opacity: 0;
        transform: var(--aesir-overlay-start-transform, none);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-overlay-motion {
        --aesir-overlay-start-transform: none;

        transition-duration: var(--ds-motion-duration-instant);
        transform: none;
      }
    }

    .aesir-dropdown__anchor {
      display: inline-flex;
    }

    .aesir-dropdown__anchor[data-invalid] > :where(button, [role='button']) {
      border-color: var(--ds-border-red);
      box-shadow: 0 0 0 var(--ds-spacing-px) var(--ds-border-red);
    }

    .aesir-dropdown {
      box-sizing: border-box;
      position: fixed;
      z-index: var(--aesir-overlay-z-popover, 50);
      display: grid;
      grid-auto-rows: max-content;
      min-width: var(--ds-spacing-48);
      max-height: min(var(--aesir-dropdown-max-height, var(--ds-spacing-96)), var(--aesir-dropdown-available-height, calc(100dvh - var(--ds-spacing-4))));
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior-y: contain;
      padding: var(--ds-spacing-1);
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-lg);
      background: var(--ds-background);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-font-line-height-sm);
      --aesir-overlay-motion-duration: var(--ds-motion-duration-moderate);
    }

    .aesir-dropdown[data-mobile] {
      width: min(var(--ds-spacing-72), calc(100dvw - var(--ds-spacing-8)));
      min-width: 0;
      touch-action: manipulation;
    }

    .aesir-dropdown__mobile-header {
      position: relative;
      display: flex;
      min-height: var(--ds-spacing-12);
      align-items: center;
      padding: 0 var(--ds-spacing-1);
    }

    .aesir-dropdown__mobile-header .aesir-dropdown__back {
      width: var(--ds-spacing-10);
      padding: 0;
      color: var(--ds-foreground-muted);
    }

    .aesir-dropdown__mobile-title {
      position: absolute;
      left: 50%;
      max-width: calc(100% - var(--ds-spacing-24));
      overflow: hidden;
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-medium);
      text-overflow: ellipsis;
      transform: translateX(-50%);
      white-space: nowrap;
    }

    .aesir-dropdown :where(button, a) {
      -webkit-user-select: none;
      user-select: none;
    }

    .aesir-dropdown[data-has-submenus] {
      max-height: none;
      overflow: visible;
    }

    .aesir-dropdown[data-scroll-area] {
      overflow: hidden;
    }

    .aesir-dropdown__scroll-area {
      height: auto;
      grid-column: 1 / -1;
      max-height: min(var(--aesir-dropdown-max-height, var(--ds-spacing-96)), var(--aesir-dropdown-available-height, calc(100dvh - var(--ds-spacing-4))));
    }

    .aesir-dropdown__scroll-area [data-slot='scroll-area-viewport'] {
      max-height: inherit;
    }
  }
</style>
