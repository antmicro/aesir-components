<script lang="ts">
  import { onDestroy, untrack, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirBadge } from '../aesir-badge/index.js';
  import { AesirButton } from '../aesir-button/index.js';
  import { AesirDrawer } from '../aesir-drawer/index.js';
  import { AesirIcon } from '../aesir-icon/index.js';
  import { AesirScrollArea } from '../aesir-scroll-area/index.js';

  type SidebarValue = string | number;
  type SidebarAction = { label?: string; icon?: string };
  type SidebarItem = {
    id?: SidebarValue;
    value?: SidebarValue;
    label: string;
    description?: string;
    href?: string;
    target?: string;
    rel?: string;
    disabled?: boolean;
    items?: SidebarItem[];
    divider?: boolean;
    icon?: string;
    iconSrc?: string;
    status?: string;
    statusLabel?: string;
    badge?: string | number;
  };
  type SidebarSection = { title?: string; items?: SidebarItem[]; action?: SidebarAction };
  type SidebarProps = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'onselect' | 'style' | 'title'> & {
    class?: string;
    title?: string;
    label?: string;
    variant?: 'classic' | 'app';
    mode?: string;
    branchBehavior?: 'toggle' | 'split' | 'navigate';
    autoExpandActive?: boolean;
    treeLines?: boolean;
    stickyBranches?: boolean;
    mobileTrigger?: 'header' | 'inline' | 'external';
    items?: SidebarItem[];
    sections?: SidebarSection[];
    value?: SidebarValue;
    expanded?: SidebarValue[];
    open?: boolean;
    width?: number;
    minWidth?: number;
    maxWidth?: number;
    resizable?: boolean;
    collapsible?: boolean;
    collapsed?: boolean;
    collapseTrigger?: string;
    sticky?: boolean;
    stickyTop?: string;
    resizeLabel?: string;
    collapseLabel?: string;
    expandLabel?: string;
    closeLabel?: string;
    menuLabel?: string;
    onselect?: (item: SidebarItem, event?: MouseEvent) => void;
    onsectionaction?: (section: SidebarSection, action: SidebarAction) => void;
    itemActions?: Snippet<[SidebarItem]>;
    itemLeading?: Snippet<[SidebarItem]>;
    showTitle?: boolean;
    headerActions?: Snippet;
    header?: Snippet;
    footer?: Snippet;
    style?: string;
  };
  let {
    class: className = '',
    title = 'Navigation',
    label = title,
    variant = 'classic',
    mode = 'responsive',
    branchBehavior = 'toggle',
    autoExpandActive = true,
    treeLines = false,
    stickyBranches = false,
    mobileTrigger = 'header',
    items = [],
    sections = [],
    value = $bindable(),
    expanded = $bindable([]),
    open = $bindable(false),
    width = $bindable(256),
    minWidth = 208,
    maxWidth = 448,
    resizable = false,
    collapsible = false,
    collapsed = $bindable(false),
    collapseTrigger = 'edge',
    sticky = true,
    stickyTop = '0px',
    resizeLabel = 'Resize navigation',
    collapseLabel = 'Collapse navigation',
    expandLabel = 'Expand navigation',
    closeLabel = 'Close navigation',
    menuLabel = 'Open navigation',
    onselect,
    onsectionaction,
    itemActions,
    itemLeading,
    showTitle = false,
    headerActions = undefined,
    header: headerSnippet,
    footer: footerSnippet,
    style: styleValue = '',
    ...restProps
  }: SidebarProps = $props();

  let trigger = $state<HTMLButtonElement>();
  let resizing = $state(false);
  let stopResize: (() => void) | undefined;
  const sidebarId = $props.id();
  const desktopPanelId = `${sidebarId}-desktop-panel`;
  const mobilePanelId = `${sidebarId}-mobile-panel`;
  const navigationSections = $derived(
    sections?.length
      ? sections
      : [
          {
            title: undefined,
            items
          }
        ]
  );
  const itemKey = (item: SidebarItem): SidebarValue => item.value ?? item.id ?? item.label;
  const findItemPath = (entries: SidebarItem[], selectedValue: SidebarValue | undefined, path: SidebarItem[] = []): SidebarItem[] => {
    if (selectedValue == null) return [];
    for (const item of entries) {
      const nextPath = [...path, item];
      if (itemKey(item) === selectedValue) return nextPath;
      const nestedPath = findItemPath(item.items ?? [], selectedValue, nextPath);
      if (nestedPath.length) return nestedPath;
    }
    return [];
  };
  const allNavigationItems = $derived(navigationSections.flatMap((section) => section.items ?? []));
  const selectedPath = $derived(findItemPath(allNavigationItems, value));
  const selectedItem = $derived(selectedPath.at(-1));

  const selectItem = (item: SidebarItem, event?: MouseEvent) => {
    if (item.disabled) {
      event?.preventDefault();
      return;
    }

    const key = itemKey(item);
    if (item.items?.length) {
      if (!expanded.includes(key)) expanded = [...expanded, key];
    }
    value = key;
    open = false;
    onselect?.(item, event);
  };

  $effect(() => {
    if (!autoExpandActive || value == null) return;
    const ancestors = selectedPath.filter((item) => item.items?.length).map(itemKey);
    untrack(() => {
      const next = [...new Set([...expanded, ...ancestors])];
      if (next.length !== expanded.length) expanded = next;
    });
  });
  const toggleItem = (item: SidebarItem) => {
    const key = itemKey(item);
    expanded = expanded.includes(key) ? expanded.filter((entry) => entry !== key) : [...expanded, key];
  };

  const clampWidth = (nextWidth: number) => Math.min(maxWidth, Math.max(minWidth, nextWidth));
  const visibleWidth = $derived(clampWidth(width));
  const resizeFromKeyboard = (event: KeyboardEvent) => {
    const amounts: Record<string, number> = { ArrowLeft: -8, ArrowRight: 8 };
    if (event.key === 'Home') width = minWidth;
    else if (event.key === 'End') width = maxWidth;
    else if (event.key in amounts) width = clampWidth(visibleWidth + amounts[event.key]);
    else return;
    event.preventDefault();
  };
  const startResize = (event: PointerEvent) => {
    if (event.button !== 0) return;
    stopResize?.();
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
    const startX = event.clientX;
    const startWidth = visibleWidth;
    resizing = true;
    handle.setPointerCapture(event.pointerId);
    const move = (moveEvent: PointerEvent) => {
      width = clampWidth(startWidth + moveEvent.clientX - startX);
    };
    const end = () => {
      resizing = false;
      stopResize = undefined;
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
    };
    stopResize = end;
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  };
  $effect(() => {
    if (!resizable || (collapsible && collapsed)) stopResize?.();
  });
  onDestroy(() => stopResize?.());
</script>

<div
  class={`aesir-sidebar ${className}`.trim()}
  data-variant={variant}
  data-mode={mode}
  data-tree-lines={treeLines}
  data-mobile-trigger={mobileTrigger}
  data-sticky={sticky}
  data-resizing={resizing}
  data-collapsed={collapsible && collapsed}
  style={`--aesir-sidebar-width: ${visibleWidth}px; --aesir-sidebar-min-width: ${minWidth}px; --aesir-sidebar-max-width: ${maxWidth}px; --aesir-sidebar-sticky-top: ${stickyTop}; ${styleValue}`}
  {...restProps}
>
  <aside id={desktopPanelId} class="aesir-sidebar__desktop" aria-label={label} aria-hidden={collapsible && collapsed ? 'true' : undefined}>
    {#if headerSnippet || showTitle}<div class="aesir-sidebar__header">{@render Header()}</div>{/if}
    {@render Navigation(navigationSections)}
    {#if footerSnippet}<div class="aesir-sidebar__footer">{@render footerSnippet()}</div>{/if}
  </aside>
  {#if collapsible && collapseTrigger === 'edge'}
    <button
      type="button"
      class="aesir-sidebar__collapse-trigger"
      aria-label={collapsed ? expandLabel : collapseLabel}
      aria-controls={desktopPanelId}
      aria-expanded={!collapsed}
      onclick={() => (collapsed = !collapsed)}
    >
      <AesirIcon name={collapsed ? 'panel-left-open' : 'panel-left-close'} size={14} />
    </button>
  {/if}
  {#if resizable && !(collapsible && collapsed)}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="aesir-sidebar__resizer"
      role="separator"
      aria-orientation="vertical"
      aria-label={resizeLabel}
      aria-valuenow={Math.round(visibleWidth)}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      tabindex="0"
      onpointerdown={startResize}
      onkeydown={resizeFromKeyboard}
    >
      <span class="aesir-sidebar__resize-indicator"><AesirIcon name="grip" size={11} /></span>
    </div>
  {/if}

  {#if mobileTrigger !== 'external'}
    <header class="aesir-sidebar__mobile-header">
      <button bind:this={trigger} type="button" class="aesir-sidebar__menu-trigger" aria-expanded={open} aria-controls={mobilePanelId} aria-label={menuLabel} onclick={() => (open = true)}>
        <AesirIcon name="menu" size={18} />
      </button>
      <div class="aesir-sidebar__mobile-heading">
        {#if variant === 'app'}
          <div class="aesir-sidebar__breadcrumbs" aria-label="Current location">
            <span>{title}</span>
            {#each selectedPath as item (itemKey(item))}
              <AesirIcon name="chevron-right" size={13} />
              <span aria-current={item === selectedItem ? 'page' : undefined}>{item.label}</span>
            {/each}
          </div>
        {:else}
          <span>{title}</span>
          {#if selectedItem}<span>{selectedItem.label}</span>{/if}
        {/if}
      </div>
      {#if headerActions}<div class="aesir-sidebar__mobile-actions">{@render headerActions()}</div>{/if}
    </header>
  {/if}
</div>

{#snippet Header()}
  {@render headerSnippet?.()}
  {#if showTitle}
    <div class="aesir-sidebar__heading">
      <span>{title}</span>
      {@render headerActions?.()}
    </div>
  {/if}
{/snippet}

{#snippet DrawerHeader()}
  {#if headerSnippet || showTitle}<div class="aesir-sidebar__mobile-brand">{@render Header()}</div>{/if}
{/snippet}

{#snippet DrawerFooter()}
  {#if footerSnippet}<div class="aesir-sidebar__mobile-footer">{@render footerSnippet()}</div>{/if}
{/snippet}

<AesirDrawer
  bind:open
  id={mobilePanelId}
  class="aesir-sidebar__mobile-panel"
  side="left"
  {label}
  {closeLabel}
  returnFocus={trigger}
  header={DrawerHeader}
  footer={footerSnippet ? DrawerFooter : undefined}
  style="--aesir-drawer-width: min(88vw, var(--ds-sizing-sm));"
>
  <div class="aesir-sidebar__mobile-navigation" data-variant={variant} data-tree-lines={treeLines}>
    {@render Navigation(navigationSections, true)}
  </div>
</AesirDrawer>

{#snippet Navigation(navigationSections: SidebarSection[], mobile = false)}
  <AesirScrollArea class="aesir-sidebar__scroll-area">
    <nav class="aesir-sidebar__navigation" aria-label={label}>
      {#each navigationSections as section, sectionIndex (`${section.title ?? 'section'}-${sectionIndex}`)}
        <section class="aesir-sidebar__section">
          {#if section.title}
            <div class="aesir-sidebar__section-heading">
              <p class="aesir-sidebar__section-title">{section.title}</p>
              {#if section.action}
                <AesirButton
                  variant="ghost"
                  size="icon-sm"
                  aria-label={section.action.label ?? `Add to ${section.title}`}
                  title={section.action.label ?? `Add to ${section.title}`}
                  onclick={() => section.action && onsectionaction?.(section, section.action)}
                >
                  <AesirIcon name={section.action.icon ?? 'plus'} size={14} />
                </AesirButton>
              {/if}
            </div>
          {/if}
          <ul class="aesir-sidebar__list">
            {#each section.items ?? [] as item, itemIndex (item.value ?? item.id ?? `${item.label}-${itemIndex}`)}
              {@render NavigationItem(item, mobile)}
            {/each}
          </ul>
        </section>
      {/each}
    </nav>
  </AesirScrollArea>
{/snippet}

{#snippet NavigationItem(item: SidebarItem, mobile = false, nested = false)}
  {@const selected = itemKey(item) === value}
  {@const hasChildren = Boolean(item.items?.length)}
  {@const isOpen = hasChildren && expanded.includes(itemKey(item))}
  <li class:aesir-sidebar__nested-item={nested} class:aesir-sidebar__divided={item.divider} class:aesir-sidebar__with-actions={Boolean(itemActions)}>
    {#if hasChildren}
      <div class:aesir-sidebar__sticky-branch={stickyBranches && !nested && isOpen}>
        {#if (branchBehavior === 'split' || branchBehavior === 'navigate') && item.href}
          <div class="aesir-sidebar__branch-row">
            <button
              type="button"
              class="aesir-sidebar__disclosure"
              aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${item.label}`}
              aria-expanded={isOpen}
              disabled={item.disabled}
              onclick={() => toggleItem(item)}
            >
              <AesirIcon name="chevron-right" size={14} class={isOpen ? 'aesir-sidebar__chevron aesir-sidebar__chevron--open' : 'aesir-sidebar__chevron'} />
            </button>
            <!-- eslint-disable svelte/no-navigation-without-resolve -->
            <a
              class="aesir-sidebar__item"
              class:aesir-sidebar__item--mobile={mobile}
              href={item.href}
              target={item.target}
              rel={item.rel ?? (item.target === '_blank' ? 'noopener noreferrer' : undefined)}
              aria-current={selected ? 'page' : undefined}
              aria-disabled={item.disabled || undefined}
              tabindex={item.disabled ? -1 : undefined}
              onclick={(event) => selectItem(item, event)}
            >
              {@render ItemContent(item)}
            </a>
            <!-- eslint-enable svelte/no-navigation-without-resolve -->
          </div>
        {:else}
          <button
            type="button"
            class="aesir-sidebar__item"
            class:aesir-sidebar__item--left-disclosure={branchBehavior !== 'toggle'}
            class:aesir-sidebar__item--mobile={mobile}
            aria-expanded={isOpen}
            disabled={item.disabled}
            onclick={() => toggleItem(item)}
          >
            {@render ItemContent(item, true, isOpen)}
          </button>
        {/if}
      </div>
      {#if isOpen}
        <ul class="aesir-sidebar__sublist">
          {#each item.items as child, childIndex (child.value ?? child.id ?? `${child.label}-${childIndex}`)}
            {@render NavigationItem(child, mobile, true)}
          {/each}
        </ul>
      {/if}
    {:else if item.href}
      <!-- eslint-disable svelte/no-navigation-without-resolve -->
      <a
        class="aesir-sidebar__item"
        class:aesir-sidebar__item--tree-leaf={branchBehavior !== 'toggle'}
        class:aesir-sidebar__item--mobile={mobile}
        href={item.href}
        target={item.target}
        rel={item.rel ?? (item.target === '_blank' ? 'noopener noreferrer' : undefined)}
        aria-current={selected ? 'page' : undefined}
        aria-disabled={item.disabled || undefined}
        tabindex={item.disabled ? -1 : undefined}
        onclick={(event) => selectItem(item, event)}
      >
        {@render ItemContent(item)}
      </a>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    {:else}
      <button
        type="button"
        class="aesir-sidebar__item"
        class:aesir-sidebar__item--tree-leaf={branchBehavior !== 'toggle'}
        class:aesir-sidebar__item--mobile={mobile}
        aria-current={selected ? 'page' : undefined}
        disabled={item.disabled}
        onclick={(event) => selectItem(item, event)}
      >
        {@render ItemContent(item)}
      </button>
    {/if}
    {#if itemActions}<div class="aesir-sidebar__item-actions">{@render itemActions(item)}</div>{/if}
  </li>
{/snippet}

{#snippet ItemContent(item: SidebarItem, branch = false, isOpen = false)}
  {#if branchBehavior !== 'toggle' && branch}
    <span class="aesir-sidebar__item-disclosure-slot" aria-hidden="true">
      {#if branch}<AesirIcon name="chevron-right" size={14} class={isOpen ? 'aesir-sidebar__chevron aesir-sidebar__chevron--open' : 'aesir-sidebar__chevron'} />{/if}
    </span>
  {/if}
  <span class="aesir-sidebar__item-leading" class:aesir-sidebar__item-leading--custom={Boolean(itemLeading)}>
    {#if itemLeading}
      {@render itemLeading(item)}
    {:else if item.iconSrc}
      <img class="aesir-sidebar__custom-icon" src={item.iconSrc} alt="" />
    {:else if item.icon}
      <AesirIcon name={item.icon} size={15} />
    {:else if item.status}
      <span class="aesir-sidebar__status" data-status={item.status} aria-label={item.statusLabel ?? item.status}></span>
    {/if}
  </span>
  <span class="aesir-sidebar__item-copy">
    <span class="aesir-sidebar__item-label">{item.label}</span>
    {#if item.description}<small>{item.description}</small>{/if}
  </span>
  <span class="aesir-sidebar__item-trailing">
    {#if item.badge !== undefined && item.badge !== null && item.badge !== ''}<AesirBadge variant="outline" size="sm" font="mono">{item.badge}</AesirBadge>{/if}
    {#if branch && branchBehavior === 'toggle'}<AesirIcon name="chevron-right" size={14} class={isOpen ? 'aesir-sidebar__chevron aesir-sidebar__chevron--open' : 'aesir-sidebar__chevron'} />{/if}
  </span>
{/snippet}

<style>
  .aesir-sidebar__with-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
  .aesir-sidebar__with-actions > .aesir-sidebar__item,
  .aesir-sidebar__with-actions > div {
    grid-column: 1;
    grid-row: 1;
    min-width: 0;
  }
  .aesir-sidebar__with-actions > .aesir-sidebar__sublist {
    grid-column: 1;
    grid-row: 2;
  }
  .aesir-sidebar__with-actions > .aesir-sidebar__item,
  .aesir-sidebar__with-actions > div:not(.aesir-sidebar__item-actions) > .aesir-sidebar__item {
    padding-right: var(--ds-spacing-10);
  }
  .aesir-sidebar__item-actions {
    align-self: center;
    justify-self: end;
    margin-right: var(--ds-spacing-1);
    z-index: 1;
    opacity: 0;
  }
  .aesir-sidebar__with-actions:hover > .aesir-sidebar__item-actions,
  .aesir-sidebar__with-actions:has(:global(:focus-visible)) > .aesir-sidebar__item-actions,
  .aesir-sidebar__with-actions:has(> .aesir-sidebar__item-actions :global([aria-expanded='true'])) > .aesir-sidebar__item-actions {
    opacity: 1;
  }
  @media (hover: none) {
    .aesir-sidebar__item-actions {
      opacity: 1;
    }
  }
  .aesir-sidebar[data-tree-lines='true'] .aesir-sidebar__sublist,
  .aesir-sidebar__mobile-navigation[data-tree-lines='true'] .aesir-sidebar__sublist {
    margin-left: calc(var(--aesir-sidebar-disclosure-space) / 2);
    padding-left: var(--ds-spacing-2);
    border-left: var(--ds-spacing-px) solid var(--aesir-sidebar-tree-border, var(--ds-border));
  }
  .aesir-sidebar__branch-row {
    display: flex;
    align-items: stretch;
  }
  .aesir-sidebar__navigation {
    --aesir-sidebar-disclosure-space: calc(var(--ds-spacing-4) + var(--aesir-sidebar-item-gap, var(--ds-spacing-3)));
  }
  .aesir-sidebar[data-variant='app'] .aesir-sidebar__navigation,
  .aesir-sidebar__mobile-navigation[data-variant='app'] .aesir-sidebar__navigation {
    --aesir-sidebar-disclosure-space: calc(var(--ds-spacing-4) + var(--aesir-sidebar-item-gap, var(--ds-spacing-2)));
  }
  .aesir-sidebar__branch-row > a {
    flex: 1;
    min-width: 0;
  }
  .aesir-sidebar__disclosure {
    display: grid;
    place-items: center;
    flex: 0 0 var(--aesir-sidebar-disclosure-space);
    border: 0;
    border-radius: var(--ds-radius-md);
    background: transparent;
    color: var(--ds-foreground-muted);
    cursor: pointer;
  }
  .aesir-sidebar__disclosure:hover {
    background: var(--ds-surface-hover);
  }
  .aesir-sidebar__disclosure:focus-visible {
    outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    outline-offset: calc(-1 * var(--ds-spacing-0-5));
  }
  .aesir-sidebar__disclosure:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  .aesir-sidebar__sticky-branch {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--ds-background);
  }
  .aesir-sidebar__divided {
    border-top: var(--ds-spacing-px) solid var(--ds-border);
    padding-top: var(--ds-spacing-2);
    margin-top: var(--ds-spacing-2);
  }
  .aesir-sidebar__custom-icon {
    width: var(--ds-spacing-4);
    height: var(--ds-spacing-4);
    object-fit: contain;
  }
  .aesir-sidebar[data-mobile-trigger='floating'] .aesir-sidebar__mobile-header {
    position: fixed;
    bottom: var(--ds-spacing-4);
    left: var(--ds-spacing-4);
    width: auto;
    padding: 0;
    border: 0;
    z-index: 30;
  }
  .aesir-sidebar[data-mobile-trigger='floating'] .aesir-sidebar__mobile-heading {
    display: none;
  }
  .aesir-sidebar[data-mobile-trigger='floating'] .aesir-sidebar__menu-trigger {
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-full);
    background: var(--ds-background);
  }
  .aesir-sidebar {
    position: relative;
    box-sizing: border-box;
    width: clamp(var(--aesir-sidebar-min-width), var(--aesir-sidebar-width), var(--aesir-sidebar-max-width));
    max-width: 100%;
    height: var(--aesir-sidebar-height, calc(100dvh - var(--aesir-sidebar-sticky-top)));
    max-height: var(--aesir-sidebar-height, calc(100dvh - var(--aesir-sidebar-sticky-top)));
    flex: 0 0 clamp(var(--aesir-sidebar-min-width), var(--aesir-sidebar-width), var(--aesir-sidebar-max-width));
    align-self: flex-start;
    color: var(--ds-foreground);
    transition:
      width var(--ds-motion-duration-moderate) var(--ds-motion-easing-drawer),
      flex-basis var(--ds-motion-duration-moderate) var(--ds-motion-easing-drawer);
  }

  .aesir-sidebar[data-collapsed='true'] {
    width: 0;
    min-width: 0;
    flex-basis: 0;
  }

  .aesir-sidebar[data-sticky='true'] {
    position: sticky;
    top: var(--aesir-sidebar-sticky-top);
  }

  .aesir-sidebar__desktop {
    display: flex;
    height: 100%;
    min-height: 0;
    flex-direction: column;
    padding: var(--aesir-sidebar-panel-padding, var(--ds-spacing-6) var(--ds-spacing-3));
    border-right: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--aesir-sidebar-background, var(--ds-background-secondary));
    opacity: 1;
    transform: translateX(0);
    transition:
      opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-out),
      transform var(--ds-motion-duration-moderate) var(--ds-motion-easing-drawer);
  }

  .aesir-sidebar[data-collapsed='true'] .aesir-sidebar__desktop {
    width: clamp(var(--aesir-sidebar-min-width), var(--aesir-sidebar-width), var(--aesir-sidebar-max-width));
    opacity: 0;
    pointer-events: none;
    transform: translateX(-100%);
    visibility: hidden;
  }

  .aesir-sidebar__header,
  .aesir-sidebar__footer {
    flex: 0 0 auto;
  }

  .aesir-sidebar__heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--ds-spacing-2);
    margin-bottom: var(--ds-spacing-1);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }

  .aesir-sidebar__header {
    margin-bottom: var(--ds-spacing-5);
  }

  .aesir-sidebar__header,
  .aesir-sidebar__mobile-brand {
    font-size: var(--ds-font-size-xs);
  }

  .aesir-sidebar[data-variant='app'] .aesir-sidebar__header {
    margin-bottom: 0;
    padding: var(--ds-spacing-2);
  }

  .aesir-sidebar__footer {
    margin-top: auto;
    padding-top: var(--ds-spacing-4);
  }

  .aesir-sidebar__mobile-panel-header p {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }

  .aesir-sidebar__navigation {
    display: grid;
    align-content: start;
    gap: var(--aesir-sidebar-navigation-gap, var(--ds-spacing-6));
    min-height: max-content;
  }

  :global(.aesir-sidebar__scroll-area) {
    flex: 1 1 auto;
  }

  :global(.aesir-sidebar__scroll-area [data-slot='scroll-area-viewport']) {
    overscroll-behavior: none;
  }

  .aesir-sidebar[data-variant='app'] .aesir-sidebar__desktop {
    padding: var(--ds-spacing-1-5);
    background: var(--ds-background);
  }

  .aesir-sidebar[data-variant='app'] .aesir-sidebar__navigation {
    gap: var(--ds-spacing-3);
  }

  .aesir-sidebar[data-variant='app'] .aesir-sidebar__section {
    gap: var(--ds-spacing-0-5);
  }

  .aesir-sidebar[data-variant='app'] .aesir-sidebar__section-title {
    padding: var(--ds-spacing-0-5) var(--ds-spacing-1-5);
    font-size: var(--ds-font-size-xs);
    letter-spacing: 0.02em;
  }

  .aesir-sidebar__section-heading {
    padding-right: var(--ds-spacing-1);
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-spacing-2);
  }

  .aesir-sidebar__section-heading .aesir-sidebar__section-title {
    min-width: 0;
  }

  .aesir-sidebar__section-heading :global(.aesir-button) {
    opacity: 0;
    transition: opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
  }
  .aesir-sidebar__section-heading :global(.aesir-button:focus-visible) {
    box-shadow: inset 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-ring);
  }

  .aesir-sidebar__section-heading:hover :global(.aesir-button),
  .aesir-sidebar__section-heading:has(:global(:focus-visible)) :global(.aesir-button) {
    opacity: 1;
  }

  @media (hover: none), (pointer: coarse) {
    .aesir-sidebar__section-heading :global(.aesir-button) {
      opacity: 1;
    }
  }

  .aesir-sidebar[data-variant='app'] .aesir-sidebar__item,
  .aesir-sidebar__mobile-navigation[data-variant='app'] .aesir-sidebar__item {
    min-height: var(--ds-spacing-8);
    gap: var(--aesir-sidebar-item-gap, var(--ds-spacing-2));
    padding: var(--ds-spacing-1-5) var(--ds-spacing-2);
    border-radius: var(--ds-radius-md);
    color: var(--ds-foreground);
  }

  .aesir-sidebar[data-variant='app'] .aesir-sidebar__item:hover,
  .aesir-sidebar__mobile-navigation[data-variant='app'] .aesir-sidebar__item:hover {
    background: var(--ds-surface-hover);
    color: var(--ds-foreground);
  }

  .aesir-sidebar[data-variant='app'] .aesir-sidebar__item[aria-current='page'],
  .aesir-sidebar__mobile-navigation[data-variant='app'] .aesir-sidebar__item[aria-current='page'] {
    background: var(--ds-accent-surface);
    color: var(--ds-accent-text-muted);
  }

  .aesir-sidebar[data-variant='app'] .aesir-sidebar__item-label,
  .aesir-sidebar__mobile-navigation[data-variant='app'] .aesir-sidebar__item-label {
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
  }

  .aesir-sidebar__section {
    display: grid;
    align-content: start;
    gap: var(--aesir-sidebar-section-gap, var(--ds-spacing-2));
  }

  .aesir-sidebar__section-title {
    margin: 0;
    padding-inline: var(--ds-spacing-2);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }

  .aesir-sidebar__list {
    display: grid;
    align-content: start;
    gap: var(--ds-spacing-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .aesir-sidebar__sublist {
    display: grid;
    gap: var(--ds-spacing-0-5);
    margin: var(--ds-spacing-1) 0 0;
    padding: 0 0 0 var(--ds-spacing-6);
    list-style: none;
  }

  .aesir-sidebar[data-variant='app'] .aesir-sidebar__sublist,
  .aesir-sidebar__mobile-navigation[data-variant='app'] .aesir-sidebar__sublist {
    padding-left: var(--ds-spacing-2);
  }

  .aesir-sidebar__nested-item {
    min-width: 0;
  }

  .aesir-sidebar__item {
    box-sizing: border-box;
    display: grid;
    width: 100%;
    min-width: 0;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--aesir-sidebar-item-gap, var(--ds-spacing-3));
    padding: var(--aesir-sidebar-item-padding, var(--ds-spacing-3));
    border: 0;
    border-radius: var(--ds-radius-lg);
    background: transparent;
    color: var(--ds-foreground);
    font: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
  }

  .aesir-sidebar__item--tree-leaf {
    margin-inline-start: var(--aesir-sidebar-disclosure-space);
    width: calc(100% - var(--aesir-sidebar-disclosure-space));
  }

  .aesir-sidebar__item--left-disclosure {
    grid-template-columns: var(--ds-spacing-4) auto minmax(0, 1fr) auto;
  }

  .aesir-sidebar__item-disclosure-slot {
    display: grid;
    width: var(--ds-spacing-4);
    place-items: center;
  }

  .aesir-sidebar__item:hover {
    background: var(--ds-surface-hover);
  }

  .aesir-sidebar__item[aria-current='page'] {
    background: var(--ds-surface-hover);
    color: var(--ds-accent-text-muted);
  }

  .aesir-sidebar__item:focus-visible,
  .aesir-sidebar__menu-trigger:focus-visible,
  .aesir-sidebar__close:focus-visible {
    outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    outline-offset: calc(-1 * var(--ds-spacing-0-5));
  }

  .aesir-sidebar__item:active:not(:disabled) {
    transform: scale(0.98);
  }

  .aesir-sidebar__item:disabled,
  .aesir-sidebar__item[aria-disabled='true'] {
    pointer-events: none;
    opacity: var(--ds-opacity-50);
  }

  .aesir-sidebar__item-leading {
    display: grid;
    width: var(--aesir-sidebar-icon-size, var(--ds-spacing-4));
    height: var(--aesir-sidebar-icon-size, var(--ds-spacing-4));
    place-items: center;
    color: currentColor;
  }

  .aesir-sidebar__item-leading :global(svg) {
    width: var(--aesir-sidebar-icon-size, var(--ds-spacing-4));
    height: var(--aesir-sidebar-icon-size, var(--ds-spacing-4));
  }

  .aesir-sidebar__item-leading--custom {
    width: auto;
    height: auto;
    min-width: var(--aesir-sidebar-icon-size, var(--ds-spacing-4));
    min-height: var(--aesir-sidebar-icon-size, var(--ds-spacing-4));
    flex: none;
  }

  .aesir-sidebar__status {
    width: var(--ds-spacing-1-5);
    height: var(--ds-spacing-1-5);
    border-radius: var(--ds-radius-full);
    background: currentColor;
    opacity: var(--ds-opacity-50);
  }

  .aesir-sidebar__status[data-status='operational'],
  .aesir-sidebar__status[data-status='online'],
  .aesir-sidebar__status[data-status='success'] {
    background: var(--ds-emphasis-green);
  }

  .aesir-sidebar__status[data-status='warning'],
  .aesir-sidebar__status[data-status='maintenance'] {
    background: var(--ds-emphasis-yellow);
  }

  .aesir-sidebar__status[data-status='offline'],
  .aesir-sidebar__status[data-status='destructive'] {
    background: var(--ds-emphasis-red);
  }
  .aesir-sidebar__status[data-status='unread'] {
    background: var(--ds-accent);
    opacity: 1;
  }
  .aesir-sidebar__item[aria-current='page'] .aesir-sidebar__status {
    opacity: 1;
  }

  .aesir-sidebar__item-copy {
    min-width: 0;
  }

  .aesir-sidebar__item-label,
  .aesir-sidebar__item-copy small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .aesir-sidebar__item-label {
    font-size: var(--aesir-sidebar-item-font-size, var(--ds-font-size-sm));
    line-height: var(--aesir-sidebar-item-line-height, var(--ds-font-line-height-sm));
  }

  .aesir-sidebar__item-copy small {
    margin-top: var(--ds-spacing-0-5);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    line-height: var(--ds-font-line-height-xs);
  }

  .aesir-sidebar__item-trailing {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-spacing-2);
  }

  :global(.aesir-sidebar__chevron) {
    transition: transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
  }

  :global(.aesir-sidebar__chevron--open) {
    transform: rotate(90deg);
  }

  .aesir-sidebar__mobile-header {
    display: none;
    min-height: var(--ds-spacing-14);
    align-items: center;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-2) var(--ds-spacing-4);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background-secondary);
  }

  .aesir-sidebar__mobile-brand {
    min-width: 0;
    margin-right: auto;
  }

  .aesir-sidebar__mobile-footer {
    min-width: 0;
  }

  .aesir-sidebar__mobile-navigation {
    box-sizing: border-box;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    flex: 1;
    padding: var(--ds-spacing-3);
  }

  .aesir-sidebar__mobile-navigation :global(.aesir-sidebar__scroll-area) {
    width: 100%;
    height: 100%;
  }

  .aesir-sidebar__item--mobile {
    max-width: 100%;
    padding: var(--aesir-sidebar-mobile-item-padding, var(--aesir-sidebar-item-padding, var(--ds-spacing-3)));
  }

  .aesir-sidebar__item--mobile .aesir-sidebar__item-label {
    font-size: var(--ds-font-size-base);
    line-height: var(--ds-font-line-height-base);
  }

  .aesir-sidebar__menu-trigger {
    display: grid;
    width: var(--ds-spacing-9);
    height: var(--ds-spacing-9);
    place-items: center;
    flex: 0 0 auto;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background);
    color: var(--ds-foreground);
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
  }

  .aesir-sidebar__menu-trigger:hover {
    background: var(--ds-surface-hover);
  }

  .aesir-sidebar__menu-trigger:active {
    transform: scale(0.97);
  }

  .aesir-sidebar__resizer {
    position: absolute;
    inset-block: 0;
    right: 0;
    z-index: 2;
    display: grid;
    width: var(--ds-spacing-2);
    place-items: center;
    padding: 0;
    border: 0;
    outline: none;
    background: transparent;
    transform: translateX(50%);
    cursor: col-resize;
    touch-action: none;
  }

  .aesir-sidebar__resize-indicator {
    position: absolute;
    left: 50%;
    display: grid;
    width: var(--ds-spacing-4);
    height: var(--ds-spacing-6);
    place-items: center;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-full);
    background: var(--ds-background);
    color: var(--ds-foreground-muted);
    opacity: 0;
    transform: translateX(-50%) scale(0.9);
    transition:
      opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-out),
      transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
  }

  .aesir-sidebar__resizer:hover .aesir-sidebar__resize-indicator,
  .aesir-sidebar__resizer:focus-visible .aesir-sidebar__resize-indicator,
  .aesir-sidebar[data-resizing='true'] .aesir-sidebar__resize-indicator {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }

  .aesir-sidebar__resizer:focus-visible .aesir-sidebar__resize-indicator {
    outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    outline-offset: calc(-1 * var(--ds-spacing-0-5));
  }

  .aesir-sidebar__collapse-trigger {
    position: absolute;
    top: var(--ds-spacing-3);
    right: calc(var(--ds-spacing-3-5) * -1);
    z-index: 3;
    display: grid;
    width: var(--ds-spacing-7);
    height: var(--ds-spacing-7);
    place-items: center;
    padding: 0;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    background: var(--ds-background);
    color: var(--ds-foreground-muted);
    opacity: 0;
    transform: scale(0.92);
    cursor: pointer;
    transition:
      background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-out),
      transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
  }

  .aesir-sidebar:hover .aesir-sidebar__collapse-trigger,
  .aesir-sidebar__collapse-trigger:focus-visible,
  .aesir-sidebar[data-collapsed='true'] .aesir-sidebar__collapse-trigger {
    opacity: 1;
    transform: scale(1);
  }

  .aesir-sidebar__collapse-trigger:hover {
    background: var(--ds-surface-hover);
    color: var(--ds-foreground);
  }

  .aesir-sidebar__collapse-trigger:focus-visible {
    outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    outline-offset: var(--ds-spacing-0-5);
  }

  .aesir-sidebar__mobile-heading {
    display: grid;
    min-width: 0;
    gap: var(--ds-spacing-0-5);
  }

  .aesir-sidebar__mobile-actions {
    display: flex;
    flex: none;
    align-items: center;
    margin-left: auto;
  }

  .aesir-sidebar__mobile-heading span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .aesir-sidebar__mobile-heading > span:first-child {
    font-size: var(--ds-font-size-sm);
  }

  .aesir-sidebar__mobile-heading > span:not(:first-child) {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }

  .aesir-sidebar__breadcrumbs {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-1);
    overflow: hidden;
    white-space: nowrap;
  }

  .aesir-sidebar__breadcrumbs span {
    flex: 0 0 auto;
    font-size: var(--ds-font-size-sm);
  }

  .aesir-sidebar__breadcrumbs span:not([aria-current='page']) {
    color: var(--ds-foreground-muted);
  }

  .aesir-sidebar__breadcrumbs span[aria-current='page'] {
    min-width: 0;
    overflow: hidden;
    color: var(--ds-foreground);
    text-overflow: ellipsis;
  }

  .aesir-sidebar__breadcrumbs :global(svg) {
    flex: 0 0 auto;
    color: var(--ds-foreground-muted);
  }

  @media (max-width: 1023px) {
    .aesir-sidebar {
      position: static;
      width: 100%;
      height: auto;
      max-height: none;
      flex-basis: 100%;
    }

    .aesir-sidebar[data-collapsed='true'] {
      width: 100%;
      flex-basis: 100%;
    }

    .aesir-sidebar[data-sticky='true'] {
      position: sticky;
      top: var(--aesir-sidebar-sticky-top);
      z-index: 20;
    }

    .aesir-sidebar__desktop {
      display: none;
    }

    .aesir-sidebar__mobile-header {
      display: flex;
    }

    .aesir-sidebar__resizer {
      display: none;
    }

    .aesir-sidebar__collapse-trigger {
      display: none;
    }
  }

  .aesir-sidebar[data-mode='desktop'] .aesir-sidebar__desktop {
    display: flex;
  }

  .aesir-sidebar[data-mode='desktop'] {
    width: clamp(var(--aesir-sidebar-min-width), var(--aesir-sidebar-width), var(--aesir-sidebar-max-width));
    max-width: 100%;
    height: var(--aesir-sidebar-height, calc(100dvh - var(--aesir-sidebar-sticky-top)));
    max-height: var(--aesir-sidebar-height, calc(100dvh - var(--aesir-sidebar-sticky-top)));
    flex-basis: clamp(var(--aesir-sidebar-min-width), var(--aesir-sidebar-width), var(--aesir-sidebar-max-width));
  }

  .aesir-sidebar[data-mode='desktop'][data-sticky='true'] {
    position: sticky;
    top: var(--aesir-sidebar-sticky-top);
  }

  .aesir-sidebar[data-mode='desktop'][data-collapsed='true'] {
    width: 0;
    min-width: 0;
    flex-basis: 0;
  }

  .aesir-sidebar[data-mode='desktop'] .aesir-sidebar__mobile-header {
    display: none;
  }

  .aesir-sidebar[data-mode='desktop'] .aesir-sidebar__resizer,
  .aesir-sidebar[data-mode='desktop'] .aesir-sidebar__collapse-trigger {
    display: grid;
  }

  .aesir-sidebar[data-mode='mobile'] .aesir-sidebar__desktop {
    display: none;
  }

  .aesir-sidebar[data-mode='mobile'] .aesir-sidebar__mobile-header {
    display: flex;
  }

  .aesir-sidebar[data-mode='mobile'] .aesir-sidebar__resizer {
    display: none;
  }

  .aesir-sidebar[data-mode='mobile'] .aesir-sidebar__collapse-trigger {
    display: none;
  }

  .aesir-sidebar[data-mode='mobile'] {
    position: static;
    width: 100%;
    height: auto;
    max-height: none;
    flex-basis: 100%;
  }

  .aesir-sidebar[data-mode='mobile'][data-sticky='true'] {
    position: sticky;
    top: var(--aesir-sidebar-sticky-top);
    z-index: 20;
  }

  @media (prefers-reduced-motion: reduce) {
    .aesir-sidebar__item,
    .aesir-sidebar__menu-trigger,
    .aesir-sidebar__resize-indicator,
    .aesir-sidebar__collapse-trigger,
    .aesir-sidebar,
    .aesir-sidebar__desktop {
      transition-duration: var(--ds-motion-duration-instant);
    }

    :global(.aesir-sidebar__chevron) {
      transition-duration: var(--ds-motion-duration-instant);
    }

    .aesir-sidebar__item:active:not(:disabled),
    .aesir-sidebar__menu-trigger:active {
      transform: none;
    }
  }

  @media (hover: none), (pointer: coarse) {
    .aesir-sidebar__resizer {
      display: none;
    }
  }
</style>
