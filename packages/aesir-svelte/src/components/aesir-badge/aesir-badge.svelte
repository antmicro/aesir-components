<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  type BadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'class'> & {
    class?: string;
    variant?: 'default' | 'secondary' | 'outline' | 'accent' | 'info' | 'success' | 'warning' | 'destructive';
    size?: 'default' | 'xs' | 'sm' | 'lg';
    font?: 'default' | 'mono';
    children?: Snippet;
  };

  let { class: className = '', variant = 'default', size = 'default', font = 'default', children, ...restProps }: BadgeProps = $props();
</script>

<span class={`aesir-badge ${className}`.trim()} data-variant={variant} data-size={size} data-font={font} data-slot="badge" {...restProps}>
  {@render children?.()}
</span>

<style>
  :global {
    .aesir-badge {
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

    .aesir-badge[data-font='mono'] {
      font-family: var(--ds-font-family-mono);
      font-variant-numeric: tabular-nums;
    }

    .aesir-badge[data-size='xs'] {
      padding: 0 var(--ds-spacing-1-5);
      font-size: var(--ds-font-size-xxs);
      line-height: var(--ds-font-line-height-xs);
    }

    .aesir-badge[data-size='sm'] {
      padding-block: 0;
      font-size: var(--ds-font-size-xs);
      line-height: var(--ds-font-line-height-xs);
    }

    .aesir-badge[data-size='lg'] {
      padding: var(--ds-spacing-1) var(--ds-spacing-2-5);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-font-line-height-sm);
    }

    .aesir-badge > svg {
      width: var(--ds-spacing-3);
      height: var(--ds-spacing-3);
      flex-shrink: 0;
    }

    .aesir-badge[data-variant='secondary'] {
      background: var(--ds-surface);
      color: var(--ds-foreground);
    }

    .aesir-badge[data-variant='outline'] {
      border-color: var(--ds-border);
      background: transparent;
      color: var(--ds-foreground);
    }

    .aesir-badge[data-variant='accent'] {
      background: var(--ds-accent-surface-hover);
      color: var(--ds-accent-text-muted);
    }

    .aesir-badge[data-variant='info'] {
      background: var(--ds-surface-hover-blue);
      color: var(--ds-foreground-muted-blue);
    }

    .aesir-badge[data-variant='success'] {
      background: var(--ds-surface-hover-green);
      color: var(--ds-foreground-muted-green);
    }

    .aesir-badge[data-variant='warning'] {
      background: var(--ds-surface-hover-orange);
      color: var(--ds-foreground-muted-orange);
    }

    .aesir-badge[data-variant='destructive'] {
      background: var(--ds-surface-hover-red);
      color: var(--ds-foreground-muted-red);
    }
  }
</style>
