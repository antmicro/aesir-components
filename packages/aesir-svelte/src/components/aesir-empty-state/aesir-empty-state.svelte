<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  type EmptyStateProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'class' | 'style' | 'title'> & {
    class?: string;
    style?: string;
    title?: string;
    description?: string;
    size?: 'sm' | 'default';
    icon?: Snippet;
    actions?: Snippet;
    children?: Snippet;
  };
  let { class: className = '', style: rootStyle, title, description, size = 'default', icon, actions, children, ...restProps }: EmptyStateProps = $props();
</script>

<section class={`aesir-empty-state ${className}`.trim()} data-size={size} style={rootStyle} {...restProps}>
  {#if icon}<div class="aesir-empty-state__icon" aria-hidden="true">{@render icon()}</div>{/if}
  {#if title || description || children}
    <div class="aesir-empty-state__copy">
      {#if title}<h3>{title}</h3>{/if}
      {#if description}<p>{description}</p>{/if}
      {@render children?.()}
    </div>
  {/if}
  {#if actions}<div class="aesir-empty-state__actions">{@render actions()}</div>{/if}
</section>

<style>
  :global {
    .aesir-empty-state {
      box-sizing: border-box;
      display: grid;
      width: 100%;
      justify-items: center;
      gap: var(--ds-spacing-4);
      padding: var(--ds-spacing-10) var(--ds-spacing-6);
      color: var(--ds-foreground);
      text-align: center;
    }
    .aesir-empty-state[data-size='sm'] {
      gap: var(--ds-spacing-3);
      padding: var(--ds-spacing-6) var(--ds-spacing-4);
    }
    .aesir-empty-state__icon {
      display: grid;
      width: var(--ds-spacing-10);
      height: var(--ds-spacing-10);
      place-items: center;
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-lg);
      background: var(--ds-background-secondary);
      color: var(--ds-foreground-muted);
    }
    .aesir-empty-state__icon :where(svg) {
      width: var(--ds-spacing-5);
      height: var(--ds-spacing-5);
    }
    .aesir-empty-state__copy {
      display: grid;
      min-width: 0;
      width: 100%;
      max-width: var(--ds-sizing-md);
      gap: var(--ds-spacing-1-5);
      overflow-wrap: anywhere;
    }
    .aesir-empty-state h3,
    .aesir-empty-state p {
      margin: 0;
    }
    .aesir-empty-state h3 {
      color: var(--ds-foreground);
      font-size: var(--ds-font-size-base);
      font-weight: var(--ds-font-weight-medium);
      line-height: var(--ds-font-line-height-base);
    }
    .aesir-empty-state p,
    .aesir-empty-state__copy {
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-font-line-height-sm);
    }
    .aesir-empty-state__actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--ds-spacing-2);
    }
  }
</style>
