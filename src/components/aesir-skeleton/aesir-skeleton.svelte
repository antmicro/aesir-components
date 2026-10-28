<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  type SkeletonProps = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'style'> & {
    class?: string;
    style?: string;
    width?: string | number;
    height?: string | number;
    radius?: 'sm' | 'md' | 'lg' | 'full';
    animated?: boolean;
  };
  let { class: className = '', style: rootStyle, width, height, radius = 'md', animated = true, ...restProps }: SkeletonProps = $props();
  const dimensions = $derived(
    [
      rootStyle,
      width != null && width !== '' ? `width:${typeof width === 'number' ? `${width}px` : width}` : '',
      height != null && height !== '' ? `height:${typeof height === 'number' ? `${height}px` : height}` : ''
    ]
      .filter(Boolean)
      .join(';')
  );
</script>

<span class={`aesir-skeleton ${className}`.trim()} data-radius={radius} data-animated={animated || undefined} style={dimensions} aria-hidden="true" {...restProps}></span>

<style>
  :global {
    .aesir-skeleton {
      display: block;
      width: 100%;
      height: var(--ds-spacing-4);
      overflow: hidden;
      border-radius: var(--ds-radius-md);
      background: var(--ds-surface-active);
    }
    .aesir-skeleton[data-radius='sm'] {
      border-radius: var(--ds-radius-sm);
    }
    .aesir-skeleton[data-radius='lg'] {
      border-radius: var(--ds-radius-lg);
    }
    .aesir-skeleton[data-radius='full'] {
      border-radius: var(--ds-radius-full);
    }
    .aesir-skeleton[data-animated] {
      background: linear-gradient(100deg, var(--ds-surface-active) 30%, var(--ds-surface-hover) 50%, var(--ds-surface-active) 70%);
      background-size: 240% 100%;
      animation: aesir-skeleton-shimmer 1.5s var(--ds-motion-easing-subtle) infinite;
    }
    @keyframes aesir-skeleton-shimmer {
      to {
        background-position-x: -240%;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .aesir-skeleton[data-animated] {
        animation: none;
        background: var(--ds-surface-active);
      }
    }
  }
</style>
