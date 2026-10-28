<script lang="ts" generics="Row extends Record<string, unknown> = Record<string, unknown>">
  import type { Snippet } from 'svelte';
  import { createClipboard } from '../../utils/clipboard.svelte.js';
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirAvatar } from '../aesir-avatar/index.js';
  import { AesirButton } from '../aesir-button/index.js';
  import { AesirCheckbox } from '../aesir-checkbox/index.js';
  import { AesirIcon } from '../aesir-icon/index.js';
  import { AesirIconSwap } from '../aesir-icon-swap/index.js';

  type RowKey = string | number;
  type TableColumn = {
    key: string;
    label: string;
    displayKey?: string;
    align?: 'start' | 'center' | 'end';
    width?: string;
    sortable?: boolean;
    rowHeader?: boolean;
    linkKey?: string;
    avatarKey?: string;
    avatarSrcKey?: string;
    avatarAltKey?: string;
    avatarFallbackKey?: string;
    cell?: Snippet<[{ row: Row; value: unknown }]>;
  };
  type TableProps = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'style'> & {
    class?: string;
    style?: string;
    tableStyle?: string;
    columns?: TableColumn[];
    rows?: Row[];
    caption?: string;
    showHeader?: boolean;
    variant?: string;
    density?: string;
    layout?: 'auto' | 'fixed';
    cell?: Snippet<[{ row: Row; column: TableColumn; value: unknown }]>;
    rowActions?: Snippet<[{ row: Row; index: number }]>;
    copyable?: boolean;
    copyColumn?: string;
    getCopyValue?: (row: Row) => unknown;
    copyLabel?: string;
    selectable?: boolean;
    selected?: RowKey[];
    rowKey?: string;
    getRowKey?: (row: Row, index: number) => RowKey;
    selectionLabel?: string;
    onselectionchange?: (keys: RowKey[]) => void;
    sortKey?: string;
    sortDirection?: 'ascending' | 'descending';
    onsortchange?: (sort: { key: string; direction: 'ascending' | 'descending' }) => void;
  };
  let {
    class: className = '',
    style: rootStyle,
    tableStyle,
    columns = [],
    rows = [],
    caption,
    showHeader = true,
    variant = 'default',
    density = 'default',
    layout = 'auto',
    cell,
    rowActions,
    copyable = false,
    copyColumn,
    getCopyValue,
    copyLabel = 'Copy value',
    selectable = false,
    selected = $bindable([]),
    rowKey = 'id',
    getRowKey,
    selectionLabel = 'Select row',
    onselectionchange,
    sortKey = $bindable(),
    sortDirection = $bindable('ascending'),
    onsortchange,
    ...restProps
  }: TableProps = $props();

  const clipboard = createClipboard<string>();
  const copiedSignature = $derived(clipboard.copied);
  const announcement = $derived(copiedSignature !== undefined ? 'Copied' : '');
  const copySignature = (key: RowKey, value: string) => JSON.stringify([key, value]);

  const resolveRowKey = (row: Row, index: number): RowKey => getRowKey?.(row, index) ?? (row[rowKey] as RowKey | undefined) ?? index;
  const pageKeys = $derived(rows.map(resolveRowKey));
  const allSelected = $derived(Boolean(pageKeys.length) && pageKeys.every((key) => selected.includes(key)));
  const someSelected = $derived(!allSelected && pageKeys.some((key) => selected.includes(key)));

  const updateSelection = (next: RowKey[]) => {
    selected = next;
    onselectionchange?.(next);
  };

  const toggleRow = (key: RowKey, checked: boolean) => {
    if (checked && !selected.includes(key)) updateSelection([...selected, key]);
    else if (!checked) updateSelection(selected.filter((entry) => entry !== key));
  };

  const togglePage = (checked: boolean) => {
    if (checked) updateSelection([...selected, ...pageKeys.filter((key) => !selected.includes(key))]);
    else updateSelection(selected.filter((entry) => !pageKeys.includes(entry)));
  };

  const toggleSort = (key: string) => {
    const direction = sortKey === key && sortDirection === 'ascending' ? 'descending' : 'ascending';
    sortKey = key;
    sortDirection = direction;
    onsortchange?.({ key, direction });
  };

  const resolveDisplayValue = (row: Row, column: TableColumn) => {
    const displayValue = column.displayKey ? row[column.displayKey] : undefined;
    return displayValue ?? row[column.key];
  };

  const rowSelectionName = (row: Row, key: RowKey) => {
    const displayValue = columns[0] ? resolveDisplayValue(row, columns[0]) : undefined;
    if (typeof displayValue === 'string' && displayValue.trim()) return `${selectionLabel}: ${displayValue}`;
    if (typeof displayValue === 'number' && Number.isFinite(displayValue)) return `${selectionLabel}: ${displayValue}`;
    return `${selectionLabel}: ${key}`;
  };

  const resolveCopyValue = (row: Row) => {
    const key = copyColumn ?? columns.at(-1)?.key;
    const value = getCopyValue ? getCopyValue(row) : key ? row[key] : undefined;
    return value == null ? null : String(value);
  };

  const copyRowValue = async (row: Row, rowKey: RowKey) => {
    const value = resolveCopyValue(row);
    if (value == null) return;

    await clipboard.copy(value, copySignature(rowKey, value));
  };
</script>

{#snippet renderDefaultValue(row: Row, column: TableColumn)}
  {#if column.linkKey && row[column.linkKey]}
    <!-- eslint-disable svelte/no-navigation-without-resolve -->
    <a class="aesir-table__link" href={String(row[column.linkKey])}>
      {#if column.avatarKey && row[column.avatarKey]}
        <AesirAvatar
          src={column.avatarSrcKey ? String(row[column.avatarSrcKey] ?? '') : undefined}
          alt={column.avatarAltKey ? String(row[column.avatarAltKey] ?? '') : ''}
          fallback={column.avatarFallbackKey ? String(row[column.avatarFallbackKey] ?? '') : ''}
          size="sm"
        />
      {/if}
      <span class="aesir-table__link-label">{resolveDisplayValue(row, column)}</span>
    </a>
  {:else}
    {resolveDisplayValue(row, column)}
  {/if}
{/snippet}

<div class={`aesir-table-wrap ${className}`.trim()} data-variant={variant} data-density={density} data-layout={layout} data-copyable={copyable || undefined} style={rootStyle}>
  <span class="aesir-table__announcement" aria-live="polite">{announcement}</span>
  <table class="aesir-table" style={tableStyle} {...restProps}>
    {#if caption}<caption>{caption}</caption>{/if}
    {#if layout === 'fixed'}
      <colgroup>
        {#if selectable}<col class="aesir-table__selection-col" />{/if}
        {#each columns as column (column.key)}<col style:width={column.width} />{/each}
        {#if copyable || rowActions}<col class="aesir-table__action-col" />{/if}
      </colgroup>
    {/if}
    {#if showHeader}
      <thead>
        <tr>
          {#if selectable}
            <th class="aesir-table__selection" scope="col">
              <AesirCheckbox
                checked={allSelected}
                indeterminate={someSelected}
                disabled={pageKeys.length === 0}
                aria-label="Select all rows on this page"
                onchange={(event) => togglePage(event.currentTarget.checked)}
              />
            </th>
          {/if}
          {#each columns as column (column.key)}
            <th scope="col" data-align={column.align} style:width={column.width} aria-sort={column.sortable ? (sortKey === column.key ? sortDirection : 'none') : undefined}>
              {#if column.sortable}
                <button type="button" class="aesir-table__sort" onclick={() => toggleSort(column.key)}>
                  <span>{column.label}</span>
                  <span class="aesir-table__sort-icon" data-active={sortKey === column.key || undefined} aria-hidden="true">
                    <AesirIcon name={sortKey === column.key && sortDirection === 'ascending' ? 'arrow-up' : 'arrow-down'} size={14} />
                  </span>
                </button>
              {:else}
                {column.label}
              {/if}
            </th>
          {/each}
          {#if copyable || rowActions}<th class="aesir-table__action-heading" scope="col"><span>Actions</span></th>{/if}
        </tr>
      </thead>
    {/if}
    <tbody>
      {#each rows as row, index (getRowKey?.(row, index) ?? row[rowKey] ?? index)}
        {@const resolvedRowKey = resolveRowKey(row, index)}
        {@const copyValue = copyable ? resolveCopyValue(row) : null}
        {@const rowCopied = copyValue != null && copiedSignature === copySignature(resolvedRowKey, copyValue)}
        <tr data-selected={selectable && selected.includes(resolvedRowKey) ? true : undefined}>
          {#if selectable}
            <td class="aesir-table__selection">
              <AesirCheckbox
                checked={selected.includes(resolvedRowKey)}
                aria-label={rowSelectionName(row, resolvedRowKey)}
                onchange={(event) => toggleRow(resolvedRowKey, event.currentTarget.checked)}
              />
            </td>
          {/if}
          {#each columns as column (column.key)}
            {#if column.rowHeader}
              <th scope="row" data-align={column.align} style:width={column.width}>
                {#if column.cell}{@render column.cell({ row, value: resolveDisplayValue(row, column) })}{:else if cell}{@render cell({
                    row,
                    column,
                    value: resolveDisplayValue(row, column)
                  })}{:else}{@render renderDefaultValue(row, column)}{/if}
              </th>
            {:else}
              <td data-align={column.align} style:width={column.width}>
                {#if column.cell}
                  {@render column.cell({ row, value: resolveDisplayValue(row, column) })}
                {:else if cell}
                  {@render cell({ row, column, value: resolveDisplayValue(row, column) })}
                {:else}
                  {@render renderDefaultValue(row, column)}
                {/if}
              </td>
            {/if}
          {/each}
          {#if copyable || rowActions}
            <td class="aesir-table__action">
              {#if rowActions}{@render rowActions({ row, index })}{/if}
              {#if copyValue != null}
                <AesirButton
                  variant="ghost"
                  size="icon-sm"
                  class="aesir-table__copy"
                  data-copied={rowCopied || undefined}
                  aria-label={`${copyLabel}: ${copyValue}`}
                  title={rowCopied ? 'Copied' : copyLabel}
                  onclick={() => copyRowValue(row, resolvedRowKey)}
                >
                  <AesirIconSwap name="copy" activeName="check" active={rowCopied} size={14} />
                </AesirButton>
              {/if}
            </td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  :global {
    .aesir-table-wrap {
      box-sizing: border-box;
      width: 100%;
      overflow: auto;
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-lg);
    }

    .aesir-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--ds-background);
      color: var(--ds-foreground);
      font-size: var(--ds-font-size-sm);
    }

    .aesir-table-wrap[data-layout='fixed'] .aesir-table {
      table-layout: fixed;
    }

    .aesir-table__selection-col {
      width: var(--ds-spacing-12);
    }

    .aesir-table__action-col {
      width: var(--ds-spacing-20);
    }

    .aesir-table__announcement {
      position: absolute;
      width: var(--ds-spacing-px);
      height: var(--ds-spacing-px);
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    .aesir-table caption {
      padding: var(--ds-spacing-3) var(--ds-spacing-4);
      text-align: left;
      font-weight: var(--ds-font-weight-medium);
    }

    .aesir-table th,
    .aesir-table td {
      padding: var(--ds-spacing-3) var(--ds-spacing-4);
      border-bottom: var(--ds-spacing-px) solid var(--ds-border);
      text-align: left;
      white-space: nowrap;
    }

    .aesir-table thead th {
      background: var(--ds-background-secondary);
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-medium);
    }

    .aesir-table__sort {
      display: inline-grid;
      grid-template-columns: minmax(0, auto) var(--ds-spacing-4);
      align-items: center;
      gap: var(--ds-spacing-1);
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      font: inherit;
      text-align: inherit;
    }

    .aesir-table__sort-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
    }

    .aesir-table__sort-icon[data-active],
    .aesir-table__sort:hover .aesir-table__sort-icon,
    .aesir-table__sort:focus-visible .aesir-table__sort-icon {
      opacity: 1;
    }

    .aesir-table__sort:hover,
    .aesir-table__sort:focus-visible {
      color: var(--ds-foreground);
    }

    .aesir-table__sort:focus-visible {
      border-radius: var(--ds-radius-sm);
      outline: var(--ds-spacing-px) solid var(--ds-accent-ring);
      outline-offset: var(--ds-spacing-1);
    }

    .aesir-table tbody th {
      color: var(--ds-foreground-muted);
      font-weight: var(--ds-font-weight-medium);
    }

    .aesir-table tbody tr:last-child > * {
      border-bottom: 0;
    }

    .aesir-table tbody tr {
      transition: background-color var(--ds-motion-duration-instant) var(--ds-motion-easing-subtle);
    }

    .aesir-table tbody tr:hover,
    .aesir-table tbody tr:focus-within {
      background: var(--ds-surface);
    }

    .aesir-table tbody tr[data-selected] {
      background: var(--ds-accent-surface);
    }

    .aesir-table tbody tr[data-selected]:hover,
    .aesir-table tbody tr[data-selected]:focus-within {
      background: var(--ds-accent-surface-hover);
    }

    .aesir-table__selection {
      width: var(--ds-spacing-10);
      padding-right: 0 !important;
    }

    .aesir-table__link {
      display: inline-flex;
      align-items: center;
      gap: var(--ds-spacing-2);
      color: var(--ds-accent-text);
      font-weight: var(--ds-font-weight-medium);
      text-decoration: none;
    }

    .aesir-table__link:hover {
      text-decoration: none;
    }

    .aesir-table__link:hover > .aesir-table__link-label {
      text-decoration: underline;
      text-underline-offset: var(--ds-spacing-1);
    }

    .aesir-table__link:focus-visible {
      border-radius: var(--ds-radius-sm);
      outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
      outline-offset: var(--ds-spacing-0-5);
    }

    .aesir-table__action-heading,
    .aesir-table__action {
      width: var(--ds-spacing-20);
      padding-left: 0 !important;
      text-align: right !important;
    }

    .aesir-table__action :is(.aesir-button) {
      display: inline-flex;
    }

    .aesir-table__action-heading span {
      position: absolute;
      width: var(--ds-spacing-px);
      height: var(--ds-spacing-px);
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    .aesir-table__copy {
      transition:
        background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-out),
        transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }

    @media (hover: hover) and (pointer: fine) {
      .aesir-table__copy {
        opacity: 0;
        transform: translateX(calc(0px - var(--ds-spacing-1)));
      }

      .aesir-table tbody tr:hover .aesir-table__copy,
      .aesir-table tbody tr:focus-within .aesir-table__copy {
        opacity: 1;
        transform: none;
      }
    }

    .aesir-table-wrap[data-variant='striped'] .aesir-table tbody tr:nth-child(even):not([data-selected]) {
      background: var(--ds-background-secondary);
    }

    .aesir-table-wrap[data-variant='striped'] .aesir-table tbody tr:hover:not([data-selected]),
    .aesir-table-wrap[data-variant='striped'] .aesir-table tbody tr:focus-within:not([data-selected]) {
      background: var(--ds-surface-hover);
    }

    .aesir-table-wrap[data-variant='minimal'] {
      border: 0;
      border-radius: 0;
    }

    .aesir-table-wrap[data-variant='minimal'] .aesir-table {
      background: transparent;
    }

    .aesir-table-wrap[data-variant='minimal'] .aesir-table tbody th {
      width: 1%;
    }

    .aesir-table-wrap[data-variant='minimal'] .aesir-table caption,
    .aesir-table-wrap[data-variant='minimal'] .aesir-table th,
    .aesir-table-wrap[data-variant='minimal'] .aesir-table td {
      padding-inline: var(--ds-spacing-2);
    }

    .aesir-table-wrap[data-variant='minimal'] .aesir-table tbody th {
      padding-right: var(--ds-spacing-6);
    }

    .aesir-table-wrap[data-variant='minimal'] .aesir-table tbody tr:hover:not([data-selected]),
    .aesir-table-wrap[data-variant='minimal'] .aesir-table tbody tr:focus-within:not([data-selected]) {
      background: transparent;
    }

    .aesir-table-wrap[data-variant='minimal'][data-copyable] .aesir-table tbody tr:hover:not([data-selected]),
    .aesir-table-wrap[data-variant='minimal'][data-copyable] .aesir-table tbody tr:focus-within:not([data-selected]) {
      background: var(--ds-surface);
    }

    .aesir-table-wrap[data-density='xs'] {
      --aesir-table-row-height: var(--ds-spacing-6);
    }

    .aesir-table-wrap:is([data-density='sm'], [data-density='compact']) {
      --aesir-table-row-height: var(--ds-spacing-8);
    }

    .aesir-table-wrap[data-density='md'] {
      --aesir-table-row-height: var(--ds-spacing-10);
    }

    .aesir-table-wrap:is([data-density='lg'], [data-density='default']) {
      --aesir-table-row-height: var(--ds-spacing-12);
    }

    .aesir-table-wrap[data-density='xl'] {
      --aesir-table-row-height: var(--ds-spacing-16);
    }

    .aesir-table-wrap:is([data-density='xs'], [data-density='sm'], [data-density='md'], [data-density='lg'], [data-density='xl'], [data-density='default'], [data-density='compact'])
      .aesir-table
      :is(th, td) {
      box-sizing: border-box;
      height: var(--aesir-table-row-height);
      padding-block: 0;
      line-height: var(--ds-font-line-height-sm);
      vertical-align: middle;
    }

    .aesir-table-wrap[data-density='xs'] .aesir-table :is(th, td) {
      padding-inline: var(--ds-spacing-2);
      font-size: var(--ds-font-size-xs);
      line-height: var(--ds-font-line-height-xs);
    }

    .aesir-table-wrap[data-density='xs'] .aesir-table__copy {
      width: var(--ds-spacing-5);
      min-width: var(--ds-spacing-5);
      height: var(--ds-spacing-5);
      min-height: var(--ds-spacing-5);
      padding: 0;
    }

    .aesir-table-wrap:is([data-density='sm'], [data-density='compact']) .aesir-table__copy {
      width: var(--ds-spacing-6);
      min-width: var(--ds-spacing-6);
      height: var(--ds-spacing-6);
      min-height: var(--ds-spacing-6);
      padding: 0;
    }

    .aesir-table [data-align='start'] {
      text-align: left;
    }

    .aesir-table [data-align='end'] {
      text-align: right;
    }

    .aesir-table [data-align='right'] {
      text-align: right;
    }

    .aesir-table [data-align='center'] {
      text-align: center;
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-table__copy {
        transition:
          background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
          color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
          opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
        transform: none;
      }
    }
  }
</style>
