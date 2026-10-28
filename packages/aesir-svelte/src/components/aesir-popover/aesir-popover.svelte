<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { onDestroy } from 'svelte';
  import { autoUpdateAnchoredPosition, portal, registerDismissableOverlay } from '../overlay/overlay.js';
  import { isPointerInHoverGraceArea } from '../overlay/pointer-grace.js';
  import { createPresence } from '../overlay/presence.svelte.js';

  type CloseOptions = { skipMotion?: boolean };
  type PopoverTriggerProps = {
    onclick: (event: MouseEvent) => void;
    onpointerenter: (event: PointerEvent) => void;
    onpointerleave: () => void;
    'aria-haspopup': 'dialog';
    'aria-expanded': boolean;
  };
  type PopoverProps = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'style' | 'content'> & {
    class?: string;
    style?: string;
    contentClass?: string;
    contentStyle?: string;
    open?: boolean;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
    offset?: number;
    openOnHover?: boolean;
    openDelay?: number;
    closeDelay?: number;
    trigger?: Snippet<[PopoverTriggerProps]>;
    content?: Snippet<[{ close: (options?: CloseOptions) => void }]>;
  };

  let {
    class: className = '',
    style: rootStyle,
    contentClass = '',
    contentStyle,
    open = $bindable(false),
    placement = 'bottom',
    align = 'center',
    offset = 8,
    openOnHover = false,
    openDelay = 700,
    closeDelay = 300,
    trigger,
    content,
    ...restProps
  }: PopoverProps = $props();
  let triggerRef = $state<HTMLSpanElement>();
  let contentRef = $state<HTMLDivElement>();
  let instant = $state(false);
  let position = $state('');
  let resolvedPlacement = $state<PopoverProps['placement']>();
  let openedFromHover = false;
  let persistent = false;
  let openTimer: ReturnType<typeof setTimeout> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  const presence = createPresence(() => open, 180);

  const close = ({ skipMotion = false }: CloseOptions = {}) => {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    openTimer = undefined;
    closeTimer = undefined;
    instant = skipMotion;
    openedFromHover = false;
    persistent = false;
    open = false;
  };
  const clearHoverTimers = () => {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    openTimer = undefined;
    closeTimer = undefined;
  };
  $effect(() => {
    if (!open) {
      clearHoverTimers();
      openedFromHover = false;
      persistent = false;
    }
  });
  $effect(() => {
    if (!openOnHover) {
      clearHoverTimers();
      if (openedFromHover && !persistent) close();
    }
  });
  const scheduleHoverOpen = (event: PointerEvent) => {
    if (!openOnHover || event.pointerType !== 'mouse' || persistent) return;
    clearHoverTimers();
    if (open) return;
    openTimer = setTimeout(() => {
      openTimer = undefined;
      if (!openOnHover) return;
      instant = false;
      openedFromHover = true;
      open = true;
    }, openDelay);
  };
  const scheduleHoverClose = () => {
    clearTimeout(openTimer);
    if (!open || !openedFromHover || persistent || closeTimer) return;
    closeTimer = setTimeout(() => {
      closeTimer = undefined;
      close();
    }, closeDelay);
  };
  const keepHoverOpen = () => {
    clearTimeout(closeTimer);
    closeTimer = undefined;
  };
  $effect(() => {
    if (!open || !triggerRef || !contentRef) return;
    return autoUpdateAnchoredPosition(triggerRef, contentRef, { placement, align, offset }, (next: { style: string; placement: PopoverProps['placement'] }) => {
      position = next.style;
      resolvedPlacement = next.placement;
    });
  });

  $effect(() => {
    if (!open || !triggerRef) return;
    return registerDismissableOverlay(triggerRef.ownerDocument, {
      branches: () => [triggerRef, contentRef],
      exclusive: true,
      onDismiss: (reason: string) => {
        close({ skipMotion: reason === 'escape' });
        if (reason === 'escape') triggerRef?.querySelector<HTMLElement>('[aria-haspopup="dialog"]')?.focus();
      }
    });
  });

  $effect(() => {
    if (!openOnHover || !open || !triggerRef) return;
    const onPointerMove = (event: PointerEvent) => {
      if (!openOnHover || !open || !openedFromHover || persistent || event.pointerType !== 'mouse' || !triggerRef || !contentRef) return;
      const path = event.composedPath();
      const inInteractiveArea = path.includes(triggerRef) || path.includes(contentRef);
      const inGraceArea = isPointerInHoverGraceArea({ x: event.clientX, y: event.clientY }, triggerRef.getBoundingClientRect(), contentRef.getBoundingClientRect(), resolvedPlacement ?? placement);
      if (inInteractiveArea || inGraceArea) keepHoverOpen();
      else scheduleHoverClose();
    };
    const ownerDocument = triggerRef.ownerDocument;
    ownerDocument.addEventListener('pointermove', onPointerMove);
    return () => ownerDocument.removeEventListener('pointermove', onPointerMove);
  });

  onDestroy(clearHoverTimers);
</script>

<span class={`aesir-popover__anchor ${className}`.trim()} bind:this={triggerRef} style={rootStyle} {...restProps}>
  {@render trigger?.({
    onclick: (event) => {
      instant = event.detail === 0;
      clearHoverTimers();
      if (open && openedFromHover && !persistent) {
        persistent = true;
        openedFromHover = false;
        return;
      }
      persistent = !open;
      openedFromHover = false;
      open = !open;
    },
    onpointerenter: scheduleHoverOpen,
    onpointerleave: scheduleHoverClose,
    'aria-haspopup': 'dialog',
    'aria-expanded': open
  })}
</span>

{#if presence.present}
  <div
    use:portal
    bind:this={contentRef}
    class={`aesir-popover aesir-overlay-motion ${contentClass}`.trim()}
    data-instant={instant || undefined}
    data-motion="popover"
    data-placement={resolvedPlacement ?? placement}
    data-state={presence.state}
    role="dialog"
    style={`${position}${contentStyle ?? ''}`}
    tabindex="-1"
    onpointerenter={keepHoverOpen}
    onpointerleave={scheduleHoverClose}
    onpointerdown={() => {
      persistent = true;
      openedFromHover = false;
      keepHoverOpen();
    }}
    onfocusin={() => {
      persistent = true;
      openedFromHover = false;
      keepHoverOpen();
    }}
  >
    {@render content?.({ close })}
  </div>
{/if}

<style>
  :global {
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

    .aesir-popover__anchor {
      display: inline-flex;
    }

    .aesir-popover {
      position: fixed;
      z-index: var(--aesir-overlay-z-popover, 50);
      width: min(calc(100vw - var(--ds-spacing-8)), var(--ds-sizing-2xs));
      padding: var(--ds-spacing-4);
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-lg);
      outline: none;
      background: var(--ds-background);
      color: var(--ds-foreground);
      --aesir-overlay-motion-duration: var(--ds-motion-duration-moderate);
    }
  }
</style>
