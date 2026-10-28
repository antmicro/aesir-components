<script>
  import { AesirBadge, AesirButton, AesirDropdown, AesirIcon, AesirInput } from '@aesir/svelte';
  import { ESTIMATE_UNITS, formatEstimate } from './requirements-model.js';
  let {
    query,
    updateSearch,
    excludeTerminalFromTotal,
    estimateUnit,
    totalEstimate,
    calculationMenuItems,
    selectCalculationSetting,
    filterMenuItems,
    selectFilter,
    hasActiveFilters,
    viewMenuItems,
    selectView,
    displayMode
  } = $props();
</script>

{#snippet filterItemContent({ item })}
  <span class="filter-item">
    <span class="filter-checkbox" data-checked={item.checked || undefined}>
      {#if item.checked}<AesirIcon name="check" size={12} />{/if}
    </span>
    <AesirIcon name={item.icon} size={15} />
    <span>{item.label}</span>
  </span>
{/snippet}

<div class="explorer__toolbar" aria-label="Requirements controls">
  <AesirInput class="explorer__search" size="sm" type="search" bind:value={() => query, updateSearch} placeholder="Search requirements or issues…" aria-label="Search requirements or issues" />
  <AesirBadge
    class="explorer__total"
    variant="outline"
    size="sm"
    font="mono"
    title={`${excludeTerminalFromTotal ? 'Total excludes done and rejected requirements' : 'Total includes all requirements'} · ${ESTIMATE_UNITS[estimateUnit].label}`}
  >
    {formatEstimate(totalEstimate, estimateUnit)}
  </AesirBadge>
  <AesirDropdown label="Estimate settings" align="end" closeOnSelect={false} items={calculationMenuItems} itemContent={filterItemContent} onselect={selectCalculationSetting}>
    {#snippet trigger(props)}
      <AesirButton
        {...props}
        class="toolbar-icon-button"
        data-active={excludeTerminalFromTotal || estimateUnit !== 'weeks' || undefined}
        size="icon-sm"
        variant="outline"
        aria-label="Estimate settings"
        title="Estimate settings"
      >
        <AesirIcon name="settings" size={15} />
      </AesirButton>
    {/snippet}
  </AesirDropdown>
  <AesirDropdown label="Filter requirements" closeOnSelect={false} items={filterMenuItems} itemContent={filterItemContent} onselect={selectFilter}>
    {#snippet trigger(props)}
      <AesirButton {...props} class="toolbar-icon-button" data-active={hasActiveFilters || undefined} size="icon-sm" variant="outline" aria-label="Filter requirements" title="Filter requirements">
        <AesirIcon name="list-filter" size={15} />
      </AesirButton>
    {/snippet}
  </AesirDropdown>
  <AesirDropdown label="View options" align="end" closeOnSelect={false} items={viewMenuItems} itemContent={filterItemContent} onselect={selectView}>
    {#snippet trigger(props)}
      <AesirButton {...props} class="toolbar-icon-button" size="icon-sm" variant="outline" aria-label="View options" title="View options">
        <AesirIcon name="eye" size={15} />
      </AesirButton>
    {/snippet}
  </AesirDropdown>
  <AesirButton class="view-mode-toggle" size="sm" variant="outline" onclick={() => selectView({ value: `mode:${displayMode === 'compact' ? 'expanded' : 'compact'}` })}>
    <AesirIcon name={displayMode === 'compact' ? 'columns-2' : 'align-left'} size={15} />
    {displayMode === 'compact' ? 'Expanded view' : 'Compact view'}
  </AesirButton>
</div>

<style>
  .explorer__toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  .explorer__toolbar {
    gap: var(--ds-spacing-2);
    padding: var(--ds-spacing-2) var(--ds-spacing-3);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background-secondary);
  }

  .explorer__toolbar :global(.explorer__search) {
    flex: 1 0 14rem;
    min-width: min(14rem, 100%);
    max-width: 18rem;
    margin-right: auto;
  }

  .explorer__toolbar :global(.explorer__total) {
    flex: none;
    color: var(--ds-foreground-muted);
  }

  .explorer__toolbar :global(.toolbar-icon-button[data-active]) {
    position: relative;
  }

  .explorer__toolbar :global(.toolbar-icon-button[data-active]::after) {
    position: absolute;
    top: var(--ds-spacing-1);
    right: var(--ds-spacing-1);
    width: var(--ds-spacing-1-5);
    height: var(--ds-spacing-1-5);
    border: var(--ds-spacing-px) solid var(--ds-background-secondary);
    border-radius: var(--ds-radius-full);
    background: var(--ds-emphasis-blue);
    content: '';
  }

  :global(.view-mode-toggle) {
    width: 10rem;
    flex: none;
  }

  .filter-item {
    display: flex;
    min-width: 10rem;
    align-items: center;
    gap: var(--ds-spacing-2);
  }

  .filter-checkbox {
    display: grid;
    width: var(--ds-spacing-4);
    height: var(--ds-spacing-4);
    place-items: center;
    flex: 0 0 auto;
    border: var(--ds-spacing-px) solid var(--ds-border-hover);
    border-radius: var(--ds-radius-sm);
    color: var(--ds-accent-foreground);
  }

  .filter-checkbox[data-checked] {
    border-color: var(--ds-emphasis-blue);
    background: var(--ds-emphasis-blue);
  }

  @media (max-width: 56rem) {
    .explorer__toolbar {
      position: sticky;
      left: 0;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }
  }

  @media (max-width: 40rem) {
    :global(.view-mode-toggle) {
      display: none;
    }

    .explorer__toolbar :global(.explorer__search) {
      max-width: none;
      flex-basis: 100%;
    }
  }
</style>
