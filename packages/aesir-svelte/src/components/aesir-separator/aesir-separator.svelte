<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  type SeparatorProps = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'style'> & {
    class?: string;
    style?: string;
    orientation?: 'horizontal' | 'vertical';
    decorative?: boolean;
  };

  let { class: className = '', style: rootStyle = undefined, orientation = 'horizontal', decorative = true, ...restProps }: SeparatorProps = $props();
</script>

<div
  class={`aesir-separator ${className}`.trim()}
  data-orientation={orientation}
  style={rootStyle}
  role={decorative ? 'presentation' : 'separator'}
  aria-orientation={decorative ? undefined : orientation}
  {...restProps}
></div>

<style>
  :global {
    .aesir-separator {
      flex: 0 0 auto;
      background: var(--ds-border);
    }
    .aesir-separator[data-orientation='horizontal'] {
      width: 100%;
      height: var(--ds-spacing-px);
    }
    .aesir-separator[data-orientation='vertical'] {
      width: var(--ds-spacing-px);
      height: 100%;
      min-height: var(--ds-spacing-4);
    }
  }
</style>
