<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { onDestroy } from 'svelte';
  import { autoUpdateAnchoredPosition, canShowTooltip, portal, registerDismissableOverlay } from '../overlay/overlay.js';
  import { listenShared } from '../../utils/shared-event.js';

  type TriggerProps = {
    onpointerenter: (event: PointerEvent) => void;
    onpointerleave: () => void;
    onpointerdown: () => void;
    onfocus: () => void;
    onblur: () => void;
    onclick: () => void;
    'aria-describedby': string | undefined;
  };
  type HoverCardProps = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'content'> & {
    trigger: Snippet<[TriggerProps]>;
    content: Snippet;
    open?: boolean;
    disabled?: boolean;
    label?: string;
    openDelay?: number;
    closeDelay?: number;
    placement?: 'top' | 'bottom';
    class?: string;
    contentClass?: string;
  };

  let {
    trigger,
    content,
    open = $bindable(false),
    disabled = false,
    label = 'Preview',
    openDelay = 500,
    closeDelay = 250,
    placement = 'bottom',
    class: className = '',
    contentClass = '',
    ...restProps
  }: HoverCardProps = $props();

  let anchor: HTMLSpanElement;
  let card = $state<HTMLDivElement>();
  let position = $state('');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pointerInside = false;
  let focusInside = false;
  let pointerFocus = false;
  const cardId = $props.id();
  const visible = $derived(open && !disabled);

  $effect(() => {
    if (!disabled && (!open || !anchor || canShowTooltip(anchor))) return;
    clearTimeout(timer);
    pointerInside = false;
    focusInside = false;
    if (open) open = false;
  });

  $effect(() => {
    if (!anchor) return;
    const releases = [
      listenShared(anchor.ownerDocument, 'aesir:tooltip-dismiss', () => {
        clearTimeout(timer);
        pointerInside = false;
        focusInside = false;
        open = false;
      }),
      listenShared<KeyboardEvent>(
        anchor.ownerDocument,
        'keydown',
        (event) => {
          if (event.key === 'Tab') pointerFocus = false;
        },
        true
      )
    ];
    return () => releases.forEach((release) => release());
  });

  const schedule = (next: boolean, delay: number) => {
    clearTimeout(timer);
    if (next && (disabled || !canShowTooltip(anchor))) return;
    timer = setTimeout(() => {
      if (!next || (!disabled && canShowTooltip(anchor))) open = next;
    }, delay);
  };
  const leave = () => {
    pointerInside = false;
    if (!focusInside) schedule(false, closeDelay);
  };
  const dismiss = () => {
    clearTimeout(timer);
    timer = undefined;
    pointerInside = false;
    focusInside = false;
    open = false;
  };
  const blur = () => {
    pointerFocus = false;
    queueMicrotask(() => {
      const activeElement = anchor?.ownerDocument.activeElement;
      focusInside = !!activeElement && (!!anchor?.contains(activeElement) || !!card?.contains(activeElement));
      if (!focusInside && !pointerInside) schedule(false, closeDelay);
    });
  };

  $effect(() => {
    if (!visible || !anchor || !card) return;
    return autoUpdateAnchoredPosition(anchor, card, { placement, align: 'center', offset: 8 }, (next: { style: string }) => (position = next.style));
  });
  $effect(() => {
    if (!visible || !anchor) return;
    return registerDismissableOverlay(anchor.ownerDocument, {
      branches: () => [anchor, card],
      dismissOnPointerDown: true,
      onDismiss: () => schedule(false, 0)
    });
  });
  onDestroy(() => clearTimeout(timer));
</script>

<span bind:this={anchor} class={`aesir-hover-card__anchor ${className}`.trim()} {...restProps}>
  {@render trigger({
    onpointerenter: (event) => {
      if (event.pointerType === 'touch') return;
      if (!anchor?.ownerDocument.defaultView?.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      pointerInside = true;
      schedule(true, openDelay);
    },
    onpointerleave: leave,
    onpointerdown: () => {
      // Pointer focus is part of activation, not a request for a preview.
      pointerFocus = true;
      dismiss();
    },
    onfocus: () => {
      if (pointerFocus) return;
      focusInside = true;
      schedule(true, 0);
    },
    onblur: blur,
    onclick: dismiss,
    'aria-describedby': visible ? cardId : undefined
  })}
</span>

{#if visible}
  <div
    use:portal
    bind:this={card}
    id={cardId}
    role="group"
    aria-label={label}
    class={`aesir-hover-card ${contentClass}`.trim()}
    style={position}
    onpointerenter={() => {
      pointerInside = true;
      clearTimeout(timer);
    }}
    onpointerleave={leave}
    onfocusin={() => {
      focusInside = true;
      clearTimeout(timer);
    }}
    onfocusout={blur}
  >
    {@render content()}
  </div>
{/if}

<style>
  :global(.aesir-hover-card__anchor) {
    display: inline-flex;
  }
  :global(.aesir-hover-card) {
    position: fixed;
    z-index: var(--ds-z-popover, 1000);
    max-width: min(24rem, calc(100vw - 2rem));
    padding: var(--ds-spacing-4);
    border: 1px solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-surface);
    color: var(--ds-foreground);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
    box-shadow: var(--ds-shadow-popover, 0 8px 24px rgb(0 0 0 / 0.12));
  }
</style>
