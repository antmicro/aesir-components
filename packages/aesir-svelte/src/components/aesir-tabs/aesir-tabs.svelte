<script lang="ts">
  import { tick } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { TabItem, TabValue } from './types.js';

  type TabsProps = Omit<HTMLAttributes<HTMLDivElement>, 'class'> & {
    class?: string;
    items?: TabItem[];
    value?: TabValue;
    size?: 'default' | 'sm';
    variant?: 'default' | 'line' | 'badge';
    width?: 'default' | 'full';
    border?: boolean;
    label?: string;
    activationMode?: 'automatic' | 'manual';
    disabled?: boolean;
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical';
  };

  let {
    class: className = '',
    items = [],
    value = $bindable(),
    size = 'default',
    variant = 'default',
    width = 'default',
    border = false,
    label = 'Tabs',
    activationMode = 'automatic',
    disabled = false,
    loop = true,
    orientation = 'horizontal',
    ...restProps
  }: TabsProps = $props();
  const tabsId = $props.id();
  let listRef = $state<HTMLDivElement>();
  let indicatorRef = $state<HTMLSpanElement>();
  let indicatorPositioned = $state(false);
  let animateNextChange = false;
  const activeValue = $derived(items.some((item) => item.value === value && !item.disabled) ? value : items.find((item) => !item.disabled)?.value);
  const hasPanels = $derived(items.some((item) => item.content !== undefined));

  const activateTab = (item: TabItem | undefined, animate = false) => {
    if (!item || disabled || item.disabled || item.value === activeValue) return;
    animateNextChange = animate;
    value = item.value;
  };

  const positionIndicator = (animate: boolean) => {
    if (variant === 'badge') return;
    const indicator = indicatorRef;
    const activeTab = listRef?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!indicator || !activeTab || !listRef) return;

    const listRect = listRef.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    const vertical = orientation === 'vertical';
    const nextOffset = vertical ? tabRect.top - listRect.top : tabRect.left - listRect.left;
    const nextSize = vertical ? tabRect.height : tabRect.width;
    const currentRect = indicator.getBoundingClientRect();
    const previousOffset = indicatorPositioned ? (vertical ? currentRect.top - listRect.top : currentRect.left - listRect.left) : nextOffset;
    const previousSize = indicatorPositioned ? (vertical ? currentRect.height : currentRect.width) : nextSize;

    indicator.getAnimations?.().forEach((animation) => animation.cancel());
    indicator.style.left = vertical ? '' : `${nextOffset}px`;
    indicator.style.top = vertical ? `${nextOffset}px` : '';
    indicator.style.width = vertical ? '' : `${nextSize}px`;
    indicator.style.height = vertical ? `${nextSize}px` : '';
    indicatorPositioned = true;

    if (!animate || typeof indicator.animate !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const initialTransform = vertical
      ? `translateY(${previousOffset - nextOffset}px) scaleY(${previousSize / nextSize})`
      : `translateX(${previousOffset - nextOffset}px) scaleX(${previousSize / nextSize})`;
    indicator.animate([{ transform: initialTransform }, { transform: 'translate(0) scale(1)' }], {
      duration: 140,
      easing: 'cubic-bezier(0.77, 0, 0.175, 1)'
    });
  };

  $effect(() => {
    activeValue;
    orientation;
    variant;
    const animate = animateNextChange;
    animateNextChange = false;
    tick().then(() => positionIndicator(animate));
  });

  $effect.pre(() => {
    activeValue;
    hasPanels;
    const list = listRef;
    const root = list?.parentElement;
    if (!list || !root) return;
    const focusRoot = list.getRootNode() as Document | ShadowRoot;
    const focusedElement = focusRoot.activeElement;
    if (!focusedElement) return;
    const focusWasInPanel = Array.from(root.querySelectorAll<HTMLElement>('.aesir-tabs__panel')).some((panel) => panel.contains(focusedElement));
    if (!focusWasInPanel) return;
    tick().then(() => {
      if (!list.isConnected) return;
      const active = focusRoot.activeElement;
      const ownerDocument = list.ownerDocument;
      const shadowHost = focusRoot instanceof ShadowRoot ? focusRoot.host : null;
      const focusLost = active === ownerDocument.body || (!active && (ownerDocument.activeElement === ownerDocument.body || ownerDocument.activeElement === shadowHost));
      if (active !== focusedElement && !focusLost) return;
      list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]:not(:disabled)')?.focus();
    });
  });

  $effect(() => {
    if (!listRef) return;
    const observer = new ResizeObserver(() => positionIndicator(false));
    observer.observe(listRef);
    return () => observer.disconnect();
  });

  const onTabKeydown = (event: KeyboardEvent, currentIndex: number) => {
    const previousKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    if (![previousKey, nextKey, 'Home', 'End'].includes(event.key) || disabled) return;

    const enabledIndexes = items.flatMap((item, index) => (item.disabled ? [] : [index]));
    if (!enabledIndexes.length) return;

    event.preventDefault();
    const enabledPosition = enabledIndexes.indexOf(currentIndex);
    let nextIndex: number | undefined;

    if (event.key === 'Home') nextIndex = enabledIndexes[0];
    else if (event.key === 'End') nextIndex = enabledIndexes.at(-1);
    else {
      const direction = event.key === nextKey ? 1 : -1;
      const candidate = enabledPosition + direction;
      if (!loop && (candidate < 0 || candidate >= enabledIndexes.length)) return;
      const nextPosition = (candidate + enabledIndexes.length) % enabledIndexes.length;
      nextIndex = enabledIndexes[nextPosition];
    }

    if (nextIndex === undefined) return;
    if (activationMode === 'automatic') activateTab(items[nextIndex]);
    listRef?.querySelector<HTMLElement>(`[data-tab-index="${nextIndex}"]`)?.focus();
  };
</script>

<div
  class={`aesir-tabs ${className}`.trim()}
  data-size={size}
  data-variant={variant}
  data-width={width}
  data-border={border || undefined}
  data-disabled={disabled || undefined}
  data-orientation={orientation}
  style:--aesir-tabs-count={items.length}
  {...restProps}
>
  <div bind:this={listRef} class="aesir-tabs__list" role="tablist" aria-label={label} aria-orientation={orientation}>
    <span bind:this={indicatorRef} class="aesir-tabs__indicator" data-positioned={indicatorPositioned || undefined} aria-hidden="true" hidden={variant === 'badge'}></span>
    {#each items as item, index (item.value)}
      <button
        id={`${tabsId}-tab-${index}`}
        type="button"
        role="tab"
        aria-selected={activeValue === item.value}
        aria-controls={hasPanels ? `${tabsId}-panel-${index}` : undefined}
        tabindex={activeValue === item.value ? 0 : -1}
        disabled={disabled || item.disabled}
        data-state={activeValue === item.value ? 'active' : 'inactive'}
        data-disabled={disabled || item.disabled || undefined}
        data-orientation={orientation}
        data-tab-index={index}
        onclick={() => activateTab(item, true)}
        onkeydown={(event) => onTabKeydown(event, index)}
      >
        {item.label}
      </button>
    {/each}
  </div>

  {#if hasPanels}
    {#each items as item, index (item.value)}
      <div id={`${tabsId}-panel-${index}`} class="aesir-tabs__panel" role="tabpanel" aria-labelledby={`${tabsId}-tab-${index}`} tabindex="0" hidden={activeValue !== item.value}>
        {item.content}
      </div>
    {/each}
  {/if}
</div>

<style>
  :global {
    .aesir-tabs {
      display: grid;
      width: 100%;
      gap: var(--ds-spacing-4);
    }

    .aesir-tabs__list {
      position: relative;
      display: flex;
      width: fit-content;
      gap: var(--ds-spacing-1);
      padding: var(--ds-spacing-1);
      border-radius: var(--ds-radius-lg);
      background: var(--ds-surface);
    }

    .aesir-tabs[data-orientation='vertical'] {
      grid-template-columns: max-content minmax(0, 1fr);
      align-items: start;
    }

    .aesir-tabs[data-orientation='vertical'] .aesir-tabs__list {
      flex-direction: column;
    }

    .aesir-tabs[data-orientation='vertical'][data-width='full'] .aesir-tabs__list {
      display: flex;
      width: 100%;
    }

    .aesir-tabs[data-width='full'] .aesir-tabs__list {
      display: grid;
      width: 100%;
      box-sizing: border-box;
      grid-template-columns: repeat(var(--aesir-tabs-count), minmax(0, 1fr));
    }

    .aesir-tabs[data-width='full'] .aesir-tabs__list button {
      min-width: 0;
      text-align: center;
    }

    .aesir-tabs[data-variant='default'][data-border] .aesir-tabs__list {
      border: var(--ds-spacing-px) solid var(--ds-border);
    }

    .aesir-tabs__list button {
      position: relative;
      z-index: 1;
      padding: var(--ds-spacing-1-5) var(--ds-spacing-3);
      border: 0;
      border-radius: var(--ds-radius-md);
      background: transparent;
      color: var(--ds-foreground-muted);
      font: inherit;
      font-size: var(--ds-font-size-sm);
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transition:
        background-color var(--ds-motion-duration-instant) var(--ds-motion-easing-subtle),
        color var(--ds-motion-duration-instant) var(--ds-motion-easing-subtle),
        transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }

    .aesir-tabs__list button:hover {
      color: var(--ds-foreground);
    }

    .aesir-tabs__list button[aria-selected='true'] {
      background: transparent;
      color: var(--ds-foreground);
    }

    .aesir-tabs__indicator {
      position: absolute;
      top: var(--ds-spacing-1);
      bottom: var(--ds-spacing-1);
      border-radius: var(--ds-radius-md);
      background: var(--ds-background);
      opacity: 0;
      transform-origin: left center;
      pointer-events: none;
      will-change: transform;
    }

    .aesir-tabs[data-orientation='vertical'] .aesir-tabs__indicator {
      right: var(--ds-spacing-1);
      left: var(--ds-spacing-1);
      width: auto;
      bottom: auto;
    }

    .aesir-tabs__indicator[data-positioned] {
      opacity: 1;
    }

    .aesir-tabs__list button:disabled {
      cursor: not-allowed;
      opacity: var(--ds-opacity-50);
    }

    .aesir-tabs[data-disabled] {
      opacity: var(--ds-opacity-50);
    }

    .aesir-tabs[data-variant='line'] .aesir-tabs__list {
      gap: var(--ds-spacing-1);
      padding: 0;
      border-radius: 0;
      background: transparent;
    }

    .aesir-tabs[data-variant='line'][data-border] .aesir-tabs__list {
      width: 100%;
      border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    }

    .aesir-tabs[data-variant='line'] .aesir-tabs__list button {
      padding: var(--ds-spacing-4) var(--ds-spacing-5);
      border-radius: 0;
    }

    .aesir-tabs[data-variant='line'] .aesir-tabs__indicator {
      top: auto;
      bottom: 0;
      height: var(--ds-spacing-0-5);
      border-radius: var(--ds-radius-full);
      background: var(--ds-accent);
      clip-path: inset(0 var(--ds-spacing-2));
    }

    .aesir-tabs[data-orientation='vertical'][data-variant='line'] .aesir-tabs__list {
      border-right: var(--ds-spacing-px) solid var(--ds-border);
      border-bottom: 0;
    }

    .aesir-tabs[data-orientation='vertical'][data-variant='line'] .aesir-tabs__indicator {
      top: auto;
      right: 0;
      left: auto;
      width: var(--ds-spacing-0-5);
      height: auto;
      clip-path: inset(var(--ds-spacing-2) 0);
    }

    .aesir-tabs[data-variant='line'] .aesir-tabs__list button[aria-selected='true'] {
      background: transparent;
    }

    .aesir-tabs__list button:active {
      transform: scale(0.97);
    }

    .aesir-tabs__list button:focus-visible {
      outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
      outline-offset: var(--ds-spacing-0-5);
    }

    .aesir-tabs[data-size='sm'] .aesir-tabs__list {
      gap: var(--ds-spacing-0-5);
      padding: var(--ds-spacing-0-5);
    }

    .aesir-tabs[data-size='sm'] .aesir-tabs__list button {
      padding: var(--ds-spacing-1) var(--ds-spacing-2);
      font-size: var(--ds-font-size-xs);
    }

    .aesir-tabs[data-size='sm']:not([data-variant='line']) .aesir-tabs__indicator {
      top: var(--ds-spacing-0-5);
      bottom: var(--ds-spacing-0-5);
    }

    .aesir-tabs[data-size='sm'][data-variant='line'] .aesir-tabs__list {
      padding: 0;
    }

    .aesir-tabs[data-variant='badge'] .aesir-tabs__list {
      gap: var(--ds-spacing-1);
      padding: 0;
      border-radius: 0;
      background: transparent;
    }

    .aesir-tabs[data-variant='badge'] .aesir-tabs__list button {
      display: inline-flex;
      box-sizing: border-box;
      min-height: var(--ds-spacing-9);
      align-items: center;
      justify-content: center;
      padding: var(--ds-spacing-1-5) var(--ds-spacing-3);
      border: var(--ds-spacing-px) solid transparent;
      border-radius: var(--ds-radius-full);
      line-height: var(--ds-font-line-height-sm);
    }

    .aesir-tabs[data-variant='badge'][data-size='sm'] .aesir-tabs__list button {
      min-height: var(--ds-spacing-8);
      padding-inline: var(--ds-spacing-2-5);
      line-height: var(--ds-font-line-height-xs);
    }

    .aesir-tabs[data-variant='badge'] .aesir-tabs__list button[aria-selected='true'] {
      border-color: var(--ds-border);
      background: var(--ds-surface);
    }

    @media (hover: hover) and (pointer: fine) {
      .aesir-tabs[data-variant='badge'] .aesir-tabs__list button:hover:not(:disabled) {
        background: var(--ds-surface);
        color: var(--ds-foreground);
      }
    }

    .aesir-tabs__panel {
      padding: var(--ds-spacing-4);
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-lg);
      background: var(--ds-background);
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-font-line-height-sm);
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-tabs__list button {
        transition-duration: var(--ds-motion-duration-instant);
      }

      .aesir-tabs__list button:active {
        transform: none;
      }
    }
  }
</style>
