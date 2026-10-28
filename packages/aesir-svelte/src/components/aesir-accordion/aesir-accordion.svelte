<script lang="ts" generics="Item extends AccordionItem = AccordionItem">
  import type { HTMLAttributes } from 'svelte/elements';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import { AesirIcon } from '../aesir-icon/index.js';
  import { AesirIconSwap } from '../aesir-icon-swap/index.js';
  import type { AccordionIndicator, AccordionItem, AccordionItemContent, AccordionMedia, AccordionType, AccordionValue } from './types.js';

  type AccordionProps = Omit<HTMLAttributes<HTMLDivElement>, 'class'> & {
    class?: string;
    items?: Item[];
    type?: AccordionType;
    value?: AccordionValue;
    collapsible?: boolean;
    disabled?: boolean;
    loop?: boolean;
    headingLevel?: number;
    indicator?: AccordionIndicator;
    onValueChange?: (value: AccordionValue | undefined) => void;
    itemContent?: AccordionItemContent<Item>;
    media?: AccordionMedia<Item>;
  };

  let {
    class: className = '',
    items = [],
    type = 'single',
    value = $bindable(),
    collapsible = true,
    disabled = false,
    loop = true,
    headingLevel = 3,
    indicator = 'chevron',
    onValueChange,
    itemContent,
    media,
    ...restProps
  }: AccordionProps = $props();

  const accordionId = $props.id();
  let accordionElement = $state<HTMLDivElement>();
  let lastActive = $state<string>();
  let hasMedia = $derived(items.some(hasItemMedia));
  let resolvedType = $derived(hasMedia ? 'single' : type);
  let resolvedValue = $derived.by(() => {
    if (resolvedType === 'multiple') return Array.isArray(value) ? value.filter((entry) => items.some((item) => item.value === entry && !item.disabled)) : [];
    if (value === undefined && collapsible) return undefined;
    return items.some((item) => item.value === value && !item.disabled) ? value : items.find((item) => !item.disabled)?.value;
  });
  let activeMediaItem = $derived(items.find((item) => item.value === lastActive && hasItemMedia(item)) ?? items.find((item) => isOpen(item.value) && hasItemMedia(item)) ?? items.find(hasItemMedia));
  let displayedMedia = $state.raw<Item>();
  let incomingMedia = $state.raw<Item>();
  let incomingVisible = $state(false);

  $effect.pre(() => {
    const currentItems = items;
    const selected = resolvedValue;
    if (!accordionElement) return;

    const root = accordionElement.getRootNode() as Document | ShadowRoot;
    const active = root.activeElement;
    if (!active || !accordionElement.contains(active)) return;
    const content = active.closest('.aesir-accordion__content');
    if (!content || !accordionElement.contains(content)) return;

    const item = currentItems.find((entry) => `${accordionId}-content-${entry.value}` === content.id);
    if (item && (Array.isArray(selected) ? selected.includes(item.value) : selected === item.value)) return;

    const trigger = content.parentElement?.querySelector<HTMLButtonElement>('.aesir-accordion__trigger');
    if (item && !disabled && !item.disabled) {
      trigger?.focus();
      return;
    }
    const triggers = accordionElement.querySelectorAll<HTMLButtonElement>('.aesir-accordion__trigger');
    const replacement = currentItems
      .filter((entry) => !entry.disabled)
      .map((entry) => [...triggers].find((button) => button.id === `${accordionId}-trigger-${entry.value}`))
      .find((button) => button && !button.disabled);
    replacement?.focus();
  });

  $effect(() => {
    const next = activeMediaItem;
    if (!next) {
      displayedMedia = undefined;
      incomingMedia = undefined;
      incomingVisible = false;
      return;
    }
    if (next === displayedMedia) return;
    if (next.value === displayedMedia?.value) {
      displayedMedia = next;
      incomingMedia = undefined;
      incomingVisible = false;
      return;
    }
    if (!displayedMedia) {
      displayedMedia = next;
      return;
    }

    let cancelled = false;
    const reveal = () => {
      if (cancelled) return;
      incomingVisible = false;
      incomingMedia = next;
      requestAnimationFrame(() => requestAnimationFrame(() => (incomingVisible = true)));
    };
    if (next.video) {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.onloadeddata = reveal;
      video.onerror = reveal;
      video.src = next.video;
      video.load();
    } else {
      const image = new Image();
      image.src = next.image!;
      image
        .decode()
        .catch(() => {})
        .then(reveal);
    }
    return () => (cancelled = true);
  });

  function hasItemMedia(item: AccordionItem) {
    return Boolean(item.image || item.video);
  }

  function isOpen(itemValue: string) {
    return resolvedType === 'multiple' && Array.isArray(resolvedValue) ? resolvedValue.includes(itemValue) : resolvedValue === itemValue;
  }

  function update(nextValue: AccordionValue | undefined) {
    value = nextValue;
    onValueChange?.(nextValue);
  }

  function toggle(item: Item) {
    if (disabled || item.disabled) return;
    lastActive = item.value;
    if (resolvedType === 'multiple') {
      const current = Array.isArray(resolvedValue) ? resolvedValue : [];
      update(isOpen(item.value) ? current.filter((entry) => entry !== item.value) : [...current, item.value]);
    } else if (!isOpen(item.value)) update(item.value);
    else if (collapsible && !hasMedia) update(undefined);
  }

  function handleKeydown(event: KeyboardEvent, index: number) {
    const enabled = items.map((item, itemIndex) => ({ item, itemIndex })).filter(({ item }) => !item.disabled);
    const position = enabled.findIndex(({ itemIndex }) => itemIndex === index);
    let next: { item: Item; itemIndex: number } | undefined;
    if (event.key === 'Home') next = enabled[0];
    if (event.key === 'End') next = enabled.at(-1);
    if (event.key === 'ArrowDown') next = enabled[position + 1] ?? (loop ? enabled[0] : undefined);
    if (event.key === 'ArrowUp') next = enabled[position - 1] ?? (loop ? enabled.at(-1) : undefined);
    if (!next) return;
    event.preventDefault();
    const root = (event.currentTarget as HTMLElement).getRootNode() as Document | ShadowRoot;
    root.getElementById(`${accordionId}-trigger-${next.item.value}`)?.focus();
  }

  function finishMediaTransition() {
    if (!incomingVisible || !incomingMedia) return;
    displayedMedia = incomingMedia;
    incomingMedia = undefined;
    incomingVisible = false;
  }
</script>

{#snippet renderMedia(item: Item)}
  {#if media}
    {@render media({ item })}
  {:else if item.video}
    <video src={item.video} poster={item.poster} aria-label={item.mediaAlt} autoplay muted playsinline loop></video>
  {:else}
    <img src={item.image} alt={item.imageAlt ?? ''} />
  {/if}
{/snippet}

<div bind:this={accordionElement} class={`aesir-accordion ${className}`.trim()} class:aesir-accordion--media={hasMedia} data-slot="accordion" {...restProps}>
  <div class="aesir-accordion__items">
    {#each items as item, index (item.value)}
      {@const open = isOpen(item.value)}
      {@const triggerId = `${accordionId}-trigger-${item.value}`}
      {@const contentId = `${accordionId}-content-${item.value}`}
      <section class="aesir-accordion__item" data-state={open ? 'open' : 'closed'} data-disabled={item.disabled || disabled || undefined}>
        <svelte:element this={`h${Math.min(6, Math.max(1, headingLevel))}`} class="aesir-accordion__heading">
          <button
            id={triggerId}
            class="aesir-accordion__trigger"
            type="button"
            aria-expanded={open}
            aria-controls={contentId}
            disabled={disabled || item.disabled}
            onclick={() => toggle(item)}
            onkeydown={(event) => handleKeydown(event, index)}
          >
            <span class="aesir-accordion__label">
              {#if item.icon}<AesirIcon name={item.icon} label={item.iconLabel} class="aesir-accordion__item-icon" />{/if}
              <span>{item.title}</span>
            </span>
            {#if indicator === 'plus-minus'}
              <AesirIconSwap name="plus" activeName="minus" active={open} class="aesir-accordion__icon" />
            {:else}
              <ChevronDown class="aesir-accordion__icon aesir-accordion__icon--chevron" aria-hidden="true" />
            {/if}
          </button>
        </svelte:element>
        <div id={contentId} class="aesir-accordion__content" role="region" aria-labelledby={triggerId} aria-hidden={!open} inert={!open ? true : undefined}>
          <div class="aesir-accordion__content-clip">
            <div class="aesir-accordion__content-body">
              {#if itemContent}{@render itemContent({ item, open })}{:else}{item.content}{/if}
            </div>
          </div>
        </div>
      </section>
    {/each}
  </div>

  {#if hasMedia && (displayedMedia || activeMediaItem)}
    {@const visibleMedia = displayedMedia ?? activeMediaItem}
    <div class="aesir-accordion__media" aria-live="polite">
      <div class="aesir-accordion__media-layer">
        {@render renderMedia(visibleMedia!)}
      </div>
      {#if incomingMedia}
        <div class="aesir-accordion__media-layer aesir-accordion__media-layer--incoming" class:is-visible={incomingVisible} ontransitionend={finishMediaTransition}>
          {@render renderMedia(incomingMedia)}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  :global {
    .aesir-accordion {
      width: 100%;
      color: var(--ds-foreground);
    }
    .aesir-accordion--media {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(16rem, 0.9fr);
      gap: var(--ds-spacing-8);
      align-items: start;
    }
    .aesir-accordion__item {
      border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    }
    .aesir-accordion__item:first-child {
      border-top: var(--ds-spacing-px) solid var(--ds-border);
    }
    .aesir-accordion__heading {
      margin: 0;
      padding: 0;
      font: inherit;
    }
    .aesir-accordion__trigger {
      display: flex;
      width: 100%;
      min-height: var(--ds-spacing-14);
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-spacing-4);
      padding: var(--ds-spacing-4) 0;
      border: 0;
      outline: none;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: var(--ds-font-size-base);
      font-weight: var(--ds-font-weight-medium);
      text-align: start;
      cursor: pointer;
    }
    .aesir-accordion__trigger:focus-visible {
      box-shadow: inset 0 0 0 var(--ds-spacing-0-5) var(--ds-accent);
    }
    .aesir-accordion__trigger:disabled {
      cursor: not-allowed;
      opacity: var(--ds-opacity-50);
    }
    .aesir-accordion__label {
      display: inline-flex;
      min-width: 0;
      align-items: center;
      gap: var(--ds-spacing-2-5);
    }
    .aesir-accordion__item-icon {
      width: var(--ds-spacing-4);
      height: var(--ds-spacing-4);
      flex: none;
      color: var(--ds-foreground-muted);
    }
    .aesir-accordion__icon {
      width: var(--ds-spacing-4);
      height: var(--ds-spacing-4);
      flex: none;
      color: var(--ds-foreground-muted);
      transition: opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
    }
    .aesir-accordion__icon--chevron {
      transition:
        transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out),
        opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
    }
    .aesir-accordion__item[data-state='open'] .aesir-accordion__icon--chevron {
      transform: rotate(180deg);
    }
    .aesir-accordion--media .aesir-accordion__item[data-state='open'] .aesir-accordion__trigger {
      cursor: default;
    }
    .aesir-accordion--media .aesir-accordion__item[data-state='open'] .aesir-accordion__icon {
      opacity: 0;
    }
    .aesir-accordion__content {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows var(--ds-motion-duration-moderate) var(--ds-motion-easing-subtle);
    }
    .aesir-accordion__item[data-state='open'] .aesir-accordion__content {
      grid-template-rows: 1fr;
    }
    .aesir-accordion__content-clip {
      min-height: 0;
      overflow: hidden;
    }
    .aesir-accordion__content-body {
      padding: 0 var(--ds-spacing-8) var(--ds-spacing-4) 0;
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-font-line-height-sm);
    }
    .aesir-accordion__media {
      position: sticky;
      top: var(--ds-spacing-4);
      aspect-ratio: 4 / 3;
      overflow: hidden;
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-xl);
      background: var(--ds-surface);
    }
    .aesir-accordion__media-layer {
      position: absolute;
      inset: 0;
    }
    .aesir-accordion__media-layer--incoming {
      opacity: 0;
      transition: opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
    }
    .aesir-accordion__media-layer--incoming.is-visible {
      opacity: 1;
    }
    .aesir-accordion__media :is(img, video) {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    @media (hover: hover) and (pointer: fine) {
      .aesir-accordion__trigger:hover:not(:disabled) .aesir-accordion__icon {
        color: var(--ds-foreground);
      }
    }
    @media (max-width: 42rem) {
      .aesir-accordion--media {
        grid-template-columns: 1fr;
        gap: var(--ds-spacing-5);
      }
      .aesir-accordion__media {
        position: static;
        order: -1;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .aesir-accordion__content,
      .aesir-accordion__icon,
      .aesir-accordion__media-layer--incoming {
        transition: none;
      }
    }
  }
</style>
