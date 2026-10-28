<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import type { ToggleSize, ToggleVariant } from './types.js';

  type ToggleProps = Omit<HTMLButtonAttributes, 'class' | 'onclick' | 'type'> & {
    class?: string;
    pressed?: boolean;
    controlled?: boolean;
    variant?: ToggleVariant;
    size?: ToggleSize;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    ref?: HTMLButtonElement;
    onpressedchange?: (pressed: boolean) => void;
    onclick?: (event: MouseEvent) => void;
    children?: Snippet;
  };

  let {
    class: className = '',
    pressed = $bindable(false),
    controlled = false,
    variant = 'default',
    size = 'default',
    disabled = false,
    type = 'button',
    ref = $bindable(),
    onpressedchange,
    onclick,
    children,
    ...restProps
  }: ToggleProps = $props();

  const handleClick = (event: MouseEvent) => {
    if (disabled) return;
    onclick?.(event);
    if (event.defaultPrevented) return;
    const nextPressed = !pressed;
    if (!controlled) pressed = nextPressed;
    onpressedchange?.(nextPressed);
  };
</script>

<button
  bind:this={ref}
  data-slot="aesir-toggle"
  {...restProps}
  data-state={pressed ? 'on' : 'off'}
  data-variant={variant}
  data-size={size}
  class={`aesir-toggle ${className}`.trim()}
  {type}
  {disabled}
  aria-pressed={pressed}
  onclick={handleClick}
>
  {@render children?.()}
</button>

<style>
  :global {
    .aesir-toggle {
      box-sizing: border-box;
      display: inline-flex;
      width: auto;
      align-items: center;
      justify-content: center;
      gap: var(--ds-spacing-2);
      flex-shrink: 0;
      appearance: none;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      white-space: nowrap;
      border: var(--ds-spacing-px) solid transparent;
      border-radius: var(--ds-radius-md);
      background: transparent;
      color: var(--ds-foreground-muted);
      font: inherit;
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
      line-height: 1;
      outline: none;
      transition:
        background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        border-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        box-shadow var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }

    .aesir-toggle:hover:not(:disabled) {
      background: var(--ds-surface-hover);
      color: var(--ds-foreground);
    }

    .aesir-toggle[data-state='on'] {
      background: var(--ds-accent-surface);
      color: var(--ds-accent-text-muted);
    }

    .aesir-toggle[data-variant='outline'] {
      border-color: var(--ds-border);
      background: var(--ds-background);
    }

    .aesir-toggle[data-variant='outline']:hover:not(:disabled) {
      border-color: var(--ds-border-hover);
      background: var(--ds-surface-hover);
    }

    .aesir-toggle[data-variant='outline'][data-state='on'] {
      border-color: var(--ds-accent-border);
      background: var(--ds-accent-surface);
    }

    .aesir-toggle[data-state='on']:hover:not(:disabled) {
      background: var(--ds-accent-surface-hover);
    }

    .aesir-toggle[data-variant='outline'][data-state='on']:hover:not(:disabled) {
      border-color: var(--ds-accent-border-hover);
    }

    .aesir-toggle[data-state='on']:active:not(:disabled) {
      background: var(--ds-accent-surface-active);
    }

    .aesir-toggle:focus-visible {
      box-shadow: 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-ring);
    }

    .aesir-toggle:active:not(:disabled) {
      transform: scale(0.97);
    }

    .aesir-toggle:disabled {
      pointer-events: none;
      opacity: var(--ds-opacity-50);
    }

    .aesir-toggle > svg {
      width: var(--ds-spacing-4);
      height: var(--ds-spacing-4);
      flex-shrink: 0;
      pointer-events: none;
    }

    .aesir-toggle[data-size='sm'] {
      height: var(--ds-spacing-8);
      padding-inline: var(--ds-spacing-2-5);
    }

    .aesir-toggle[data-size='default'] {
      height: var(--ds-spacing-9);
      padding-inline: var(--ds-spacing-3);
    }

    .aesir-toggle[data-size='lg'] {
      height: var(--ds-spacing-10);
      padding-inline: var(--ds-spacing-4);
    }

    .aesir-toggle[data-size='icon-sm'],
    .aesir-toggle[data-size='icon'],
    .aesir-toggle[data-size='icon-lg'] {
      padding: 0;
    }

    .aesir-toggle[data-size='icon-sm'] {
      width: var(--ds-spacing-8);
      height: var(--ds-spacing-8);
    }
    .aesir-toggle[data-size='icon'] {
      width: var(--ds-spacing-9);
      height: var(--ds-spacing-9);
    }
    .aesir-toggle[data-size='icon-lg'] {
      width: var(--ds-spacing-10);
      height: var(--ds-spacing-10);
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-toggle {
        transition-duration: var(--ds-motion-duration-instant);
      }
      .aesir-toggle:active:not(:disabled) {
        transform: none;
      }
    }
  }
</style>
