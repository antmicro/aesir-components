<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  type CardProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'title'> & {
    class?: string;
    title?: string;
    titleElement?: keyof HTMLElementTagNameMap;
    description?: string;
    headerAction?: Snippet;
    footer?: Snippet;
    children?: Snippet;
  };
  let { class: className = '', title, titleElement = 'div', description, headerAction, footer, children, ...restProps }: CardProps = $props();
</script>

<div data-slot="card" class={`aesir-card ${className}`.trim()} {...restProps}>
  {#if title || description || headerAction}
    <div data-slot="card-header" class="aesir-card__header">
      {#if title || headerAction}
        <div class="aesir-card__heading">
          {#if title}<svelte:element this={titleElement} class="aesir-card__title">{title}</svelte:element>{/if}
          {@render headerAction?.()}
        </div>
      {/if}
      {#if description}<p class="aesir-card__description">{description}</p>{/if}
    </div>
  {/if}
  {#if children}
    <div data-slot="card-content" class="aesir-card__content">{@render children()}</div>
  {/if}
  {#if footer}
    <div data-slot="card-footer" class="aesir-card__footer">{@render footer()}</div>
  {/if}
</div>

<style>
  :global {
    .aesir-card {
      display: flex;
      flex-direction: column;
      gap: var(--ds-spacing-6);
      padding-block: var(--ds-spacing-6);
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-xl);
      background: var(--ds-background);
      color: var(--ds-foreground);
      box-shadow: 0 var(--ds-spacing-px) var(--ds-spacing-0-5) color-mix(in oklch, var(--ds-foreground) 6%, transparent);
    }

    .aesir-card__header {
      display: grid;
      gap: var(--ds-spacing-1-5);
      padding-inline: var(--ds-spacing-6);
    }

    .aesir-card__heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-spacing-4);
    }

    .aesir-card__title {
      min-width: 0;
      font-weight: var(--ds-font-weight-medium);
      line-height: 1;
      letter-spacing: var(--ds-font-letter-spacing-tight);
      overflow-wrap: anywhere;
    }

    .aesir-card__description {
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-font-line-height-lg);
      overflow-wrap: anywhere;
    }

    .aesir-card__content {
      padding-inline: var(--ds-spacing-6);
    }

    .aesir-card__footer {
      display: flex;
      align-items: center;
      gap: var(--ds-spacing-3);
      padding-inline: var(--ds-spacing-6);
    }
  }
</style>
