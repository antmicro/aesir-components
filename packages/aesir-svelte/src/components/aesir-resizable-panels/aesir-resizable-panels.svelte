<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirIcon } from '../aesir-icon/index.js';

  type ResizablePanelsProps = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'style'> & {
    class?: string;
    style?: string;
    orientation?: 'horizontal' | 'vertical';
    size?: number;
    min?: number;
    max?: number;
    label?: string;
    disabled?: boolean;
    animate?: boolean;
    onsizechange?: (size: number) => void;
    first?: Snippet;
    second?: Snippet;
  };
  let {
    class: className = '',
    style: rootStyle,
    orientation = 'horizontal',
    size = $bindable(50),
    min = 20,
    max = 80,
    label = 'Resize panels',
    disabled = false,
    animate = false,
    onsizechange,
    first,
    second,
    ...restProps
  }: ResizablePanelsProps = $props();
  let root: HTMLDivElement;
  let handle: HTMLDivElement;
  let drag = $state<{
    pointerId: number;
    startPosition: number;
    lastPosition: number;
    startSize: number;
    lastSize: number;
    availableSize: number;
    horizontal: boolean;
  }>();
  const resizing = $derived(drag !== undefined);
  const percentage = (n: number, fallback: number) => Math.min(100, Math.max(0, Number.isFinite(n) ? n : fallback));
  const effectiveMin = $derived(percentage(min, 20));
  const effectiveMax = $derived(Math.max(effectiveMin, percentage(max, 80)));
  const clamp = (n: number) => Math.min(effectiveMax, Math.max(effectiveMin, percentage(n, 50)));
  const visibleSize = $derived(clamp(size));
  const set = (n: number) => {
    const next = clamp(n);
    if (next === visibleSize) return;
    size = next;
    onsizechange?.(size);
  };
  const onkey = (e: KeyboardEvent) => {
    if (disabled) return;
    const delta = e.shiftKey ? 10 : 2;
    const decrease = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    const increase = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    if (e.key === 'Home') set(effectiveMin);
    else if (e.key === 'End') set(effectiveMax);
    else if (e.key === decrease) set(visibleSize - delta);
    else if (e.key === increase) set(visibleSize + delta);
    else return;
    e.preventDefault();
  };
  const start = (e: PointerEvent) => {
    if (disabled || e.button !== 0 || drag) return;
    e.preventDefault();
    if (e.currentTarget instanceof Element && 'setPointerCapture' in e.currentTarget) e.currentTarget.setPointerCapture(e.pointerId);
    const bounds = root.getBoundingClientRect();
    const horizontal = orientation === 'horizontal';
    const startPosition = horizontal ? e.clientX : e.clientY;
    drag = {
      pointerId: e.pointerId,
      startPosition,
      lastPosition: startPosition,
      startSize: visibleSize,
      lastSize: visibleSize,
      availableSize: Math.max(1, horizontal ? bounds.width : bounds.height),
      horizontal
    };
  };
  const move = (event: PointerEvent) => {
    if (!drag || disabled || event.pointerId !== drag.pointerId) return;
    const position = drag.horizontal ? event.clientX : event.clientY;
    const bounds = root.getBoundingClientRect();
    const availableSize = Math.max(1, drag.horizontal ? bounds.width : bounds.height);
    if (visibleSize !== drag.lastSize || availableSize !== drag.availableSize) {
      drag.startSize = visibleSize;
      drag.startPosition = drag.lastPosition;
      drag.availableSize = availableSize;
    }
    const next = clamp(drag.startSize + ((position - drag.startPosition) / drag.availableSize) * 100);
    set(next);
    drag.lastPosition = position;
    drag.lastSize = next;
  };
  const end = (event: PointerEvent) => {
    if (event.pointerId === drag?.pointerId) drag = undefined;
  };
  $effect(() => {
    if (!drag || (!disabled && drag.horizontal === (orientation === 'horizontal'))) return;
    const pointerId = drag.pointerId;
    drag = undefined;
    if (handle?.hasPointerCapture?.(pointerId)) handle.releasePointerCapture(pointerId);
  });
</script>

<div
  bind:this={root}
  class={`aesir-resizable-panels ${className}`.trim()}
  data-orientation={orientation}
  data-resizing={resizing || undefined}
  data-animate={animate || undefined}
  part="layout"
  style={`${rootStyle ?? ''};--aesir-panel-size:${visibleSize}%`}
  {...restProps}
>
  <div class="aesir-resizable-panels__panel">{@render first?.()}</div>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    bind:this={handle}
    class="aesir-resizable-panels__handle"
    part="handle"
    role="separator"
    aria-label={label}
    aria-orientation={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
    aria-valuemin={effectiveMin}
    aria-valuemax={effectiveMax}
    aria-valuenow={visibleSize}
    aria-disabled={disabled}
    tabindex={disabled ? -1 : 0}
    onpointerdown={start}
    onpointermove={move}
    onpointerup={end}
    onpointercancel={end}
    onlostpointercapture={end}
    onkeydown={onkey}
  >
    <span class="aesir-resizable-panels__line"></span>
    <span class="aesir-resizable-panels__grip" aria-hidden="true"><AesirIcon name="grip" size={13} /></span>
  </div>
  <div class="aesir-resizable-panels__panel">{@render second?.()}</div>
</div>

<style>
  :global {
    .aesir-resizable-panels {
      display: grid;
      width: 100%;
      height: 100%;
      min-height: 0;
      grid-template-columns: minmax(0, var(--aesir-panel-size)) 0 minmax(0, 1fr);
    }
    .aesir-resizable-panels[data-orientation='vertical'] {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(0, var(--aesir-panel-size)) 0 minmax(0, 1fr);
    }
    .aesir-resizable-panels[data-animate]:not([data-resizing]):not(:has(.aesir-resizable-panels__handle:focus-visible)) {
      transition:
        grid-template-rows var(--ds-motion-duration-moderate) var(--ds-motion-easing-out),
        grid-template-columns var(--ds-motion-duration-moderate) var(--ds-motion-easing-out);
    }
    .aesir-resizable-panels[data-resizing] {
      cursor: col-resize;
      user-select: none;
    }
    .aesir-resizable-panels[data-orientation='vertical'][data-resizing] {
      cursor: row-resize;
    }
    .aesir-resizable-panels__panel {
      min-width: 0;
      min-height: 0;
      overflow: auto;
    }
    .aesir-resizable-panels__handle {
      position: relative;
      z-index: 1;
      display: grid;
      width: var(--ds-spacing-3);
      justify-self: center;
      place-items: center;
      outline: 0;
      cursor: col-resize;
      touch-action: none;
    }
    .aesir-resizable-panels[data-orientation='vertical'] .aesir-resizable-panels__handle {
      width: 100%;
      height: var(--ds-spacing-3);
      align-self: center;
      cursor: row-resize;
    }
    .aesir-resizable-panels__line {
      width: var(--ds-spacing-px);
      height: 100%;
      background: var(--ds-border);
      transition: background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
    }
    .aesir-resizable-panels[data-orientation='vertical'] .aesir-resizable-panels__line {
      width: 100%;
      height: var(--ds-spacing-px);
    }
    .aesir-resizable-panels__grip {
      position: absolute;
      display: grid;
      width: var(--ds-spacing-6);
      height: var(--ds-spacing-8);
      place-items: center;
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-full);
      background: var(--ds-background);
      color: var(--ds-foreground);
      opacity: 0;
      transform: scale(0.92);
      transition:
        opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }
    .aesir-resizable-panels[data-orientation='vertical'] .aesir-resizable-panels__grip {
      width: var(--ds-spacing-8);
      height: var(--ds-spacing-6);
      transform: rotate(90deg) scale(0.92);
    }
    .aesir-resizable-panels__handle:focus-visible .aesir-resizable-panels__line {
      background: var(--ds-border-hover);
    }
    .aesir-resizable-panels[data-resizing] .aesir-resizable-panels__line {
      background: var(--ds-foreground);
    }
    .aesir-resizable-panels__handle:active .aesir-resizable-panels__line {
      background: var(--ds-foreground);
    }
    .aesir-resizable-panels__handle:focus-visible .aesir-resizable-panels__grip {
      opacity: 1;
      transform: scale(1);
    }
    .aesir-resizable-panels[data-orientation='vertical'] .aesir-resizable-panels__handle:focus-visible .aesir-resizable-panels__grip {
      transform: rotate(90deg) scale(1);
    }

    @media (hover: hover) and (pointer: fine) {
      .aesir-resizable-panels__handle:hover .aesir-resizable-panels__line {
        background: var(--ds-border-hover);
      }

      .aesir-resizable-panels__handle:hover .aesir-resizable-panels__grip {
        opacity: 1;
        transform: scale(1);
      }

      .aesir-resizable-panels[data-orientation='vertical'] .aesir-resizable-panels__handle:hover .aesir-resizable-panels__grip {
        transform: rotate(90deg) scale(1);
      }
    }
    .aesir-resizable-panels[data-resizing] .aesir-resizable-panels__grip {
      opacity: 1;
      transform: scale(1.12);
    }
    .aesir-resizable-panels__handle:active .aesir-resizable-panels__grip {
      opacity: 1;
      transform: scale(1.12);
    }
    .aesir-resizable-panels[data-orientation='vertical'][data-resizing] .aesir-resizable-panels__grip {
      transform: rotate(90deg) scale(1.12);
    }
    .aesir-resizable-panels[data-orientation='vertical'] .aesir-resizable-panels__handle:active .aesir-resizable-panels__grip {
      transform: rotate(90deg) scale(1.12);
    }
    @media (prefers-reduced-motion: reduce) {
      .aesir-resizable-panels[data-animate]:not([data-resizing]):not(:has(.aesir-resizable-panels__handle:focus-visible)) {
        transition: none;
      }
      .aesir-resizable-panels__grip {
        transition-duration: var(--ds-motion-duration-instant);
      }
    }
  }
</style>
