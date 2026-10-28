<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirIcon } from '../aesir-icon/index.js';
  type TreeValue = string | number;
  type TreeItem = { id?: TreeValue; value?: TreeValue; label: string; description?: string; icon?: string; disabled?: boolean; items?: TreeItem[] };
  type TreeEntry = { item: TreeItem; level: number; parent: TreeItem | null };
  type TreeViewProps = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'onselect'> & {
    class?: string;
    items?: TreeItem[];
    value?: TreeValue;
    expanded?: TreeValue[];
    label?: string;
    lines?: boolean;
    size?: 'default' | 'sm';
    disabled?: boolean;
    selectBranches?: boolean;
    onselect?: (item: TreeItem) => void;
  };
  let {
    class: className = '',
    items = [],
    value = $bindable(),
    expanded = $bindable([]),
    label = 'Tree view',
    lines = true,
    size = 'default',
    disabled = false,
    selectBranches = false,
    onselect,
    ...restProps
  }: TreeViewProps = $props();
  let root: HTMLDivElement;
  let focused = $state<TreeValue>();
  let focusWithin = $state(false);
  const key = (item: TreeItem) => item.value ?? item.id ?? item.label;
  const pathTo = (entries: TreeItem[], target: TreeValue, path: TreeValue[] = []): TreeValue[] => {
    for (const item of entries) {
      const nextPath = [...path, key(item)];
      if (key(item) === target) return nextPath;
      const nestedPath = pathTo(item.items ?? [], target, nextPath);
      if (nestedPath.length) return nestedPath;
    }
    return [];
  };
  const flatten = (entries: TreeItem[], level = 1, parent: TreeItem | null = null): TreeEntry[] =>
    entries.flatMap((item) => [{ item, level, parent }, ...(item.items?.length && expanded.includes(key(item)) ? flatten(item.items, level + 1, item) : [])]);
  const visible = $derived(flatten(items));
  const tabStop = $derived(visible.some((entry) => key(entry.item) === value) ? value : key(visible[0]?.item));
  const rovingValue = $derived(focused !== undefined && visible.some((entry) => key(entry.item) === focused) ? focused : tabStop);
  $effect(() => {
    const currentVisible = visible;
    if (!focusWithin || focused === undefined || currentVisible.some((entry) => key(entry.item) === focused)) return;
    if (!currentVisible.length) {
      focusWithin = false;
      return;
    }
    if (root?.contains(root.ownerDocument.activeElement)) return;
    const visibleKeys = new Set(currentVisible.map((entry) => key(entry.item)));
    const target =
      pathTo(items, focused)
        .reverse()
        .find((itemKey) => visibleKeys.has(itemKey)) ?? key(currentVisible[0]?.item);
    const index = currentVisible.findIndex((entry) => key(entry.item) === target);
    if (index >= 0) root?.querySelector<HTMLElement>(`[data-tree-index="${index}"]`)?.focus();
  });
  const toggle = (item: TreeItem, force?: boolean) => {
    if (disabled || item.disabled) return;
    const id = key(item);
    const open = expanded.includes(id);
    if (force === true && !open) expanded = [...expanded, id];
    else if (force === false && open) expanded = expanded.filter((x) => x !== id);
    else if (force === undefined) expanded = open ? expanded.filter((x) => x !== id) : [...expanded, id];
  };
  const select = (item: TreeItem) => {
    if (disabled || item.disabled) return;
    value = key(item);
    onselect?.(item);
  };
  const activate = (item: TreeItem) => {
    if (disabled || item.disabled) return;
    if (item.items?.length && !selectBranches) toggle(item);
    else select(item);
  };
  const focusAt = (index: number) => {
    const nextIndex = Math.max(0, Math.min(visible.length - 1, index));
    focused = key(visible[nextIndex]?.item);
    root?.querySelector<HTMLElement>(`[data-tree-index="${nextIndex}"]`)?.focus();
  };
  const onkey = (event: KeyboardEvent, index: number, entry: TreeEntry) => {
    const { item, parent } = entry;
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'ArrowRight', 'ArrowLeft', 'Enter', ' '].includes(event.key)) event.preventDefault();
    if (event.key === 'ArrowDown') focusAt(index + 1);
    else if (event.key === 'ArrowUp') focusAt(index - 1);
    else if (event.key === 'Home') focusAt(0);
    else if (event.key === 'End') focusAt(visible.length - 1);
    else if (event.key === 'ArrowRight') {
      if (item.items?.length) {
        if (!expanded.includes(key(item))) toggle(item, true);
        else focusAt(index + 1);
      }
    } else if (event.key === 'ArrowLeft') {
      if (expanded.includes(key(item))) toggle(item, false);
      else if (parent) focusAt(visible.findIndex((x) => key(x.item) === key(parent)));
    } else if (event.key === 'Enter' || event.key === ' ') activate(item);
  };
</script>

<div
  bind:this={root}
  class={`aesir-tree-view ${className}`.trim()}
  data-lines={lines || undefined}
  data-size={size}
  role="tree"
  aria-label={label}
  aria-disabled={disabled || undefined}
  onfocusin={() => (focusWithin = true)}
  onfocusout={(event) => {
    if (event.relatedTarget) {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) focusWithin = false;
      return;
    }
    // Removing a focused item also blurs to the body; keep focus ownership only if that item is disappearing.
    if (visible.some((entry) => key(entry.item) === focused)) focusWithin = false;
  }}
  {...restProps}
>
  {#each visible as entry, index (key(entry.item))}{@const item = entry.item}{@const branch = Boolean(item.items?.length)}{@const open = branch && expanded.includes(key(item))}
    <div
      class="aesir-tree-view__item"
      role="treeitem"
      aria-level={entry.level}
      aria-expanded={branch ? open : undefined}
      aria-selected={!branch || selectBranches ? value === key(item) : undefined}
      aria-disabled={disabled || item.disabled || undefined}
      tabindex={rovingValue === key(item) ? 0 : -1}
      data-tree-index={index}
      style={`--aesir-tree-level:${entry.level}`}
      onclick={(event) => {
        focused = key(item);
        event.currentTarget.focus();
        activate(item);
      }}
      onfocus={() => (focused = key(item))}
      onkeydown={(event) => onkey(event, index, entry)}
    >
      <button
        type="button"
        class="aesir-tree-view__toggle"
        tabindex="-1"
        aria-label={`${open ? 'Collapse' : 'Expand'} ${item.label}`}
        disabled={!branch || disabled || item.disabled}
        onclick={(event) => {
          event.stopPropagation();
          toggle(item);
        }}
      >
        <AesirIcon name="chevron-right" size={size === 'sm' ? 12 : 14} class={open ? 'open' : ''} />
      </button>
      {#if item.icon}<AesirIcon name={item.icon} size={size === 'sm' ? 14 : 16} />{/if}
      <span>{item.label}</span>
      {#if item.description}<small>{item.description}</small>{/if}
    </div>
  {/each}
</div>

<style>
  :global {
    .aesir-tree-view {
      display: grid;
      width: 100%;
      font-size: var(--ds-font-size-sm);
      --aesir-tree-row-height: var(--ds-spacing-9);
      --aesir-tree-indent: var(--ds-spacing-5);
      --aesir-tree-guide-step: var(--ds-spacing-2-5);
      --aesir-tree-toggle-size: var(--ds-spacing-5);
      --aesir-tree-row-gap: var(--ds-spacing-2);
      --aesir-tree-row-padding-end: var(--ds-spacing-2);
    }
    .aesir-tree-view[data-size='sm'] {
      font-size: var(--ds-font-size-xs);
      --aesir-tree-row-height: var(--ds-spacing-8);
      --aesir-tree-indent: var(--ds-spacing-4);
      --aesir-tree-guide-step: var(--ds-spacing-2);
      --aesir-tree-toggle-size: var(--ds-spacing-4);
      --aesir-tree-row-gap: var(--ds-spacing-1-5);
      --aesir-tree-row-padding-end: var(--ds-spacing-1-5);
    }
    .aesir-tree-view__item {
      position: relative;
      display: flex;
      min-width: 0;
      height: var(--aesir-tree-row-height);
      align-items: center;
      gap: var(--aesir-tree-row-gap);
      padding-inline: calc((var(--aesir-tree-level) - 1) * var(--aesir-tree-indent)) var(--aesir-tree-row-padding-end);
      border-radius: var(--ds-radius-md);
      outline: 0;
      color: var(--ds-foreground);
      cursor: pointer;
    }
    .aesir-tree-view[data-lines] .aesir-tree-view__item::before {
      position: absolute;
      inset-block: 0;
      left: 0;
      width: calc((var(--aesir-tree-level) - 1) * var(--aesir-tree-indent));
      background-image: repeating-linear-gradient(
        to right,
        transparent 0,
        transparent calc(var(--aesir-tree-guide-step) - var(--ds-spacing-px)),
        var(--ds-border) calc(var(--aesir-tree-guide-step) - var(--ds-spacing-px)),
        var(--ds-border) var(--aesir-tree-guide-step),
        transparent var(--aesir-tree-guide-step),
        transparent var(--aesir-tree-indent)
      );
      content: '';
      pointer-events: none;
    }
    .aesir-tree-view__item:hover {
      background: var(--ds-surface);
    }
    .aesir-tree-view__item[aria-selected='true'] {
      background: var(--ds-accent-surface);
      color: var(--ds-accent-text);
    }
    .aesir-tree-view__item:focus-visible {
      z-index: 1;
      box-shadow: 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-ring);
    }
    .aesir-tree-view__item[aria-disabled='true'] {
      opacity: var(--ds-opacity-50);
    }
    .aesir-tree-view__toggle {
      display: grid;
      width: var(--aesir-tree-toggle-size);
      height: var(--aesir-tree-toggle-size);
      flex: 0 0 auto;
      padding: 0;
      place-items: center;
      border: 0;
      background: transparent;
      color: inherit;
    }
    .aesir-tree-view__toggle:disabled {
      visibility: hidden;
    }
    .aesir-tree-view__toggle :where(svg) {
      transition: transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }
    .aesir-tree-view__toggle :where(svg.open) {
      transform: rotate(90deg);
    }
    .aesir-tree-view__item > span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .aesir-tree-view__item > small {
      margin-inline-start: auto;
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xs);
    }
    @media (prefers-reduced-motion: reduce) {
      .aesir-tree-view__toggle :where(svg) {
        transition: none;
      }
    }
  }
</style>
