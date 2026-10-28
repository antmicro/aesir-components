<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirAvatar } from '../aesir-avatar/index.js';
  import { AesirButton } from '../aesir-button/index.js';
  import { AesirDropdown } from '../aesir-dropdown/index.js';
  import { AesirIcon } from '../aesir-icon/index.js';
  import { AesirKbd } from '../aesir-kbd/index.js';
  import AesirIconSwap from '../aesir-icon-swap/aesir-icon-swap.svelte';
  import { createPresence } from '../overlay/presence.svelte.js';
  import { registerModalOverlay, trapFocus } from '../overlay/overlay.js';
  import type { DropdownItem } from '../aesir-dropdown/types.js';
  type NavbarItem = DropdownItem & {
    label: string;
    active?: boolean;
    menu?: 'mega' | 'compact';
    eyebrow?: string;
    description?: string;
    cta?: string;
    ariaLabel?: string;
    src?: string;
    icon?: string;
    items?: NavbarItem[];
  };
  type NavbarAvatar = NavbarItem & { fallback?: string; alt?: string; size?: 'default' | 'sm' | 'lg' };
  type NavbarProps = Omit<HTMLAttributes<HTMLElement>, 'class' | 'onselect'> & {
    brand?: NavbarItem;
    items?: NavbarItem[];
    layout?: string;
    variant?: string;
    align?: 'start' | 'center' | 'end';
    menuTrigger?: 'click' | 'hover';
    menuOpenDelay?: number;
    menuCloseDelay?: number;
    brandPosition?: 'start' | 'center';
    searchLabel?: string;
    searchHint?: string;
    onsearch?: () => void;
    mobileOpen?: boolean;
    label?: string;
    avatar?: NavbarAvatar;
    onselect?: (item: DropdownItem) => void;
    onavatarclick?: (event: MouseEvent) => void;
    logo?: Snippet<[{ brand: NavbarItem }]>;
    actions?: Snippet;
    utilities?: Snippet;
    secondary?: Snippet;
    class?: string;
  };
  let {
    brand = { label: 'Aesir', href: '/' },
    items = [],
    layout = 'contained',
    variant = 'default',
    align = 'start',
    menuTrigger = 'click',
    menuOpenDelay = 90,
    menuCloseDelay = 160,
    brandPosition = 'start',
    searchLabel = 'Search…',
    searchHint,
    onsearch,
    mobileOpen = $bindable(false),
    label = 'Main navigation',
    avatar,
    onselect,
    onavatarclick,
    logo,
    actions,
    utilities,
    secondary,
    class: className,
    ...restProps
  }: NavbarProps = $props();
  const select = (item: DropdownItem, { runAction = true }: { runAction?: boolean } = {}) => {
    if (runAction) item.action?.(item);
    onselect?.(item);
    menuOpen = false;
    mobileOpen = false;
  };
  const dropdownItems = (item: NavbarItem) => (item.items ?? []).map((child, index) => ({ ...child, value: child.value ?? child.href ?? `${item.label}-${index}` }));
  const itemKey = (item: NavbarItem, index: number) => item.value ?? item.href ?? item.label ?? String(index);
  const mobileId = $props.id();
  let navRef = $state<HTMLElement>();
  let activeMenuKey = $state<string | null>(null);
  const activeMenu = $derived.by(() => {
    if (activeMenuKey === null) return null;
    const index = items.findIndex((item, itemIndex) => itemKey(item, itemIndex) === activeMenuKey);
    return index < 0 ? null : index;
  });
  let menuOpen = $state(false);
  let activeTrigger = $state<HTMLElement>();
  let menuDirection = $state(1);
  const activateMenu = (index: number, trigger: HTMLElement) => {
    menuDirection = index < (activeMenu ?? 0) ? -1 : 1;
    activeMenuKey = itemKey(items[index], index);
    activeTrigger = trigger;
  };
  const moveDesktopFocus = (event: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return false;
    const links = [...(navRef?.querySelectorAll<HTMLElement>('.navbar__links .navbar__link:not(:disabled):not([aria-disabled="true"])') ?? [])];
    const current = event.currentTarget instanceof HTMLElement ? links.indexOf(event.currentTarget) : -1;
    if (current < 0 || !links.length) return false;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + links.length) % links.length;
    const target = links[next];
    target?.focus();
    if (menuOpen) {
      const itemIndex = Number(target?.dataset.navbarIndex);
      if (target?.matches('button')) activateMenu(itemIndex, target);
      else menuOpen = false;
    }
    return true;
  };
  const mega = $derived(items.some((item) => item.menu === 'mega'));
  const menuItems = $derived(activeMenu == null ? [] : dropdownItems(items[activeMenu]!));
  $effect(() => {
    if (menuOpen && (activeMenu === null || !items[activeMenu]?.items?.length || items[activeMenu]?.disabled)) menuOpen = false;
  });
  let instant = $state(false);
  const mobilePresence = createPresence(() => mobileOpen, 180);
  let mobileHeight = $state('100dvh');
  $effect(() => {
    if (!mobileOpen || !navRef) return;
    const navigation = navRef;
    menuOpen = false;
    const measure = () => {
      mobileHeight = `${Math.max(0, window.innerHeight - navigation.getBoundingClientRect().bottom)}px`;
      if (navigation.clientWidth > 672) mobileOpen = false;
    };
    measure();
    const releaseOverlay = registerModalOverlay(navRef.ownerDocument, {
      onEscape: () => (mobileOpen = false),
      branches: () => [navigation],
      onPointerDownOutside: () => (mobileOpen = false),
      returnFocus: () => navigation.querySelector<HTMLElement>(`[aria-controls="${mobileId}"]`)
    });
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    resizeObserver?.observe(navigation);
    window.addEventListener('resize', measure);
    return () => {
      releaseOverlay();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measure);
    };
  });
</script>

<!-- Consumer-provided href values may target SvelteKit, another router, or an external URL. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#snippet mobileLink(item: NavbarItem)}
  {#if item.href && !item.disabled}
    <a
      class="navbar__mobile-link"
      class:active={item.active}
      href={item.href}
      target={item.target}
      rel={item.rel ?? (item.target === '_blank' ? 'noreferrer' : undefined)}
      aria-current={item.active ? 'page' : undefined}
      onclick={() => select(item)}
    >
      {item.label}
    </a>
  {:else}
    <button class="navbar__mobile-link" type="button" disabled={item.disabled} onclick={() => select(item)}>{item.label}</button>
  {/if}
{/snippet}
{#snippet mobileEntry(item: NavbarItem)}
  {#if item.items?.length && !item.disabled}
    <section class="navbar__mobile-group" aria-label={item.label}>
      <p class="navbar__mobile-heading">{item.label}</p>
      {#each item.items as child, childIndex (itemKey(child, childIndex))}{@render mobileEntry(child)}{/each}
    </section>
  {:else}
    {@render mobileLink(item)}
  {/if}
{/snippet}
<nav bind:this={navRef} class={`navbar ${className ?? ''}`.trim()} data-variant={variant} aria-label={label} {...restProps}>
  <div class="navbar__inner" data-layout={layout} data-align={align} data-brand-position={brandPosition}>
    <a class="navbar__brand" href={brand.href ?? '/'} target={brand.target} rel={brand.rel ?? (brand.target === '_blank' ? 'noreferrer' : undefined)} aria-label={brand.ariaLabel ?? brand.label}>
      {#if logo}{@render logo({ brand })}{:else if brand.src}<img src={brand.src} alt="" />{:else}{#if brand.icon}<span class="navbar__mark"><AesirIcon name={brand.icon} size={18} /></span>{/if}
        <strong>{brand.label}</strong>{/if}
    </a>

    <div class="navbar__links">
      <AesirDropdown
        bind:open={menuOpen}
        modal={false}
        openOnHover={menuTrigger === 'hover'}
        openDelay={menuOpenDelay}
        closeDelay={menuCloseDelay}
        hoverFromTrigger={false}
        anchorElement={mega ? navRef : undefined}
        focusElement={activeTrigger}
        matchViewportWidth={mega}
        offset={mega ? 0 : 8}
        items={menuItems}
        contentKey={activeMenuKey ?? undefined}
        contentDirection={mega ? menuDirection : 0}
        label={activeMenu == null ? 'Navigation' : (items[activeMenu]?.label ?? 'Navigation')}
        contentClass={mega ? 'navbar__mega' : 'navbar__compact'}
        onselect={(selected) => select(selected, { runAction: false })}
        placement="bottom"
        align="start"
      >
        {#snippet trigger(props)}
          {#each items as item, index (itemKey(item, index))}
            {#if item.items?.length}
              <button
                class="navbar__link"
                class:active={item.active || (menuOpen && activeMenu === index)}
                disabled={item.disabled}
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen && activeMenu === index}
                data-navbar-index={index}
                onpointerenter={(event) => {
                  if (item.disabled || menuTrigger !== 'hover' || event.pointerType !== 'mouse') return;
                  activateMenu(index, event.currentTarget);
                  props.onpointerenter(event);
                }}
                onclick={(event) => {
                  const toggle = !menuOpen || activeMenu === index;
                  activateMenu(index, event.currentTarget);
                  if (toggle) props.onclick(event);
                }}
                onkeydown={(event) => {
                  if (moveDesktopFocus(event)) return;
                  activateMenu(index, event.currentTarget);
                  props.onkeydown(event);
                }}
              >
                {item.label}<AesirIcon name="chevron-down" size={14} />
              </button>
            {:else}
              <a
                class="navbar__link"
                class:active={item.active}
                aria-current={item.active ? 'page' : undefined}
                aria-disabled={item.disabled || undefined}
                href={item.disabled ? undefined : item.href}
                target={item.target}
                rel={item.rel ?? (item.target === '_blank' ? 'noreferrer' : undefined)}
                data-navbar-index={index}
                onpointerenter={(event) => {
                  if (menuTrigger === 'hover' && event.pointerType === 'mouse') menuOpen = false;
                }}
                onkeydown={moveDesktopFocus}
                onclick={(event) => {
                  if (item.disabled) event.preventDefault();
                  else select(item);
                }}
              >
                {item.label}
              </a>
            {/if}
          {/each}
        {/snippet}
        {#snippet itemContent({ item: child })}
          <span class="navbar__menu-item">
            {#if child.icon}<span class="navbar__menu-icon"><AesirIcon name={child.icon} size={18} /></span>{/if}
            <span class="navbar__menu-copy">
              {#if child.eyebrow}<small>{child.eyebrow}</small>{/if}
              <strong>{child.label}</strong>
              {#if child.description}<span>{child.description}</span>{/if}
              {#if child.featured}<span class="navbar__feature-cta">{child.cta ?? 'Explore platform'} <AesirIcon name="arrow-right" size={14} /></span>{/if}
            </span>
          </span>
        {/snippet}
      </AesirDropdown>
    </div>

    <div class="navbar__end">
      {#if onsearch}<button class="navbar__search" type="button" aria-label={searchLabel} onclick={onsearch}>
          <AesirIcon name="search" size={16} />
          <span>{searchLabel}</span>
          {#if searchHint}<AesirKbd meta small>{searchHint}</AesirKbd>{/if}
        </button>{/if}
      {#if actions}<div class="navbar__actions">{@render actions()}</div>{/if}
      {#if utilities}{@render utilities()}{/if}
      {#if avatar?.items?.length}
        <AesirDropdown items={dropdownItems(avatar)} label={avatar.label ?? 'Account menu'} onselect={(item) => select(item, { runAction: false })}>
          {#snippet trigger(props)}<button class="navbar__avatar" type="button" aria-label={avatar.label ?? 'Account menu'} {...props}>
              <AesirAvatar src={avatar.src} fallback={avatar.fallback} alt={avatar.alt ?? ''} size={avatar.size ?? 'sm'} />
            </button>{/snippet}
        </AesirDropdown>
      {:else if avatar}<button class="navbar__avatar" type="button" aria-label={avatar.label ?? 'Account menu'} onclick={onavatarclick}>
          <AesirAvatar src={avatar.src} fallback={avatar.fallback} alt={avatar.alt ?? ''} size={avatar.size ?? 'sm'} />
        </button>{/if}
      <AesirButton
        class="navbar__mobile-trigger"
        variant="ghost"
        size="icon"
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={mobileOpen}
        aria-controls={mobileId}
        onclick={(event) => {
          instant = event.detail === 0;
          mobileOpen = !mobileOpen;
        }}
      >
        <AesirIconSwap name="menu" activeName="x" active={mobileOpen} class={instant ? 'navbar__instant-icon' : ''} />
      </AesirButton>
    </div>
  </div>
  {#if secondary}<div class="navbar__secondary">{@render secondary()}</div>{/if}

  {#if mobilePresence.present}
    <div
      use:trapFocus
      class="navbar__mobile"
      id={mobileId}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      tabindex="-1"
      style:height={mobileHeight}
      data-layout={layout}
      data-state={mobilePresence.state}
      data-instant={instant || undefined}
      inert={!mobileOpen}
    >
      {#each items as item, index (item.value ?? item.href ?? item.label ?? index)}
        {@render mobileEntry(item)}
      {/each}
      {#if actions}<div class="navbar__mobile-actions">{@render actions()}</div>{/if}
    </div>
  {/if}
</nav>

<!-- eslint-enable svelte/no-navigation-without-resolve -->

<style>
  .navbar {
    position: relative;
    container-type: inline-size;
    width: 100%;
    border-bottom: 1px solid var(--ds-border);
    background: var(--ds-background);
    color: var(--ds-foreground);
  }
  .navbar__secondary:empty,
  .navbar__actions:empty,
  .navbar__mobile-actions:empty {
    display: none;
  }
  .navbar[data-variant='floating'] {
    width: calc(100% - var(--ds-spacing-8));
    max-width: 64rem;
    margin-inline: auto;
    border: 1px solid var(--ds-border);
    border-radius: var(--ds-radius-xl);
    box-shadow: var(--ds-filter-drop-shadow-sm);
  }
  .navbar__inner[data-align='center'] .navbar__links {
    justify-content: center;
  }
  .navbar__inner[data-brand-position='center'] {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
  }
  .navbar__inner[data-brand-position='center'] .navbar__links {
    grid-column: 1;
    grid-row: 1;
  }
  .navbar__inner[data-brand-position='center'] .navbar__brand {
    grid-column: 2;
    grid-row: 1;
  }
  .navbar__inner[data-brand-position='center'] .navbar__end {
    grid-column: 3;
    grid-row: 1;
  }
  .navbar__secondary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ds-spacing-2);
    border-top: 1px solid var(--ds-border);
    padding: var(--ds-spacing-2) var(--ds-spacing-5);
  }
  .navbar__search {
    width: var(--navbar-search-width, auto);
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
    min-height: var(--ds-spacing-8);
    padding: 0 var(--ds-spacing-3);
    border: 1px solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    background: var(--ds-background-secondary);
    color: var(--ds-foreground-muted);
    font: inherit;
    font-size: var(--ds-font-size-sm);
    white-space: nowrap;
    cursor: pointer;
    transition:
      border-color var(--ds-motion-duration-instant) var(--ds-motion-easing-subtle),
      background-color var(--ds-motion-duration-instant) var(--ds-motion-easing-subtle),
      color var(--ds-motion-duration-instant) var(--ds-motion-easing-subtle);
  }
  .navbar__search:hover {
    border-color: var(--ds-border-hover);
    background: var(--ds-surface-hover);
    color: var(--ds-foreground);
  }
  .navbar__search :global(.aesir-kbd) {
    margin-left: var(--ds-spacing-4);
  }
  .navbar__link:focus-visible,
  .navbar__search:focus-visible,
  .navbar__brand:focus-visible {
    outline: 2px solid var(--ds-accent-ring);
    outline-offset: 3px;
  }
  .navbar__menu-item {
    display: flex;
    align-items: flex-start;
    gap: var(--ds-spacing-3);
    min-width: 0;
  }
  .navbar__menu-icon {
    display: grid;
    place-items: center;
    flex: none;
    width: var(--ds-spacing-8);
    height: var(--ds-spacing-8);
    background: var(--ds-surface);
    border: 1px solid var(--ds-border);
    border-radius: var(--ds-radius-md);
  }
  .navbar__menu-copy {
    display: grid;
    gap: var(--ds-spacing-1);
  }
  .navbar__menu-copy strong {
    font-size: var(--ds-font-size-sm);
    font-weight: 600;
    line-height: 1.4;
    color: var(--ds-foreground);
  }
  .navbar__menu-copy > span {
    font-size: var(--ds-font-size-xs);
    color: var(--ds-foreground-muted);
    line-height: 1.5;
  }
  :global(.aesir-dropdown.navbar__mega) {
    box-sizing: border-box;
    border: 0;
    border-bottom: 1px solid var(--ds-border);
    overflow: clip;
    align-content: start;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--ds-spacing-1);
    padding: var(--ds-spacing-5);
    border-radius: 0;
    box-shadow: none;
    --aesir-overlay-start-transform: translateY(-4px);
    --aesir-overlay-motion-duration: 180ms;
  }
  :global(.aesir-dropdown.navbar__compact) {
    box-sizing: border-box;
    width: 22rem;
    overflow: clip;
  }
  :global(.navbar__compact .aesir-dropdown__content > :is(a, button)) {
    box-sizing: border-box;
    min-height: 40px;
    padding: var(--ds-spacing-3);
  }
  :global(:is(.navbar__compact, .navbar__mega) .aesir-dropdown__viewport) {
    transition: height 180ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  :global(:is(.navbar__compact, .navbar__mega)[data-instant] .aesir-dropdown__viewport) {
    transition: none;
  }
  :global(.navbar__mega .aesir-dropdown__content) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--ds-spacing-1);
  }
  :global(.navbar__mega .aesir-dropdown__content:has([data-featured])) {
    grid-template-columns: 1.15fr repeat(3, minmax(0, 1fr));
  }
  :global(.navbar__mega .aesir-dropdown__content > [data-featured]) {
    grid-row: span 2;
    background: var(--ds-surface);
    border: 1px solid var(--ds-border);
  }
  :global(.navbar__mega [data-featured]) .navbar__menu-item {
    flex-direction: column;
    gap: var(--ds-spacing-5);
  }
  .navbar__menu-copy small {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .navbar__feature-cta {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
    margin-top: var(--ds-spacing-4);
    color: var(--ds-foreground);
  }
  :global(.navbar__instant-icon > svg) {
    transition: none;
  }
  :global(.navbar__mega .aesir-dropdown__content > :is(a, button)) {
    align-items: flex-start;
    padding: var(--ds-spacing-4);
  }
  .navbar__inner,
  .navbar__mobile {
    box-sizing: border-box;
    width: 100%;
  }
  .navbar__inner {
    display: flex;
    min-height: var(--ds-spacing-14);
    align-items: center;
    gap: var(--ds-spacing-5);
    padding: var(--ds-spacing-2) var(--ds-spacing-5);
  }
  .navbar__inner[data-layout='contained'],
  .navbar__mobile[data-layout='contained'] {
    max-width: 72rem;
    margin-inline: auto;
  }
  .navbar__brand {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-2);
    flex: none;
    color: inherit;
    font-size: var(--ds-font-size-sm);
    text-decoration: none;
  }
  .navbar__brand img {
    display: block;
    width: auto;
    max-width: 9rem;
    height: var(--ds-spacing-7);
    object-fit: contain;
  }
  .navbar__mark {
    display: grid;
    width: var(--ds-spacing-8);
    height: var(--ds-spacing-8);
    border-radius: var(--ds-radius-md);
    background: var(--ds-foreground);
    color: var(--ds-background);
    place-items: center;
  }
  .navbar__links {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-1);
    flex: 1;
  }
  .navbar__links :global(.aesir-dropdown__anchor) {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-1);
  }
  .navbar__link {
    display: inline-flex;
    height: var(--ds-spacing-8);
    align-items: center;
    gap: var(--ds-spacing-1);
    padding: 0 var(--ds-spacing-2-5);
    border: 0;
    border-radius: var(--ds-radius-md);
    background: transparent;
    color: var(--ds-foreground-muted);
    font-family: inherit;
    font-size: var(--ds-font-size-sm);
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
  }
  .navbar__link :global(svg) {
    transition: transform 180ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .navbar__link[aria-expanded='true'] :global(svg) {
    transform: rotate(180deg);
  }
  .navbar__link:focus-visible :global(svg) {
    transition: none;
  }
  :global(html[data-overlay-open='true']) {
    overflow: hidden;
  }
  .navbar__link:hover,
  .navbar__link.active {
    background: var(--ds-surface);
    color: var(--ds-foreground);
  }
  .navbar__link[aria-disabled='true'] {
    pointer-events: none;
    opacity: 0.45;
  }
  .navbar__end,
  .navbar__actions {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
  .navbar__end {
    margin-left: auto;
  }
  .navbar__avatar {
    display: grid;
    padding: 0;
    border: 0;
    border-radius: var(--ds-radius-full);
    background: transparent;
    place-items: center;
    cursor: pointer;
    transition: transform 140ms var(--ds-motion-easing-out);
  }
  .navbar__avatar:active {
    transform: scale(0.96);
  }
  .navbar__avatar:focus-visible {
    outline: 2px solid var(--ds-accent-ring);
    outline-offset: 2px;
  }
  :global(.navbar__mobile-trigger) {
    display: none;
  }
  .navbar__mobile {
    display: none;
    padding: 0 var(--ds-spacing-4) var(--ds-spacing-4);
  }
  @container (max-width: 42rem) {
    .navbar__secondary {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--ds-spacing-1);
      padding-inline: var(--ds-spacing-4);
    }
    .navbar__inner[data-brand-position='center'] {
      display: flex;
    }
    .navbar__inner {
      min-height: var(--ds-spacing-12);
      padding-inline: var(--ds-spacing-4);
    }
    .navbar__links,
    .navbar__actions {
      display: none;
    }
    .navbar__search {
      padding: 0;
      width: var(--ds-spacing-8);
      justify-content: center;
    }
    .navbar__search > span,
    .navbar__search :global(.aesir-kbd) {
      display: none;
    }
    .navbar__mobile-actions {
      display: flex;
      gap: var(--ds-spacing-2);
      padding: var(--ds-spacing-3);
      border-top: 1px solid var(--ds-border);
      margin-top: var(--ds-spacing-3);
    }
    :global(.navbar__mobile-trigger) {
      display: inline-flex;
    }
    .navbar__mobile {
      display: grid;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 45;
      overflow-y: auto;
      overscroll-behavior: contain;
      align-content: start;
      background: color-mix(in srgb, var(--ds-background) 80%, transparent);
      backdrop-filter: blur(24px);
      transition:
        opacity 180ms var(--ds-motion-easing-out),
        transform 180ms var(--ds-motion-easing-out);
      gap: var(--ds-spacing-1);
      padding-top: var(--ds-spacing-8);
    }
    .navbar__mobile-link {
      display: flex;
      width: 100%;
      box-sizing: border-box;
      border: 0;
      background: transparent;
      font-family: inherit;
      text-align: left;
      min-height: 44px;
      align-items: center;
      padding: 0 var(--ds-spacing-3);
      border-radius: var(--ds-radius-md);
      color: var(--ds-foreground);
      font-size: 1.05rem;
      text-decoration: none;
    }
    .navbar__mobile-link:hover,
    .navbar__mobile-link.active {
      background: var(--ds-surface);
    }
    .navbar__mobile-group {
      margin-bottom: var(--ds-spacing-5);
    }
    .navbar__mobile-group .navbar__mobile-group {
      margin-left: var(--ds-spacing-3);
    }
    .navbar__mobile-heading {
      margin: 0 0 var(--ds-spacing-2);
      padding-inline: var(--ds-spacing-3);
      font-size: var(--ds-font-size-xs);
      color: var(--ds-foreground-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .navbar__mobile-link:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }
  .navbar__mobile[data-state='closed'] {
    opacity: 0;
    transform: translateY(-6px);
    pointer-events: none;
  }
  @starting-style {
    .navbar__mobile {
      opacity: 0;
      transform: translateY(-6px);
    }
  }
  .navbar__mobile[data-instant] {
    transition: none;
  }
  @media (prefers-reduced-motion: reduce) {
    :global(:is(.navbar__compact, .navbar__mega) .aesir-dropdown__viewport) {
      transition: none;
    }
    .navbar__link :global(svg) {
      transition: none;
    }
    .navbar__mobile {
      transition: none;
      transform: none;
    }
  }
</style>
