<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  type Axis = 'vertical' | 'horizontal';
  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
    ref?: HTMLDivElement;
    viewportRef?: HTMLDivElement;
    label?: string;
    class?: string;
    orientation?: Axis | 'both';
    type?: 'hover' | 'scroll' | 'auto' | 'always';
    scrollHideDelay?: number;
    scrollbarSize?: number;
    scrollbarClass?: string;
    thumbClass?: string;
    children?: Snippet;
  };
  let {
    ref = $bindable(),
    viewportRef = $bindable(),
    label = 'Scrollable content',
    class: className,
    orientation = 'vertical',
    type = 'hover',
    scrollHideDelay = 600,
    scrollbarSize = 8,
    scrollbarClass = '',
    thumbClass = '',
    children,
    ...restProps
  }: Props = $props();

  let ready = $state(false);
  let hovering = $state(false);
  let focusInside = $state(false);
  let scrolling = $state(false);
  let dragging = $state(false);
  let metrics = $state({ width: 0, height: 0, scrollWidth: 0, scrollHeight: 0, left: 0, top: 0 });
  let hoverTimer: ReturnType<typeof setTimeout> | undefined;
  let scrollTimer: ReturnType<typeof setTimeout> | undefined;
  const overflowX = $derived(metrics.scrollWidth > metrics.width + 1);
  const overflowY = $derived(metrics.scrollHeight > metrics.height + 1);
  const scrollable = $derived(((orientation === 'horizontal' || orientation === 'both') && overflowX) || ((orientation === 'vertical' || orientation === 'both') && overflowY));
  const visible = $derived(type === 'auto' || type === 'always' || focusInside || scrolling || dragging || (type === 'hover' && hovering));
  const showX = $derived((orientation === 'horizontal' || orientation === 'both') && (type === 'always' || (overflowX && visible)));
  const showY = $derived((orientation === 'vertical' || orientation === 'both') && (type === 'always' || (overflowY && visible)));
  const trackX = $derived(Math.max(0, metrics.width - (showY ? scrollbarSize : 0)));
  const trackY = $derived(Math.max(0, metrics.height - (showX ? scrollbarSize : 0)));
  const thumbX = $derived(overflowX ? Math.min(trackX, Math.max(24, (trackX * metrics.width) / metrics.scrollWidth)) : trackX);
  const thumbY = $derived(overflowY ? Math.min(trackY, Math.max(24, (trackY * metrics.height) / metrics.scrollHeight)) : trackY);
  const offsetX = $derived(overflowX ? ((trackX - thumbX) * metrics.left) / (metrics.scrollWidth - metrics.width) : 0);
  const offsetY = $derived(overflowY ? ((trackY - thumbY) * metrics.top) / (metrics.scrollHeight - metrics.height) : 0);

  const measure = () => {
    if (!viewportRef) return;
    metrics = {
      width: viewportRef.clientWidth,
      height: viewportRef.clientHeight,
      scrollWidth: viewportRef.scrollWidth,
      scrollHeight: viewportRef.scrollHeight,
      left: viewportRef.scrollLeft,
      top: viewportRef.scrollTop
    };
  };
  const scheduleHide = (mode: 'hover' | 'scroll') => {
    if (mode === 'hover') {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        hovering = false;
      }, scrollHideDelay);
    } else {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        scrolling = false;
      }, scrollHideDelay);
    }
  };
  const handleScroll = () => {
    measure();
    if (type === 'scroll' || type === 'hover') {
      scrolling = true;
      scheduleHide('scroll');
    }
  };
  const scrollToPointer = (event: PointerEvent, axis: Axis) => {
    if (event.button !== 0) return;
    const viewport = viewportRef;
    if (!viewport) return;
    const track = event.currentTarget as HTMLElement;
    const rect = track.getBoundingClientRect();
    const length = axis === 'vertical' ? rect.height : rect.width;
    const thumbLength = axis === 'vertical' ? thumbY : thumbX;
    const point = axis === 'vertical' ? event.clientY - rect.top : event.clientX - rect.left;
    const maxScroll = axis === 'vertical' ? viewport.scrollHeight - viewport.clientHeight : viewport.scrollWidth - viewport.clientWidth;
    const value = maxScroll * Math.min(1, Math.max(0, (point - thumbLength / 2) / Math.max(1, length - thumbLength)));
    if (axis === 'vertical') viewport.scrollTop = value;
    else viewport.scrollLeft = value;
    measure();
  };
  const dragThumb = (event: PointerEvent, axis: Axis) => {
    if (event.button !== 0) return;
    const viewport = viewportRef;
    if (!viewport) return;
    event.preventDefault();
    const thumb = event.currentTarget as HTMLElement;
    const startPoint = axis === 'vertical' ? event.clientY : event.clientX;
    const startScroll = axis === 'vertical' ? viewport.scrollTop : viewport.scrollLeft;
    const trackLength = axis === 'vertical' ? trackY : trackX;
    const thumbLength = axis === 'vertical' ? thumbY : thumbX;
    const maxScroll = axis === 'vertical' ? viewport.scrollHeight - viewport.clientHeight : viewport.scrollWidth - viewport.clientWidth;
    thumb.setPointerCapture(event.pointerId);
    dragging = true;
    const move = (next: PointerEvent) => {
      const delta = (axis === 'vertical' ? next.clientY : next.clientX) - startPoint;
      const value = startScroll + (delta * maxScroll) / Math.max(1, trackLength - thumbLength);
      if (axis === 'vertical') viewport.scrollTop = value;
      else viewport.scrollLeft = value;
      measure();
    };
    const stop = () => {
      dragging = false;
      if (type === 'scroll' || type === 'hover') scheduleHide('scroll');
      thumb.removeEventListener('pointermove', move);
      thumb.removeEventListener('pointerup', stop);
      thumb.removeEventListener('pointercancel', stop);
    };
    thumb.addEventListener('pointermove', move);
    thumb.addEventListener('pointerup', stop);
    thumb.addEventListener('pointercancel', stop);
  };
  $effect(() => {
    const viewport = viewportRef;
    if (!viewport) return;
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Observer bookkeeping never drives Svelte state.
    const observedDescendants = new Set<Element>();
    const syncDescendants = () => {
      for (const descendant of observedDescendants) {
        if (!viewport.contains(descendant)) {
          observer.unobserve(descendant);
          observedDescendants.delete(descendant);
        }
      }
      for (const descendant of viewport.querySelectorAll('*')) {
        if (!observedDescendants.has(descendant)) {
          observer.observe(descendant);
          observedDescendants.add(descendant);
        }
      }
      measure();
    };
    const mutations = new MutationObserver(syncDescendants);
    mutations.observe(viewport, { childList: true, subtree: true, characterData: true });
    syncDescendants();
    measure();
    ready = true;
    return () => {
      mutations.disconnect();
      observer.disconnect();
      clearTimeout(hoverTimer);
      clearTimeout(scrollTimer);
      ready = false;
    };
  });
</script>

<div
  bind:this={ref}
  data-slot="scroll-area"
  data-orientation={orientation}
  data-type={type}
  class={`aesir-scroll-area ${className ?? ''}`.trim()}
  style:--aesir-scrollbar-size={`${scrollbarSize}px`}
  onpointerenter={() => {
    hovering = true;
    clearTimeout(hoverTimer);
  }}
  onpointerleave={() => {
    if (type === 'hover') scheduleHide('hover');
  }}
  onfocusin={() => {
    focusInside = true;
  }}
  onfocusout={(event) => {
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) focusInside = false;
  }}
  {...restProps}
>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex --><!-- A scrollable region must be keyboard focusable. -->
  <div
    bind:this={viewportRef}
    data-slot="scroll-area-viewport"
    data-enhanced={ready || undefined}
    class="aesir-scroll-area__viewport"
    role="region"
    aria-label={label}
    tabindex={scrollable ? 0 : undefined}
    onscroll={handleScroll}
  >
    {@render children?.()}
  </div>
  {#if showY}
    <div
      class={`aesir-scroll-area__scrollbar aesir-scroll-area__scrollbar--y ${scrollbarClass}`.trim()}
      data-slot="scroll-area-scrollbar"
      data-orientation="vertical"
      role="presentation"
      aria-hidden="true"
      style:bottom={`${showX ? scrollbarSize : 0}px`}
      onpointerdown={(event) => {
        if (event.target === event.currentTarget) scrollToPointer(event, 'vertical');
      }}
    >
      <button
        type="button"
        tabindex="-1"
        aria-label="Scroll vertically"
        class={`aesir-scroll-area__thumb ${thumbClass}`.trim()}
        data-slot="scroll-area-thumb"
        style:height={`${thumbY}px`}
        style:transform={`translateY(${offsetY}px)`}
        onpointerdown={(event) => dragThumb(event, 'vertical')}
      ></button>
    </div>
  {/if}
  {#if showX}
    <div
      class={`aesir-scroll-area__scrollbar aesir-scroll-area__scrollbar--x ${scrollbarClass}`.trim()}
      data-slot="scroll-area-scrollbar"
      data-orientation="horizontal"
      role="presentation"
      aria-hidden="true"
      style:right={`${showY ? scrollbarSize : 0}px`}
      onpointerdown={(event) => {
        if (event.target === event.currentTarget) scrollToPointer(event, 'horizontal');
      }}
    >
      <button
        type="button"
        tabindex="-1"
        aria-label="Scroll horizontally"
        class={`aesir-scroll-area__thumb ${thumbClass}`.trim()}
        data-slot="scroll-area-thumb"
        style:width={`${thumbX}px`}
        style:transform={`translateX(${offsetX}px)`}
        onpointerdown={(event) => dragThumb(event, 'horizontal')}
      ></button>
    </div>
  {/if}
  {#if showX && showY}<div class="aesir-scroll-area__corner" data-slot="scroll-area-corner" style:width={`${scrollbarSize}px`} style:height={`${scrollbarSize}px`}></div>{/if}
</div>

<style>
  .aesir-scroll-area {
    position: relative;
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    flex-direction: column;
    border-radius: inherit;
  }
  .aesir-scroll-area__viewport {
    height: 100%;
    min-height: 0;
    flex: 1;
    border-radius: inherit;
    outline: none;
  }
  [data-orientation='vertical'] > .aesir-scroll-area__viewport {
    overflow-x: hidden;
    overflow-y: auto;
  }
  [data-orientation='horizontal'] > .aesir-scroll-area__viewport {
    overflow-x: auto;
    overflow-y: hidden;
  }
  [data-orientation='both'] > .aesir-scroll-area__viewport {
    overflow: auto;
  }
  .aesir-scroll-area__viewport[data-enhanced] {
    scrollbar-width: none;
  }
  .aesir-scroll-area__viewport[data-enhanced]::-webkit-scrollbar {
    display: none;
  }
  .aesir-scroll-area__viewport:focus-visible {
    box-shadow: 0 0 0 var(--ds-spacing-1) color-mix(in oklch, var(--ds-accent-ring) 20%, transparent);
  }
  .aesir-scroll-area__scrollbar {
    position: absolute;
    z-index: 1;
    touch-action: none;
    user-select: none;
  }
  .aesir-scroll-area__scrollbar--y {
    top: 0;
    right: 0;
    bottom: 0;
    width: var(--aesir-scrollbar-size);
  }
  .aesir-scroll-area__scrollbar--x {
    right: 0;
    bottom: 0;
    left: 0;
    height: var(--aesir-scrollbar-size);
  }
  .aesir-scroll-area__thumb {
    position: relative;
    display: block;
    padding: 0;
    border: 0;
    border-radius: var(--ds-radius-full);
    background: var(--ds-border-hover);
    cursor: grab;
  }
  .aesir-scroll-area__thumb:active {
    cursor: grabbing;
  }
  .aesir-scroll-area__scrollbar--y .aesir-scroll-area__thumb {
    width: 100%;
  }
  .aesir-scroll-area__scrollbar--x .aesir-scroll-area__thumb {
    height: 100%;
  }
  .aesir-scroll-area__corner {
    position: absolute;
    right: 0;
    bottom: 0;
    background: var(--ds-background-secondary);
  }
</style>
