<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirIcon } from '../aesir-icon/index.js';
  import { portal, registerModalOverlay, trapFocus } from '../overlay/overlay.js';
  import { createPresence } from '../overlay/presence.svelte.js';

  type DrawerSnippetProps = { close: () => void };
  type DrawerProps = Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> & {
    class?: string;
    open?: boolean;
    side?: 'left' | 'right';
    label?: string;
    closeLabel?: string;
    returnFocus?: HTMLElement | null;
    onclose?: () => void;
    header?: Snippet<[DrawerSnippetProps]>;
    children?: Snippet<[DrawerSnippetProps]>;
    footer?: Snippet<[DrawerSnippetProps]>;
  };

  let {
    class: className = '',
    open = $bindable(false),
    side = 'left',
    label = 'Drawer',
    closeLabel = 'Close drawer',
    returnFocus,
    onclose,
    header,
    children,
    footer,
    ...restProps
  }: DrawerProps = $props();

  const presence = createPresence(() => open, 240);
  let drawerRef = $state<HTMLElement>();

  const close = () => {
    open = false;
    onclose?.();
  };

  $effect(() => {
    if (!open || typeof document === 'undefined') return;
    return registerModalOverlay(document, { branches: () => [drawerRef], onEscape: close, returnFocus: () => returnFocus });
  });
</script>

{#if presence.present}
  <div
    use:portal
    class="aesir-drawer__backdrop"
    data-state={presence.state}
    role="presentation"
    onpointerdown={(event) => {
      if (event.button === 0 && event.target === event.currentTarget) close();
    }}
  >
    <section
      bind:this={drawerRef}
      use:trapFocus
      class={`aesir-drawer ${className}`.trim()}
      data-side={side}
      data-state={presence.state}
      role="dialog"
      aria-modal={open ? true : undefined}
      aria-hidden={!open}
      inert={!open ? true : undefined}
      aria-label={label}
      tabindex="-1"
      {...restProps}
    >
      <header class="aesir-drawer__header">
        {#if header}<div class="aesir-drawer__heading">{@render header({ close })}</div>{/if}
        <button type="button" class="aesir-drawer__close" aria-label={closeLabel} onclick={close}>
          <AesirIcon name="x" size={18} />
        </button>
      </header>
      <div class="aesir-drawer__body">{@render children?.({ close })}</div>
      {#if footer}<footer class="aesir-drawer__footer">{@render footer({ close })}</footer>{/if}
    </section>
  </div>
{/if}

<style>
  :global(html[data-overlay-open='true']) {
    overflow: hidden;
  }

  .aesir-drawer__backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--aesir-overlay-z-dialog, 70);
    background: color-mix(in oklch, var(--ds-background) 74%, transparent);
    opacity: 1;
    -webkit-backdrop-filter: blur(var(--ds-spacing-1));
    backdrop-filter: blur(var(--ds-spacing-1));
    transition: opacity var(--ds-motion-duration-moderate) var(--ds-motion-easing-out);
  }

  .aesir-drawer {
    position: absolute;
    inset-block: 0;
    box-sizing: border-box;
    display: flex;
    width: min(var(--aesir-drawer-width, var(--ds-sizing-sm)), calc(100vw - var(--ds-spacing-4)));
    min-width: 0;
    overflow: hidden;
    flex-direction: column;
    overscroll-behavior: contain;
    outline: none;
    background: var(--ds-background);
    color: var(--ds-foreground);
    transform: translateX(0);
    transition: transform var(--ds-motion-duration-slow) var(--ds-motion-easing-drawer);
  }

  .aesir-drawer[data-side='left'] {
    left: 0;
    border-right: var(--ds-spacing-px) solid var(--ds-border);
  }

  .aesir-drawer[data-side='right'] {
    right: 0;
    border-left: var(--ds-spacing-px) solid var(--ds-border);
  }

  .aesir-drawer__backdrop[data-state='closed'] {
    opacity: 0;
    pointer-events: none;
  }

  .aesir-drawer[data-side='left'][data-state='closed'] {
    transform: translateX(-100%);
  }

  .aesir-drawer[data-side='right'][data-state='closed'] {
    transform: translateX(100%);
  }

  .aesir-drawer__header,
  .aesir-drawer__footer {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-3);
  }

  .aesir-drawer__header {
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }

  .aesir-drawer__footer {
    border-top: var(--ds-spacing-px) solid var(--ds-border);
  }

  .aesir-drawer__heading {
    min-width: 0;
    flex: 1;
  }

  .aesir-drawer__close {
    display: grid;
    width: var(--ds-spacing-9);
    height: var(--ds-spacing-9);
    place-items: center;
    flex: 0 0 auto;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background);
    color: var(--ds-foreground);
    cursor: pointer;
    transition:
      background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
  }

  .aesir-drawer__close:hover {
    background: var(--ds-surface-hover);
  }

  .aesir-drawer__close:focus-visible {
    outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    outline-offset: var(--ds-spacing-0-5);
  }

  .aesir-drawer__close:active {
    transform: scale(0.97);
  }

  .aesir-drawer__body {
    min-width: 0;
    min-height: 0;
    flex: 1;
    overflow: auto;
  }

  @starting-style {
    .aesir-drawer__backdrop {
      opacity: 0;
    }

    .aesir-drawer[data-side='left'] {
      transform: translateX(-100%);
    }

    .aesir-drawer[data-side='right'] {
      transform: translateX(100%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .aesir-drawer__backdrop,
    .aesir-drawer,
    .aesir-drawer__close {
      transition-duration: var(--ds-motion-duration-instant);
    }

    .aesir-drawer__close:active {
      transform: none;
    }
  }
</style>
