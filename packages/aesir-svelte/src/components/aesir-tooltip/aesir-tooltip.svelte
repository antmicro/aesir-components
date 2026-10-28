<script module>
  const tooltipGracePeriod = 300;
  let instantTooltipUntil = 0;
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { onDestroy } from 'svelte';
  import { autoUpdateAnchoredPosition, canShowTooltip, portal, registerDismissableOverlay } from '../overlay/overlay.js';
  import { createPresence } from '../overlay/presence.svelte.js';
  import { listenShared } from '../../utils/shared-event.js';

  type TooltipOptions = { skipMotion?: boolean };
  type TooltipTriggerProps = {
    onmouseenter: () => void;
    onmouseleave: () => void;
    onpointerdown: () => void;
    onclick: () => void;
    onfocus: () => void;
    onblur: () => void;
    'aria-describedby': string | undefined;
  };
  type TooltipProps = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'style' | 'content'> & {
    class?: string;
    style?: string;
    contentClass?: string;
    contentStyle?: string;
    content?: string | Snippet;
    placement?: 'top' | 'bottom';
    offset?: number;
    delay?: number;
    disabled?: boolean;
    trigger?: Snippet<[TooltipTriggerProps]>;
  };

  let {
    class: className = '',
    style: anchorStyle,
    contentClass = '',
    contentStyle,
    content,
    placement = 'top',
    offset = 8,
    delay = 250,
    disabled = false,
    trigger,
    ...restProps
  }: TooltipProps = $props();
  let triggerRef = $state<HTMLSpanElement>();
  let tooltipRef = $state<HTMLDivElement>();
  let open = $state(false);
  let instant = $state(false);
  let positioned = $state(false);
  let position = $state('');
  let hovered = false;
  let focused = false;
  let suppressRestoredFocus = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const tooltipId = $props.id();
  const presence = createPresence(() => open, 100);

  const hasTooltipPointer = () => {
    const ownerWindow = triggerRef?.ownerDocument.defaultView;
    return !ownerWindow?.matchMedia?.('(hover: none), (pointer: coarse)').matches;
  };

  const show = ({ skipMotion = false }: TooltipOptions = {}) => {
    clearTimeout(timer);
    if (disabled || !content || !hasTooltipPointer() || !canShowTooltip(triggerRef) || triggerRef?.querySelector('[aria-expanded="true"]')) return;
    instant = skipMotion || Date.now() < instantTooltipUntil;
    timer = setTimeout(
      () => {
        if (!canShowTooltip(triggerRef)) return;
        positioned = false;
        open = true;
      },
      instant ? 0 : delay
    );
  };
  $effect(() => {
    if (disabled || !content) hide({ skipMotion: true });
  });
  const hide = ({ skipMotion = false }: TooltipOptions = {}) => {
    clearTimeout(timer);
    if (open) instantTooltipUntil = Date.now() + tooltipGracePeriod;
    if (skipMotion) instant = true;
    positioned = false;
    open = false;
  };
  $effect(() => {
    if (!open || !triggerRef || !tooltipRef) return;
    return autoUpdateAnchoredPosition(triggerRef, tooltipRef, { placement, align: 'center', offset }, (next: { style: string }) => {
      position = next.style;
      positioned = true;
    });
  });

  $effect(() => {
    if (!open || !triggerRef) return;
    return registerDismissableOverlay(triggerRef.ownerDocument, {
      branches: () => [triggerRef, tooltipRef],
      dismissOnPointerDown: false,
      onDismiss: () => hide({ skipMotion: true })
    });
  });

  $effect(() => {
    if (!triggerRef) return;
    const ownerDocument = triggerRef.ownerDocument;
    const ownerWindow = ownerDocument.defaultView;
    const dismissForOverlay = () => {
      suppressRestoredFocus = true;
      hide({ skipMotion: true });
    };
    const resumeKeyboardFocus = (event: KeyboardEvent) => {
      if (event.key === 'Tab') suppressRestoredFocus = false;
    };
    const releases = [
      listenShared(ownerDocument, 'aesir:tooltip-dismiss', dismissForOverlay),
      listenShared(ownerDocument, 'keydown', resumeKeyboardFocus, true),
      ...(ownerWindow ? [listenShared(ownerWindow, 'blur', dismissForOverlay)] : [])
    ];
    return () => {
      for (const release of releases) release();
    };
  });

  onDestroy(() => clearTimeout(timer));
</script>

<span class={`aesir-tooltip__anchor ${className}`.trim()} bind:this={triggerRef} style={anchorStyle} {...restProps}>
  {@render trigger?.({
    onmouseenter: () => {
      hovered = true;
      suppressRestoredFocus = false;
      show();
    },
    onmouseleave: () => {
      hovered = false;
      if (!focused) hide();
    },
    onpointerdown: () => {
      suppressRestoredFocus = true;
      hide({ skipMotion: true });
    },
    onclick: () => {
      suppressRestoredFocus = true;
      hide({ skipMotion: true });
    },
    onfocus: () => {
      focused = true;
      if (!suppressRestoredFocus) show({ skipMotion: true });
    },
    onblur: () => {
      focused = false;
      if (!hovered) hide({ skipMotion: true });
    },
    'aria-describedby': open ? tooltipId : undefined
  })}
</span>

{#if presence.present}
  <div
    use:portal
    bind:this={tooltipRef}
    id={tooltipId}
    class={`aesir-tooltip aesir-overlay-motion ${contentClass}`.trim()}
    data-instant={instant || undefined}
    data-motion="tooltip"
    data-placement={placement}
    data-positioned={positioned || undefined}
    data-state={presence.state}
    data-tooltip-kind="standard"
    role="tooltip"
    style={`${position}${contentStyle ?? ''}`}
  >
    {#if typeof content === 'function'}
      {@render content()}
    {:else}
      {content}
    {/if}
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

    .aesir-tooltip__anchor {
      display: inline-flex;
    }

    .aesir-tooltip {
      position: fixed;
      z-index: var(--aesir-overlay-z-tooltip, 80);
      max-width: var(--ds-sizing-3xs);
      padding: var(--ds-spacing-1-5) var(--ds-spacing-2);
      border-radius: var(--ds-radius-md);
      background: var(--ds-background-inverted);
      color: var(--ds-foreground-inverted);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-medium);
      line-height: var(--ds-font-line-height-xs);
      overflow-wrap: anywhere;
      pointer-events: none;
      --aesir-overlay-motion-duration: var(--ds-motion-duration-fast);
      --aesir-overlay-exit-duration: var(--ds-motion-duration-instant);
    }

    .aesir-tooltip[data-placement='top'] {
      --aesir-overlay-start-transform: translateY(var(--ds-spacing-0-5)) scale(0.97);
    }

    .aesir-tooltip[data-placement='bottom'] {
      --aesir-overlay-start-transform: translateY(calc(var(--ds-spacing-0-5) * -1)) scale(0.97);
    }

    .aesir-tooltip[data-tooltip-kind='standard'] {
      --aesir-overlay-motion-duration: var(--ds-motion-duration-moderate);
      --aesir-overlay-exit-duration: var(--ds-motion-duration-fast);

      opacity: 0;
      transform: var(--aesir-overlay-start-transform);
    }

    .aesir-tooltip[data-tooltip-kind='standard'][data-positioned][data-state='open'] {
      opacity: 1;
      transform: none;
    }
  }
</style>
