<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { portal, registerModalOverlay, trapFocus } from '../overlay/overlay.js';
  import { createPresence } from '../overlay/presence.svelte.js';

  type CloseOptions = { skipMotion?: boolean };
  type DialogProps = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'style' | 'title' | 'children'> & {
    class?: string;
    style?: string;
    open?: boolean;
    title?: string;
    description?: string;
    closeLabel?: string;
    role?: 'dialog' | 'alertdialog';
    closeOnEscape?: boolean;
    closeOnBackdrop?: boolean;
    showClose?: boolean;
    children?: Snippet;
    footer?: Snippet<[{ close: (options?: CloseOptions) => void }]>;
  };

  let {
    class: className = '',
    style: contentStyle,
    open = $bindable(false),
    title,
    description,
    closeLabel = 'Close dialog',
    role = 'dialog',
    closeOnEscape = true,
    closeOnBackdrop = true,
    showClose = true,
    children,
    footer,
    ...restProps
  }: DialogProps = $props();
  let instant = $state(false);
  let dialogRef = $state<HTMLDivElement>();
  const dialogId = $props.id();
  const titleId = `${dialogId}-title`;
  const descriptionId = `${dialogId}-description`;
  const presence = createPresence(() => open, 240);

  const close = ({ skipMotion = false }: CloseOptions = {}) => {
    instant = skipMotion;
    open = false;
  };

  $effect(() => {
    if (!open || typeof document === 'undefined') return;
    return registerModalOverlay(document, { branches: () => [dialogRef], onEscape: closeOnEscape ? () => close({ skipMotion: true }) : undefined });
  });
</script>

{#if presence.present}
  <div
    use:portal
    class="aesir-dialog__backdrop aesir-overlay-motion"
    data-motion="fade"
    data-state={presence.state}
    data-instant={(!open && instant) || undefined}
    role="presentation"
    onpointerdown={(event) => {
      if (closeOnBackdrop && event.target === event.currentTarget) close();
    }}
  >
    <div
      bind:this={dialogRef}
      use:trapFocus
      class={`aesir-dialog aesir-overlay-motion ${className}`.trim()}
      data-instant={(!open && instant) || undefined}
      data-motion="zoom"
      data-state={presence.state}
      {role}
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      tabindex="-1"
      style={contentStyle}
      {...restProps}
    >
      <header class="aesir-dialog__header">
        <div>
          <h2 id={titleId}>{title}</h2>
          {#if description}<p id={descriptionId}>{description}</p>{/if}
        </div>
        {#if showClose}<button type="button" class="aesir-dialog__close" aria-label={closeLabel} onclick={() => close()}>×</button>{/if}
      </header>
      <div class="aesir-dialog__body">{@render children?.()}</div>
      {#if footer}<footer class="aesir-dialog__footer">{@render footer({ close })}</footer>{/if}
    </div>
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

    html[data-overlay-open='true'] {
      overflow: hidden;
    }

    .aesir-dialog__backdrop {
      position: fixed;
      inset: 0;
      z-index: var(--aesir-overlay-z-dialog, 70);
      display: grid;
      place-items: center;
      padding: var(--ds-spacing-4);
      background: color-mix(in oklch, var(--ds-background) 72%, transparent);
      -webkit-backdrop-filter: blur(var(--ds-spacing-1));
      backdrop-filter: blur(var(--ds-spacing-1));
      --aesir-overlay-motion-duration: var(--ds-motion-duration-moderate);
    }

    .aesir-dialog {
      display: grid;
      width: min(100%, var(--ds-sizing-lg));
      max-height: calc(100dvh - var(--ds-spacing-8));
      overflow: auto;
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-xl);
      outline: none;
      background: var(--ds-background);
      color: var(--ds-foreground);
      --aesir-overlay-motion-duration: var(--ds-motion-duration-slow);
    }

    .aesir-dialog__header,
    .aesir-dialog__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-spacing-4);
      padding: var(--ds-spacing-4);
    }

    .aesir-dialog__header {
      border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    }

    .aesir-dialog__header h2,
    .aesir-dialog__header p {
      margin: 0;
    }

    .aesir-dialog__header h2 {
      font-size: var(--ds-font-size-base);
      font-weight: var(--ds-font-weight-medium);
      line-height: var(--ds-font-line-height-base);
    }

    .aesir-dialog__header p {
      margin-top: var(--ds-spacing-1);
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-font-line-height-sm);
    }

    .aesir-dialog__close {
      display: grid;
      width: var(--ds-spacing-8);
      height: var(--ds-spacing-8);
      place-items: center;
      flex-shrink: 0;
      border: 0;
      border-radius: var(--ds-radius-md);
      background: transparent;
      color: var(--ds-foreground-muted);
      font: inherit;
      font-size: var(--ds-font-size-xl);
      cursor: pointer;
      transition:
        background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }

    .aesir-dialog__close:hover {
      background: var(--ds-surface-hover);
      color: var(--ds-foreground);
    }

    .aesir-dialog__close:focus-visible {
      outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    }

    .aesir-dialog__close:active {
      transform: scale(0.97);
    }

    .aesir-dialog__body {
      padding: var(--ds-spacing-4);
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-font-line-height-sm);
    }

    .aesir-dialog__footer {
      justify-content: flex-end;
      border-top: var(--ds-spacing-px) solid var(--ds-border);
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-dialog__close {
        transition-duration: var(--ds-motion-duration-instant);
      }

      .aesir-dialog__close:active {
        transform: none;
      }
    }
  }
</style>
