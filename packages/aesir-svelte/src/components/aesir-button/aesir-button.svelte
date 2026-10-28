<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
  import { createAttachmentKey } from 'svelte/attachments';
  import { mergeProps } from '../../utils/merge-props.js';

  type ButtonVariant = 'default' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
  type ButtonWidth = 'default' | 'full';
  type ButtonRadius = 'default' | 'none' | 'sm' | 'md' | 'lg' | 'full';
  type ButtonProps = Omit<HTMLButtonAttributes & HTMLAnchorAttributes, 'children' | 'class' | 'disabled' | 'href' | 'type'> & {
    class?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    width?: ButtonWidth;
    radius?: ButtonRadius;
    ref?: HTMLButtonElement | HTMLAnchorElement;
    href?: string;
    type?: HTMLButtonAttributes['type'];
    disabled?: boolean;
    child?: Snippet<[{ props: HTMLButtonAttributes | HTMLAnchorAttributes }]>;
    children?: Snippet;
  };

  let {
    class: className = '',
    variant = 'default',
    size = 'default',
    width = 'default',
    radius = undefined,
    ref = $bindable(),
    href = undefined,
    type = 'button',
    disabled = false,
    child = undefined,
    children = undefined,
    ...restProps
  }: ButtonProps = $props();

  const attachment = createAttachmentKey();
  const isLink = $derived(href != null);
  const elementProps = $derived(
    mergeProps(
      isLink
        ? {
            onclick: (event: MouseEvent) => {
              if (disabled) event.preventDefault();
            }
          }
        : undefined,
      {
        'data-slot': 'aesir-button',
        'data-variant': variant,
        'data-size': size,
        'data-width': width,
        'data-radius': radius,
        'data-disabled': disabled || undefined,
        class: ['aesir-button', className],
        ...(isLink ? { href, 'aria-disabled': disabled || undefined, tabindex: disabled ? -1 : undefined } : { type, disabled })
      },
      restProps,
      isLink && disabled ? { 'aria-disabled': true, tabindex: -1, 'data-disabled': true } : undefined,
      {
        [attachment]: (node: HTMLButtonElement | HTMLAnchorElement) => {
          ref = node;
          return () => {
            if (ref === node) ref = undefined;
          };
        }
      }
    ) as HTMLButtonAttributes | HTMLAnchorAttributes
  );
  const anchorProps = $derived(elementProps as HTMLAnchorAttributes);
  const buttonProps = $derived(elementProps as HTMLButtonAttributes);
</script>

{#if child}
  {@render child({ props: elementProps })}
{:else if isLink}
  <a {...anchorProps}>{@render children?.()}</a>
{:else}
  <button {...buttonProps}>{@render children?.()}</button>
{/if}

<style>
  :global {
    .aesir-button {
      box-sizing: border-box;
      display: inline-flex;
      width: auto;
      max-width: 100%;
      justify-self: start;
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
      border-radius: var(--ds-radius-lg);
      font: inherit;
      font-size: var(--ds-font-size-sm);
      line-height: 1;
      text-decoration: none;
      outline: none;
      transition:
        background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        border-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        box-shadow var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }

    .aesir-button:active:not(:disabled):not([aria-disabled='true']) {
      transform: scale(0.97);
    }

    .aesir-button[data-width='full']:active:not(:disabled):not([aria-disabled='true']) {
      transform: translateY(var(--ds-spacing-px));
    }

    .aesir-button:focus-visible {
      box-shadow: 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-ring);
    }

    .aesir-button:disabled,
    .aesir-button[aria-disabled='true'] {
      pointer-events: none;
      opacity: var(--ds-opacity-50);
    }

    .aesir-button > svg {
      width: var(--ds-spacing-4);
      height: var(--ds-spacing-4);
      flex-shrink: 0;
      pointer-events: none;
    }

    .aesir-button[data-variant='default'] {
      background: var(--ds-foreground);
      color: var(--ds-background);
    }
    .aesir-button[data-variant='default']:hover {
      background: var(--ds-foreground-muted);
      color: var(--ds-background-secondary);
    }
    .aesir-button[data-variant='accent'] {
      border-color: color-mix(in oklch, var(--ds-background) 24%, transparent);
      background: var(--ds-accent);
      color: var(--ds-accent-foreground);
    }
    .aesir-button[data-variant='accent']:hover {
      border-color: color-mix(in oklch, var(--ds-background) 32%, transparent);
      background: var(--ds-accent-hover);
    }
    .aesir-button[data-variant='secondary'] {
      background: var(--ds-surface);
      color: var(--ds-foreground);
    }
    .aesir-button[data-variant='secondary']:hover {
      background: var(--ds-surface-hover);
    }
    .aesir-button[data-variant='outline'] {
      border-color: var(--ds-border);
      background: var(--ds-background);
      color: var(--ds-foreground);
    }
    .aesir-button[data-variant='outline']:hover {
      border-color: var(--ds-border-hover);
      background: var(--ds-surface-hover);
    }
    .aesir-button[data-variant='ghost'] {
      background: transparent;
      color: var(--ds-foreground);
    }
    .aesir-button[data-variant='ghost']:hover {
      background: var(--ds-surface-hover);
    }
    .aesir-button[data-variant='destructive'] {
      border-color: var(--ds-border-red);
      background: var(--ds-emphasis-red);
      color: var(--ds-accent-foreground);
    }
    .aesir-button[data-variant='destructive']:hover {
      border-color: var(--ds-border-red);
      background: var(--ds-emphasis-hover-red);
      color: var(--ds-accent-foreground);
    }

    .aesir-button[data-size='default'] {
      height: var(--ds-spacing-9);
      padding: var(--ds-spacing-2) var(--ds-spacing-4);
    }
    .aesir-button[data-size='sm'] {
      height: var(--ds-spacing-8);
      gap: var(--ds-spacing-1-5);
      padding: var(--ds-spacing-1-5) var(--ds-spacing-3);
      border-radius: var(--ds-radius-md);
    }
    .aesir-button[data-size='lg'] {
      height: var(--ds-spacing-10);
      padding: var(--ds-spacing-2-5) var(--ds-spacing-6);
      border-radius: var(--ds-radius-md);
    }
    .aesir-button[data-size='icon'],
    .aesir-button[data-size='icon-sm'],
    .aesir-button[data-size='icon-lg'] {
      padding: 0;
    }
    .aesir-button[data-size='icon'] {
      width: var(--ds-spacing-9);
      height: var(--ds-spacing-9);
    }
    .aesir-button[data-size='icon-sm'] {
      width: var(--ds-spacing-8);
      height: var(--ds-spacing-8);
    }
    .aesir-button[data-size='icon-lg'] {
      width: var(--ds-spacing-10);
      height: var(--ds-spacing-10);
    }

    .aesir-button[data-width='full'] {
      width: 100%;
      justify-self: stretch;
    }

    .aesir-button[data-radius='none'] {
      border-radius: var(--ds-radius-none);
    }
    .aesir-button[data-radius='full'] {
      border-radius: var(--ds-radius-full);
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-button {
        transition-duration: var(--ds-motion-duration-instant);
      }

      .aesir-button:active:not(:disabled):not([aria-disabled='true']) {
        transform: none;
      }
    }
  }
</style>
