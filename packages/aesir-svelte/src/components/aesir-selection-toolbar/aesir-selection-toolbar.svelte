<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirButton } from '../aesir-button/index.js';
  import { AesirIcon } from '../aesir-icon/index.js';
  import { AesirSeparator } from '../aesir-separator/index.js';
  import { AesirTooltip } from '../aesir-tooltip/index.js';
  import { portal } from '../overlay/overlay.js';
  import { createPresence } from '../overlay/presence.svelte.js';

  type SelectionToolbarProps = Omit<HTMLAttributes<HTMLDivElement>, 'class'> & {
    class?: string;
    count?: number;
    visible?: boolean;
    label?: string;
    toolbarLabel?: string;
    clearLabel?: string;
    position?: 'fixed' | 'inline';
    onclear?: () => void;
    actions?: Snippet;
  };
  let {
    class: className = '',
    count = 0,
    visible,
    label = 'selected',
    toolbarLabel = 'Selection actions',
    clearLabel = 'Clear selection',
    position = 'fixed',
    onclear,
    actions,
    ...restProps
  }: SelectionToolbarProps = $props();

  const shown = $derived(visible ?? count > 0);
  const presence = createPresence(() => shown, 180);
</script>

{#if presence.present}
  <div
    use:portal={{ disabled: position !== 'fixed' }}
    class={`aesir-selection-toolbar aesir-overlay-motion ${className}`.trim()}
    data-position={position}
    data-state={presence.state}
    data-motion="selection-toolbar"
    role="toolbar"
    aria-label={toolbarLabel}
    {...restProps}
    aria-hidden={!shown || undefined}
    inert={!shown || undefined}
  >
    <strong aria-live="polite">
      <span class="aesir-selection-toolbar__count">{count}</span>
      <span>{label}</span>
    </strong>
    <AesirSeparator class="aesir-selection-toolbar__separator" orientation="vertical" />
    <div class="aesir-selection-toolbar__actions">
      {@render actions?.()}
    </div>
    {#if onclear}
      <AesirTooltip content={clearLabel}>
        {#snippet trigger(props)}
          <AesirButton {...props} class="aesir-selection-toolbar__clear" variant="ghost" size="icon" aria-label={clearLabel} onclick={onclear}>
            <AesirIcon name="x" size={16} />
          </AesirButton>
        {/snippet}
      </AesirTooltip>
    {/if}
  </div>
{/if}

<style>
  :global {
    .aesir-selection-toolbar {
      z-index: var(--aesir-overlay-z-popover, 50);
      display: flex;
      width: max-content;
      max-width: calc(100vw - var(--ds-spacing-8));
      min-height: var(--ds-spacing-14);
      align-items: center;
      gap: var(--ds-spacing-2);
      padding: var(--ds-spacing-2) var(--ds-spacing-2-5);
      border: var(--ds-spacing-px) solid color-mix(in oklch, var(--ds-foreground-inverted) 18%, transparent);
      border-radius: var(--ds-radius-xl);
      background: var(--ds-background-inverted);
      box-shadow:
        0 var(--ds-spacing-4) var(--ds-spacing-10) color-mix(in oklch, var(--ds-fixed-black) 24%, transparent),
        0 var(--ds-spacing-0-5) var(--ds-spacing-1) color-mix(in oklch, var(--ds-fixed-black) 18%, transparent);
      color: var(--ds-foreground-inverted);
      opacity: 1;
      transform: none;
      transition:
        opacity var(--ds-motion-duration-moderate) var(--ds-motion-easing-out),
        transform var(--ds-motion-duration-moderate) var(--ds-motion-easing-out);
      --aesir-overlay-start-transform: translateY(var(--ds-spacing-2)) scale(0.97);
      --aesir-overlay-motion-duration: var(--ds-motion-duration-moderate);
    }

    .aesir-selection-toolbar[data-state='closed'] {
      opacity: 0;
      pointer-events: none;
    }

    .aesir-selection-toolbar[data-position='fixed'] {
      position: fixed;
      bottom: max(var(--ds-spacing-6), env(safe-area-inset-bottom));
      left: 50%;
      transform: translateX(-50%);
    }

    .aesir-selection-toolbar[data-position='fixed'][data-state='closed'] {
      transform: translateX(-50%) translateY(var(--ds-spacing-2)) scale(0.97);
    }

    .aesir-selection-toolbar[data-position='inline'] {
      max-width: 100%;
    }

    .aesir-selection-toolbar[data-position='inline'] > strong {
      min-width: 0;
    }

    .aesir-selection-toolbar[data-position='inline'] > strong > span:last-child {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @starting-style {
      .aesir-selection-toolbar[data-position='fixed'] {
        opacity: 0;
        transform: translateX(-50%) translateY(var(--ds-spacing-2)) scale(0.97);
      }

      .aesir-selection-toolbar[data-position='absolute'] {
        opacity: 0;
        transform: translateY(var(--ds-spacing-2)) scale(0.97);
      }
    }

    .aesir-selection-toolbar[data-position='absolute'] {
      position: absolute;
      right: var(--ds-spacing-4);
      bottom: var(--ds-spacing-4);
      left: var(--ds-spacing-4);
      width: auto;
    }

    .aesir-selection-toolbar[data-position='absolute'][data-state='closed'] {
      transform: translateY(var(--ds-spacing-2)) scale(0.97);
    }

    .aesir-selection-toolbar > strong {
      display: flex;
      align-items: center;
      gap: var(--ds-spacing-2);
      padding-inline: var(--ds-spacing-1);
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
      white-space: nowrap;
    }

    .aesir-selection-toolbar__count {
      display: grid;
      min-width: var(--ds-spacing-7);
      height: var(--ds-spacing-7);
      place-items: center;
      padding-inline: var(--ds-spacing-1-5);
      border-radius: var(--ds-radius-full);
      background: color-mix(in oklch, var(--ds-foreground-inverted) 14%, transparent);
      font-variant-numeric: tabular-nums;
    }

    .aesir-selection-toolbar .aesir-selection-toolbar__separator {
      height: var(--ds-spacing-6);
      background: color-mix(in oklch, var(--ds-foreground-inverted) 20%, transparent);
    }

    .aesir-selection-toolbar__actions {
      display: flex;
      min-width: 0;
      align-items: center;
      gap: var(--ds-spacing-1);
      overflow-x: auto;
    }

    .aesir-selection-toolbar .aesir-button[data-variant='ghost'] {
      background: color-mix(in oklch, var(--ds-foreground-inverted) 8%, transparent);
      color: var(--ds-foreground-inverted);
    }

    @media (hover: hover) and (pointer: fine) {
      .aesir-selection-toolbar .aesir-button[data-variant='ghost']:hover {
        background: color-mix(in oklch, var(--ds-foreground-inverted) 14%, transparent);
      }
    }

    .aesir-selection-toolbar .aesir-button[data-variant='ghost']:active {
      background: color-mix(in oklch, var(--ds-foreground-inverted) 20%, transparent);
    }

    .aesir-selection-toolbar .aesir-button[data-variant='ghost']:focus-visible {
      box-shadow: 0 0 0 var(--ds-spacing-0-5) color-mix(in oklch, var(--ds-foreground-inverted) 72%, transparent);
    }

    .aesir-selection-toolbar__clear {
      margin-left: var(--ds-spacing-1);
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-selection-toolbar {
        --aesir-overlay-start-transform: none;
      }

      .aesir-selection-toolbar[data-position='fixed'],
      .aesir-selection-toolbar[data-position='fixed'][data-state='closed'] {
        transform: translateX(-50%);
      }

      .aesir-selection-toolbar[data-position='absolute'][data-state='closed'] {
        transform: none;
      }
    }
  }
</style>
