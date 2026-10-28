<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirIcon } from '../aesir-icon/index.js';
  type BreadcrumbItem = { id?: string; href?: string; label?: string; title?: string };
  type BreadcrumbProps = Omit<HTMLAttributes<HTMLElement>, 'class'> & {
    ref?: HTMLElement;
    class?: string;
    items?: BreadcrumbItem[];
    label?: string;
    separator?: string;
  };

  let { ref = $bindable(), class: className, items = [], label = 'Breadcrumb', separator = 'chevron-right', ...restProps }: BreadcrumbProps = $props();
  let list: HTMLOListElement;

  $effect(() => {
    const currentItem = items.at(-1);
    const breadcrumbList = list;
    const navigation = breadcrumbList?.parentElement;
    if (!currentItem || !navigation || !breadcrumbList) return;

    const revealCurrentPage = () => {
      navigation.scrollLeft = navigation.scrollWidth - navigation.clientWidth;
    };

    revealCurrentPage();
    const observer = new ResizeObserver(revealCurrentPage);
    observer.observe(navigation);
    observer.observe(breadcrumbList);
    return () => observer.disconnect();
  });
</script>

<nav bind:this={ref} data-slot="breadcrumb" class={`aesir-breadcrumb ${className ?? ''}`.trim()} aria-label={label} {...restProps}>
  <ol bind:this={list} class="aesir-breadcrumb__list">
    {#each items as item, index (item.id ?? `${item.href ?? item.label ?? item.title ?? 'breadcrumb'}-${index}`)}
      <li class="aesir-breadcrumb__item">
        {#if item.href && index < items.length - 1}
          <a class="aesir-breadcrumb__link" href={item.href}>{item.label ?? item.title}</a>
        {:else}
          <span class={index === items.length - 1 ? 'aesir-breadcrumb__current' : undefined} aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label ?? item.title}</span>
        {/if}
      </li>
      {#if index < items.length - 1}
        <li class="aesir-breadcrumb__separator" aria-hidden="true">
          <AesirIcon name={separator} />
        </li>
      {/if}
    {/each}
  </ol>
</nav>

<style>
  .aesir-breadcrumb {
    width: 100%;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scrollbar-color: transparent transparent;
    scrollbar-width: thin;
    transition: scrollbar-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
  }

  .aesir-breadcrumb:hover,
  .aesir-breadcrumb:focus-within {
    scrollbar-color: var(--ds-border-hover) transparent;
  }

  .aesir-breadcrumb::-webkit-scrollbar {
    height: var(--ds-spacing-2);
  }

  .aesir-breadcrumb::-webkit-scrollbar-track {
    background: transparent;
  }

  .aesir-breadcrumb::-webkit-scrollbar-thumb {
    border: var(--ds-spacing-0-5) solid transparent;
    border-radius: var(--ds-radius-full);
    background: transparent;
    background-clip: padding-box;
  }

  .aesir-breadcrumb:hover::-webkit-scrollbar-thumb,
  .aesir-breadcrumb:focus-within::-webkit-scrollbar-thumb {
    background-color: var(--ds-border-hover);
  }

  .aesir-breadcrumb__list {
    display: flex;
    width: max-content;
    min-width: 100%;
    flex-wrap: nowrap;
    align-items: center;
    gap: var(--ds-spacing-1-5);
    margin: 0;
    padding: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
    list-style: none;
    white-space: nowrap;
  }

  .aesir-breadcrumb__item,
  .aesir-breadcrumb__separator {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
  }

  .aesir-breadcrumb__link {
    color: inherit;
    text-decoration: none;
    transition: color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
  }

  .aesir-breadcrumb__link:hover {
    color: var(--ds-foreground);
  }

  .aesir-breadcrumb__link:focus-visible {
    border-radius: var(--ds-radius-sm);
    outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    outline-offset: var(--ds-spacing-0-5);
  }

  .aesir-breadcrumb__current {
    color: var(--ds-foreground);
  }

  .aesir-breadcrumb__separator {
    color: var(--ds-foreground-muted);
  }

  .aesir-breadcrumb__separator :global(svg) {
    width: var(--ds-spacing-3-5);
    height: var(--ds-spacing-3-5);
  }
</style>
