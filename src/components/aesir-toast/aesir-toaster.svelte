<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirIcon } from '../aesir-icon/index.js';
  import { portal } from '../overlay/overlay.js';

  import { dismissToast, toasts } from './toast-store.js';

  let {
    class: className = '',
    style: rootStyle,
    'aria-label': regionLabel = 'Notifications',
    onmouseenter,
    onmouseleave,
    onfocusin,
    onfocusout,
    ...restProps
  }: Omit<HTMLAttributes<HTMLDivElement>, 'class'> & { class?: string } = $props();

  const iconByVariant: Record<string, string> = {
    default: 'info',
    info: 'info',
    success: 'check',
    warning: 'triangle-alert',
    destructive: 'alert-circle',
    loading: 'loader-circle'
  };

  const toastGap = 8;
  const toastFallbackHeight = 56;
  let hovered = $state(false);
  let focusedToastId = $state<number | null>(null);
  let heights = $state<Record<number, number>>({});
  const activeToasts = $derived($toasts.filter((item) => item.state !== 'closing'));
  const expanded = $derived(hovered || activeToasts.some((item) => item.id === focusedToastId));
  const renderedToasts = $derived([...$toasts].reverse());
  const frontHeight = $derived(activeToasts.length ? (heights[activeToasts.at(-1)!.id] ?? toastFallbackHeight) : 0);
  const stackHeight = $derived(activeToasts.reduce((height, item) => height + (heights[item.id] ?? toastFallbackHeight), Math.max(0, activeToasts.length - 1) * toastGap));

  const measure = (node: HTMLElement, id: number) => {
    const update = () => {
      const height = node.offsetHeight;
      if (heights[id] !== height) heights = { ...heights, [id]: height };
    };
    const observer = new ResizeObserver(update);
    observer.observe(node);
    update();
    return {
      destroy() {
        observer.disconnect();
        const rest = { ...heights };
        delete rest[id];
        heights = rest;
      }
    };
  };

  const getStackIndex = (item: { id: number; state?: string }) => {
    const collection = item.state === 'closing' ? $toasts : activeToasts;
    const index = collection.findIndex((toastItem) => toastItem.id === item.id);
    return index === -1 ? 0 : collection.length - index - 1;
  };

  const getExpandedOffset = (item: { id: number }) => {
    const index = activeToasts.findIndex((toastItem) => toastItem.id === item.id);
    if (index === -1) return 0;
    return activeToasts.slice(index + 1).reduce((offset, toastItem) => offset + (heights[toastItem.id] ?? toastFallbackHeight) + toastGap, 0);
  };

  const runAction = (item: { id: number; action?: { onClick?: () => void; dismiss?: boolean } }) => {
    try {
      item.action?.onClick?.();
    } finally {
      if (item.action?.dismiss !== false) dismissToast(item.id);
    }
  };
</script>

<div
  use:portal
  {...restProps}
  class={`aesir-toaster ${className}`.trim()}
  data-expanded={expanded}
  aria-label={regionLabel}
  role="region"
  style={`${rootStyle ?? ''}; --aesir-toast-stack-height: ${expanded ? stackHeight : frontHeight}px`}
  onmouseenter={(event) => {
    hovered = true;
    onmouseenter?.(event);
  }}
  onmouseleave={(event) => {
    hovered = false;
    onmouseleave?.(event);
  }}
  onfocusin={(event) => {
    const card = (event.target as Element).closest<HTMLElement>('.aesir-toast');
    focusedToastId = card ? Number(card.dataset.toastId) : null;
    onfocusin?.(event);
  }}
  onfocusout={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) focusedToastId = null;
    onfocusout?.(event);
  }}
>
  <div class="aesir-toaster__announcement" role="status" aria-atomic="false" aria-relevant="additions text">
    {#each activeToasts.filter((item) => item.variant !== 'destructive') as item (item.id)}
      <div>{item.title}{item.description ? `. ${item.description}` : ''}</div>
    {/each}
  </div>
  <div class="aesir-toaster__announcement" role="alert" aria-atomic="false" aria-relevant="additions text">
    {#each activeToasts.filter((item) => item.variant === 'destructive') as item (item.id)}
      <div>{item.title}{item.description ? `. ${item.description}` : ''}</div>
    {/each}
  </div>
  {#each renderedToasts as item (item.id)}
    {@const stackIndex = getStackIndex(item)}
    {@const concealed = item.state === 'closing' || (!expanded && stackIndex !== 0)}
    <article
      use:measure={item.id}
      class="aesir-toast"
      aria-hidden={concealed}
      inert={concealed}
      data-toast-id={item.id}
      data-front={stackIndex === 0}
      data-state={item.state}
      data-variant={item.variant}
      data-has-action={item.action?.label ? '' : undefined}
      style={`--aesir-toast-index: ${Math.min(stackIndex, 2)}; --aesir-toast-offset: ${getExpandedOffset(item)}px; --aesir-toast-scale: ${Math.max(0.92, 1 - stackIndex * 0.04)}; --aesir-toast-z: ${100 - stackIndex}`}
    >
      <span class="aesir-toast__icon" aria-hidden="true">
        <AesirIcon name={iconByVariant[item.variant] ?? iconByVariant.default} size={20} />
      </span>
      <div class="aesir-toast__content">
        <strong>{item.title}</strong>
        {#if item.description}<p>{item.description}</p>{/if}
      </div>
      {#if item.action?.label}
        <button type="button" class="aesir-toast__action" onclick={() => runAction(item)}>
          {item.action.label}
        </button>
      {/if}
      <button type="button" class="aesir-toast__close" aria-label={`Dismiss notification: ${item.title}`} onclick={() => dismissToast(item.id)}>
        <AesirIcon name="x" size={16} aria-hidden="true" />
      </button>
    </article>
  {/each}
</div>

<style>
  :global {
    .aesir-toaster__announcement {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }
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

    .aesir-toaster {
      position: fixed;
      right: var(--ds-spacing-4);
      bottom: var(--ds-spacing-4);
      z-index: var(--aesir-overlay-z-toast, 90);
      width: min(calc(100vw - var(--ds-spacing-8)), calc(var(--ds-sizing-xs) + var(--ds-spacing-9)));
      height: var(--aesir-toast-stack-height);
      pointer-events: auto;
    }

    .aesir-toast {
      position: absolute;
      right: 0;
      bottom: 0;
      z-index: var(--aesir-toast-z);
      display: grid;
      grid-template-columns: var(--ds-spacing-8) minmax(0, 1fr);
      align-items: center;
      gap: var(--ds-spacing-4);
      width: 100%;
      min-width: min(var(--ds-sizing-xs), calc(100vw - var(--ds-spacing-8)));

      padding: var(--ds-spacing-5);
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-xl);
      background: var(--ds-background-secondary);
      box-shadow: 0 var(--ds-spacing-1) var(--ds-spacing-3) color-mix(in oklch, var(--ds-black) 12%, transparent);
      color: var(--ds-foreground);
      opacity: 1;
      pointer-events: auto;
      transform: translateY(calc(var(--aesir-toast-index) * var(--ds-spacing-2) * -1)) scale(var(--aesir-toast-scale));
      transform-origin: bottom center;
      transition:
        opacity var(--ds-motion-duration-slow) var(--ds-motion-easing-out),
        transform var(--ds-motion-duration-slow) var(--ds-motion-easing-out),
        box-shadow var(--ds-motion-duration-moderate) var(--ds-motion-easing-subtle);

      @starting-style {
        opacity: 0;
        transform: translateY(calc(100% + var(--ds-spacing-4)));
      }
    }

    .aesir-toast[data-has-action] {
      grid-template-columns: var(--ds-spacing-8) minmax(0, 1fr) fit-content(45%);
    }

    .aesir-toast[data-state='closing'] {
      opacity: 0;
      transform: translateY(calc(100% + var(--ds-spacing-4))) scale(0.98);
      transition:
        opacity var(--ds-motion-duration-moderate) var(--ds-motion-easing-subtle),
        transform var(--ds-motion-duration-moderate) var(--ds-motion-easing-out);
      pointer-events: none;
    }

    .aesir-toaster[data-expanded='true'] .aesir-toast:not([data-state='closing']) {
      transform: translateY(calc(var(--aesir-toast-offset) * -1)) scale(1);
    }

    .aesir-toaster[data-expanded='true'] .aesir-toast {
      box-shadow: 0 var(--ds-spacing-1) var(--ds-spacing-3) color-mix(in oklch, var(--ds-black) 14%, transparent);
    }

    .aesir-toaster:not([data-expanded='true']) .aesir-toast:not([data-front='true']) > * {
      opacity: 0;
    }

    .aesir-toast > * {
      transition: opacity var(--ds-motion-duration-moderate) var(--ds-motion-easing-subtle);
    }

    .aesir-toast__icon {
      display: grid;
      place-items: center;
      color: var(--ds-foreground);
    }

    .aesir-toast[data-variant='loading'] .aesir-toast__icon svg {
      animation: aesir-toast-spin 700ms linear infinite;
    }

    .aesir-toast[data-variant='loading'] .aesir-toast__icon circle {
      stroke-dasharray: 44 20;
    }

    @keyframes aesir-toast-spin {
      to {
        transform: rotate(1turn);
      }
    }

    .aesir-toast__content {
      display: grid;
      gap: var(--ds-spacing-0-5);
      min-width: 0;
    }

    .aesir-toast strong {
      display: block;
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
      line-height: var(--ds-font-line-height-sm);
    }

    .aesir-toast p {
      margin: 0;
      color: var(--ds-foreground);
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-normal);
      line-height: var(--ds-font-line-height-sm);
    }

    .aesir-toast__action {
      display: inline-flex;
      min-width: 0;
      min-height: var(--ds-spacing-8);
      align-items: center;
      justify-content: center;
      padding: 0 var(--ds-spacing-3);
      border: 0;
      border-radius: var(--ds-radius-md);
      background: var(--ds-foreground);
      color: var(--ds-background);
      font: inherit;
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
      line-height: var(--ds-font-line-height-sm);
      overflow-wrap: anywhere;
      text-align: center;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transition:
        opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }

    .aesir-toast__action:hover {
      opacity: var(--ds-opacity-90);
    }

    .aesir-toast__action:active {
      transform: scale(0.98);
    }

    .aesir-toast__action:focus-visible {
      outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
      outline-offset: var(--ds-spacing-0-5);
    }

    .aesir-toast__close {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      display: grid;
      width: var(--ds-spacing-8);
      height: var(--ds-spacing-8);
      place-items: center;
      padding: 0;
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-full);
      background: var(--ds-background-secondary);
      color: var(--ds-foreground-muted);
      font: inherit;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transform: translate(-40%, -40%);
      transition:
        background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }

    .aesir-toast__close:hover {
      background: var(--ds-surface);
      color: var(--ds-foreground);
    }

    .aesir-toast__close:active {
      transform: translate(-40%, -40%) scale(0.96);
    }

    .aesir-toast__close:focus-visible {
      outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-toast {
        transform: none;
        transition: opacity var(--ds-motion-duration-instant) var(--ds-motion-easing-subtle);

        @starting-style {
          opacity: 0;
          transform: none;
        }
      }

      .aesir-toast[data-state='closing'] {
        opacity: 0;
        transform: none;
      }

      .aesir-toast__action,
      .aesir-toast__close {
        transition-duration: var(--ds-motion-duration-instant);
      }

      .aesir-toast__close:active {
        transform: translate(-40%, -40%);
      }

      .aesir-toast__action:active {
        transform: none;
      }

      .aesir-toast[data-variant='loading'] .aesir-toast__icon svg {
        animation: none;
      }
    }
  }
</style>
