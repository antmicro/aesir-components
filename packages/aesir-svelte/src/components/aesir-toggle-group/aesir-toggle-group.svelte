<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { setContext } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { AESIR_TOGGLE_GROUP_CONTEXT } from './context.js';
  import type { ToggleSize, ToggleVariant } from '../aesir-toggle/types.js';
  import type { ToggleGroupContext, ToggleGroupOrientation, ToggleGroupType, ToggleGroupValue } from './types.js';

  type ToggleGroupProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
    class?: string;
    type?: ToggleGroupType;
    value?: ToggleGroupValue | ToggleGroupValue[];
    variant?: ToggleVariant;
    size?: ToggleSize;
    orientation?: ToggleGroupOrientation;
    spacing?: string | number;
    disabled?: boolean;
    required?: boolean;
    loop?: boolean;
    label?: string;
    onvaluechange?: (value: ToggleGroupValue | ToggleGroupValue[] | undefined) => void;
    children?: Snippet;
  };

  let {
    class: className = '',
    type = 'single',
    value = $bindable(),
    variant = 'default',
    size = 'default',
    orientation = 'horizontal',
    spacing = 2,
    disabled = false,
    required = false,
    loop = true,
    label = 'Toggle group',
    onvaluechange,
    children,
    ...restProps
  }: ToggleGroupProps = $props();

  let ref = $state<HTMLDivElement>();
  const registered = new SvelteMap<HTMLButtonElement, ToggleGroupValue>();
  let focusedItem = $state<HTMLButtonElement>();
  const normalizedValues = $derived(type === 'multiple' ? (Array.isArray(value) ? value : []) : value);
  const gap = $derived.by(() => {
    const length = String(spacing).trim();
    if (length === '0') return '0px';
    return /^(?:\d+\.?\d*|\.\d+)$/.test(length) ? `var(--ds-spacing-${length}, ${length}px)` : length;
  });
  const tabStop = $derived.by(() => {
    const itemValues = registered;
    const enabled = [...(ref?.querySelectorAll<HTMLButtonElement>('[data-slot="aesir-toggle-group-item"]:not(:disabled)') ?? [])].filter((item) => itemValues.has(item));
    if (focusedItem && enabled.includes(focusedItem)) return focusedItem;
    const selected = Array.isArray(normalizedValues) ? normalizedValues : [normalizedValues];
    return enabled.find((item) => selected.includes(itemValues.get(item))) ?? enabled[0];
  });

  const registerItem = (element: HTMLButtonElement, itemValue: ToggleGroupValue) => {
    registered.set(element, itemValue);
    return () => registered.delete(element);
  };

  const updateValue = (itemValue: ToggleGroupValue) => {
    if (disabled) return;

    if (type === 'multiple') {
      const current = Array.isArray(value) ? value : [];
      value = current.includes(itemValue) ? current.filter((item) => item !== itemValue) : [...current, itemValue];
    } else {
      if (value === itemValue && required) return;
      value = value === itemValue ? undefined : itemValue;
    }

    onvaluechange?.(value);
  };

  setContext<ToggleGroupContext>(AESIR_TOGGLE_GROUP_CONTEXT, {
    get value() {
      return normalizedValues;
    },
    get variant() {
      return variant;
    },
    get size() {
      return size;
    },
    get disabled() {
      return disabled;
    },
    get tabStop() {
      return tabStop;
    },
    isPressed: (itemValue: ToggleGroupValue) => (type === 'multiple' && Array.isArray(normalizedValues) ? normalizedValues.includes(itemValue) : normalizedValues === itemValue),
    updateValue,
    registerItem,
    focusItem: (element: HTMLButtonElement) => (focusedItem = element)
  });

  const handleKeydown = (event: KeyboardEvent) => {
    const horizontal = orientation === 'horizontal';
    const previousKey = horizontal ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = horizontal ? 'ArrowRight' : 'ArrowDown';
    if (![previousKey, nextKey, 'Home', 'End'].includes(event.key)) return;

    const items = [...(ref?.querySelectorAll<HTMLButtonElement>('[data-slot="aesir-toggle-group-item"]:not(:disabled)') ?? [])];
    if (!items.length) return;
    event.preventDefault();
    const currentIndex = event.target instanceof HTMLButtonElement ? items.indexOf(event.target) : -1;
    let nextIndex: number;
    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = items.length - 1;
    else {
      const direction = event.key === nextKey ? 1 : -1;
      nextIndex = currentIndex + direction;
      if (loop) nextIndex = (nextIndex + items.length) % items.length;
      else nextIndex = Math.max(0, Math.min(items.length - 1, nextIndex));
    }
    items[nextIndex]?.focus();
  };
</script>

<div
  bind:this={ref}
  data-slot="aesir-toggle-group"
  data-orientation={orientation}
  data-spacing={spacing}
  class={`aesir-toggle-group ${className}`.trim()}
  style:--aesir-toggle-group-gap={gap}
  role="group"
  aria-label={label}
  onkeydown={handleKeydown}
  {...restProps}
>
  {@render children?.()}
</div>

<style>
  :global {
    .aesir-toggle-group {
      display: inline-flex;
      width: fit-content;
      align-items: center;
      gap: var(--aesir-toggle-group-gap);
    }

    .aesir-toggle-group[data-orientation='vertical'] {
      flex-direction: column;
      align-items: stretch;
    }

    .aesir-toggle-group[data-spacing='0'][data-orientation='horizontal'] > .aesir-toggle:not(:first-child) {
      margin-inline-start: calc(var(--ds-spacing-px) * -1);
    }

    .aesir-toggle-group[data-spacing='0'][data-orientation='vertical'] > .aesir-toggle:not(:first-child) {
      margin-block-start: calc(var(--ds-spacing-px) * -1);
    }

    .aesir-toggle-group[data-spacing='0'] > .aesir-toggle {
      position: relative;
      border-radius: 0;
    }

    .aesir-toggle-group[data-spacing='0'] > .aesir-toggle[data-state='on'],
    .aesir-toggle-group[data-spacing='0'] > .aesir-toggle:focus-visible {
      z-index: 1;
    }
    .aesir-toggle-group[data-spacing='0'][data-orientation='horizontal'] > .aesir-toggle:first-child {
      border-start-start-radius: var(--ds-radius-md);
      border-end-start-radius: var(--ds-radius-md);
    }
    .aesir-toggle-group[data-spacing='0'][data-orientation='horizontal'] > .aesir-toggle:last-child {
      border-start-end-radius: var(--ds-radius-md);
      border-end-end-radius: var(--ds-radius-md);
    }
    .aesir-toggle-group[data-spacing='0'][data-orientation='vertical'] > .aesir-toggle:first-child {
      border-start-start-radius: var(--ds-radius-md);
      border-start-end-radius: var(--ds-radius-md);
    }
    .aesir-toggle-group[data-spacing='0'][data-orientation='vertical'] > .aesir-toggle:last-child {
      border-end-start-radius: var(--ds-radius-md);
      border-end-end-radius: var(--ds-radius-md);
    }
  }
</style>
