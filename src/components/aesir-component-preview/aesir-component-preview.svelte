<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { mergeProps } from '../../utils/merge-props.js';

  type ComponentPreviewProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
    contentless?: boolean;
    embedded?: boolean;
    contentClass?: string;
    contentStyle?: string;
    children?: Snippet;
    class?: string;
  };
  let { contentless = false, embedded = false, contentClass = '', contentStyle, children, class: className = '', ...restProps }: ComponentPreviewProps = $props();

  const resolvedProps = $derived(
    mergeProps(
      {
        class: ['aesir-component-preview', className],
        'data-embedded': embedded || undefined
      },
      restProps
    )
  );
</script>

<div {...resolvedProps}>
  {#if contentless}
    {@render children?.()}
  {:else}
    <div class={`aesir-component-preview__content ${contentClass}`.trim()} style={contentStyle}>{@render children?.()}</div>
  {/if}
</div>

<style>
  :global {
    .aesir-component-preview {
      min-width: 0;
      overflow: hidden;
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-xl);
      background: var(--ds-background-secondary);
    }
    .aesir-component-preview[data-embedded] {
      border: 0;
      border-radius: 0;
    }
    .aesir-component-preview__content {
      display: flex;
      min-height: var(--ds-sizing-3xs);
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: var(--ds-spacing-4);
      padding: var(--ds-spacing-8) var(--ds-spacing-6);
    }
    @media (max-width: 40rem) {
      .aesir-component-preview__content {
        gap: var(--ds-spacing-4);
        padding: var(--ds-spacing-5) var(--ds-spacing-4);
      }
    }
  }
</style>
