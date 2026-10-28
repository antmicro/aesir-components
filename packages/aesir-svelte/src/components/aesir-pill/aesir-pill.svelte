<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  type PillProps = Omit<HTMLAnchorAttributes, 'children' | 'class' | 'href'> & {
    class?: string;
    href?: string;
    size?: 'default' | 'xs' | 'sm' | 'lg';
    children?: Snippet;
  };

  let { class: className = '', href = undefined, size = 'default', children = undefined, ...restProps }: PillProps = $props();
</script>

<!-- Consumer-provided href may be internal or external; the component cannot resolve it ahead of time. -->
<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
<a class={`aesir-pill ${className}`.trim()} data-variant="outline" data-size={size} data-slot="pill" {href} {...restProps}>
  <span>{@render children?.()}</span>
</a>

<style>
  :global {
    .aesir-pill {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      gap: var(--ds-spacing-1);
      padding: var(--ds-spacing-0-5) var(--ds-spacing-2);
      border: var(--ds-spacing-px) solid transparent;
      border-radius: var(--ds-radius-full);
      background: var(--ds-foreground);
      color: var(--ds-background);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-medium);
      line-height: var(--ds-font-line-height-xs);
      white-space: nowrap;
    }

    .aesir-pill[data-size='xs'] {
      padding: var(--ds-spacing-0-5) var(--ds-spacing-1-5);
      font-size: var(--ds-font-size-xxs);
      line-height: var(--ds-font-line-height-xs);
    }

    .aesir-pill[data-size='sm'] {
      padding-block: 0;
      font-size: var(--ds-font-size-xs);
      line-height: var(--ds-font-line-height-xs);
    }

    .aesir-pill[data-size='lg'] {
      padding: var(--ds-spacing-1) var(--ds-spacing-2-5);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-font-line-height-sm);
    }

    .aesir-pill > svg {
      width: var(--ds-spacing-3);
      height: var(--ds-spacing-3);
      flex-shrink: 0;
    }

    .aesir-pill[data-variant='secondary'] {
      background: var(--ds-surface);
      color: var(--ds-foreground);
    }

    .aesir-pill[data-variant='outline'] {
      border-color: var(--ds-border);
      background: transparent;
      color: var(--ds-foreground);
    }

    .aesir-pill[data-variant='accent'] {
      background: var(--ds-accent-surface-hover);
      color: var(--ds-accent-text-muted);
    }

    .aesir-pill[data-variant='info'] {
      background: var(--ds-surface-hover-blue);
      color: var(--ds-foreground-muted-blue);
    }

    .aesir-pill[data-variant='success'] {
      background: var(--ds-surface-hover-green);
      color: var(--ds-foreground-muted-green);
    }

    .aesir-pill[data-variant='warning'] {
      background: var(--ds-surface-hover-orange);
      color: var(--ds-foreground-muted-orange);
    }

    .aesir-pill[data-variant='destructive'] {
      background: var(--ds-surface-hover-red);
      color: var(--ds-foreground-muted-red);
    }

    .aesir-pill {
      flex-wrap: nowrap;
      text-decoration: none;
      white-space: nowrap;
      cursor: pointer;
      transition:
        background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        border-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }

    .aesir-pill > span {
      display: inline-flex;
      align-items: center;
      gap: var(--ds-spacing-1);
      line-height: inherit;
    }

    .aesir-pill > span > svg {
      width: var(--ds-spacing-3);
      height: var(--ds-spacing-3);
      flex-shrink: 0;
    }

    .aesir-pill:hover {
      border-color: var(--ds-border-hover);
      background: var(--ds-surface-hover);
      color: var(--ds-foreground);
    }

    .aesir-pill:focus-visible {
      outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
      outline-offset: var(--ds-spacing-0-5);
    }

    .aesir-pill:active {
      transform: scale(0.97);
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-pill {
        transition-duration: var(--ds-motion-duration-instant);
      }

      .aesir-pill:active {
        transform: none;
      }
    }
  }
</style>
