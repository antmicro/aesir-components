<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirButton } from '../aesir-button/index.js';
  import { AesirIcon } from '../aesir-icon/index.js';

  type PaginationProps = Omit<HTMLAttributes<HTMLElement>, 'class' | 'style'> & {
    class?: string;
    style?: string;
    page?: number;
    totalPages?: number;
    siblingCount?: number;
    disabled?: boolean;
    label?: string;
    onpagechange?: (page: number) => void;
  };
  let {
    class: className = '',
    style: rootStyle,
    page = $bindable(1),
    totalPages = 1,
    siblingCount = 1,
    disabled = false,
    label = 'Pagination',
    onpagechange,
    ...restProps
  }: PaginationProps = $props();
  const finiteInteger = (candidate: number, fallback: number) => (Number.isFinite(Number(candidate)) ? Math.floor(Number(candidate)) : fallback);
  const total = $derived(Math.min(Number.MAX_SAFE_INTEGER, Math.max(1, finiteInteger(totalPages, 1))));
  const current = $derived(Math.min(Math.max(1, finiteInteger(page, 1)), total));
  const siblings = $derived(Math.min(total - 1, Math.max(0, finiteInteger(siblingCount, 1))));
  $effect(() => {
    if (page !== current) page = current;
  });
  const pages = $derived.by(() => {
    const visible = [1];
    if (total !== 1) visible.push(total);
    for (let value = Math.max(1, current - siblings); value <= Math.min(total, current + siblings); value += 1) {
      if (!visible.includes(value)) visible.push(value);
    }
    const sorted = visible.sort((a, b) => a - b);
    return sorted.flatMap((value, index) => {
      if (!index) return [value];
      const gap = value - sorted[index - 1];
      if (gap === 2) return [value - 1, value];
      return gap > 2 ? ['ellipsis', value] : [value];
    });
  });
  let pageList: HTMLDivElement;

  $effect(() => {
    if (!pageList || !pages.includes(current)) return;
    const selected = pageList.querySelector<HTMLButtonElement>('[aria-current="page"]');
    if (!selected) return;

    const revealSelected = () => {
      const listBounds = pageList.getBoundingClientRect();
      const selectedBounds = selected.getBoundingClientRect();
      if (selectedBounds.left < listBounds.left) pageList.scrollLeft += selectedBounds.left - listBounds.left;
      else if (selectedBounds.right > listBounds.right) pageList.scrollLeft += selectedBounds.right - listBounds.right;
    };

    revealSelected();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(revealSelected);
    observer.observe(pageList);
    observer.observe(selected);
    return () => observer.disconnect();
  });

  const select = (next: number) => {
    if (disabled || next === current || next < 1 || next > total) return;
    page = next;
    onpagechange?.(next);
  };
</script>

<nav class={`aesir-pagination ${className}`.trim()} style={rootStyle} aria-label={label} {...restProps}>
  <AesirButton variant="ghost" size="icon-sm" disabled={disabled || current === 1} aria-label="Previous page" onclick={() => select(current - 1)}>
    <AesirIcon name="chevron-left" size={16} />
  </AesirButton>
  <div bind:this={pageList} class="aesir-pagination__pages">
    {#each pages as item, index (item === 'ellipsis' ? `ellipsis-${index}` : `page-${item}`)}
      {#if item === 'ellipsis'}<span class="aesir-pagination__ellipsis" aria-hidden="true"><AesirIcon name="ellipsis" size={16} /></span>
      {:else}<AesirButton
          variant={item === current ? 'secondary' : 'ghost'}
          size="icon-sm"
          {disabled}
          aria-label={`Page ${item}`}
          aria-current={item === current ? 'page' : undefined}
          onclick={() => typeof item === 'number' && select(item)}
        >
          {item}
        </AesirButton>{/if}
    {/each}
  </div>
  <AesirButton variant="ghost" size="icon-sm" disabled={disabled || current === total} aria-label="Next page" onclick={() => select(current + 1)}>
    <AesirIcon name="chevron-right" size={16} />
  </AesirButton>
</nav>

<style>
  :global {
    .aesir-pagination {
      display: flex;
      width: fit-content;
      max-width: 100%;
      align-items: center;
      gap: var(--ds-spacing-1);
    }
    .aesir-pagination__pages {
      display: flex;
      min-width: 0;
      align-items: center;
      gap: var(--ds-spacing-1);
      overflow-x: auto;
      overscroll-behavior-x: contain;
    }
    .aesir-pagination__pages .aesir-button[data-size='icon-sm'] {
      width: auto;
      min-width: var(--ds-spacing-8);
      padding-inline: var(--ds-spacing-2);
    }
    .aesir-pagination__ellipsis {
      display: inline-flex;
      width: var(--ds-spacing-8);
      height: var(--ds-spacing-8);
      flex: 0 0 var(--ds-spacing-8);
      align-items: center;
      justify-content: center;
      color: var(--ds-foreground-muted);
      cursor: default;
      user-select: none;
      -webkit-user-select: none;
    }
    .aesir-pagination [aria-current='page'] {
      pointer-events: none;
    }
  }
</style>
