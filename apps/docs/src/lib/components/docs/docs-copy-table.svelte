<script>
  import { onDestroy } from 'svelte';
  import { copyToClipboard } from './copy.js';
  import { cellCode, cellValue } from './table-helpers.js';
  import { AesirButton, AesirIconSwap } from '@aesir/svelte';

  let {
    columns = [],
    rows = [],
    minWidth = 'var(--ds-sizing-xl)',
    class: className = '',
    getCopyValue = (row, mode) => row?.copyValue?.[mode] ?? row?.copyValue ?? '',
    copyLabel = 'Copied',
    renderCell = null
  } = $props();

  const resolveCopyValue = (row) => getCopyValue(row, 'css');
  let copiedRow = $state();
  let copyResetTimer;

  const copyRow = async (row, rowKey) => {
    const copied = await copyToClipboard(resolveCopyValue(row), { successLabel: copyLabel });
    if (!copied) return;

    copiedRow = rowKey;
    clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => {
      copiedRow = undefined;
    }, 1200);
  };

  const onRowClick = async (event, row, rowKey) => {
    if (event.target.closest('button, a, input, select, textarea')) return;
    await copyRow(row, rowKey);
  };

  const onRowKeydown = async (event, row, rowKey) => {
    if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    await copyRow(row, rowKey);
  };

  onDestroy(() => clearTimeout(copyResetTimer));
</script>

<div class={`docs-copy-table ${className}`.trim()} style={`--docs-table-min-width: ${minWidth}`}>
  <table>
    <thead>
      <tr>
        {#each columns as column (column.key)}
          <th style:width={column.width}>
            {column.label}
          </th>
        {/each}
        <th class="docs-copy-table__action-heading"><span class="sr-only">Copy value</span></th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row, rowIndex (row.id ?? rowIndex)}
        {@const rowKey = row.id ?? rowIndex}
        <tr tabindex="0" onclick={(event) => onRowClick(event, row, rowKey)} onkeydown={(event) => onRowKeydown(event, row, rowKey)}>
          {#each columns as column (column.key)}
            {@const cell = row[column.key]}
            {#if column.kind === 'custom' && renderCell}
              {@render renderCell(row, column)}
            {:else}
              <td>
                {#if cellCode(cell, column)}
                  <code>{cellValue(cell)}</code>
                {:else}
                  {cellValue(cell)}
                {/if}
              </td>
            {/if}
          {/each}
          <td class="docs-copy-table__action-cell">
            <AesirButton
              variant="ghost"
              size="icon-sm"
              class="docs-copy-table__button"
              data-copied={copiedRow === rowKey || undefined}
              aria-label={`Copy ${resolveCopyValue(row)}`}
              onclick={() => copyRow(row, rowKey)}
            >
              <AesirIconSwap name="copy" activeName="check" active={copiedRow === rowKey} size={14} />
            </AesirButton>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .docs-copy-table {
    width: 100%;
    overflow-x: auto;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-xl);
    background: var(--ds-background-secondary);
  }

  table {
    width: 100%;
    min-width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  thead {
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }

  th {
    padding: var(--ds-spacing-2) var(--ds-spacing-3);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
    line-height: var(--ds-font-line-height-xs);
    text-transform: uppercase;
  }

  tbody tr {
    cursor: copy;
    transition: background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
  }

  tbody tr:not(:last-child) {
    border-bottom: var(--ds-spacing-px) solid color-mix(in oklch, var(--ds-border) 80%, transparent);
  }

  tbody tr:hover {
    background: color-mix(in oklch, var(--ds-surface) 60%, transparent);
  }

  tbody tr:focus-visible {
    background: color-mix(in oklch, var(--ds-accent-surface) 60%, transparent);
    outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    outline-offset: calc(var(--ds-spacing-0-5) * -1);
  }

  td {
    padding: var(--ds-spacing-3);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
  }

  code {
    padding: 0.12rem 0.35rem;
    border-radius: var(--ds-radius-sm);
    background: var(--ds-accent-surface);
    color: var(--ds-accent-text-muted);
    font-family: var(--ds-typography-code-font-family, var(--ds-font-family-mono));
    font-size: var(--ds-typography-code-font-size, var(--ds-font-size-sm));
    font-weight: var(--ds-typography-code-font-weight, var(--ds-font-weight-normal));
    line-height: var(--ds-typography-code-line-height, var(--ds-font-line-height-sm));
    letter-spacing: var(--ds-typography-code-letter-spacing, 0);
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }

  .docs-copy-table__action-heading,
  .docs-copy-table__action-cell {
    width: var(--ds-spacing-10);
    padding: var(--ds-spacing-2);
    text-align: right;
  }

  .sr-only {
    position: absolute;
    width: var(--ds-spacing-px);
    height: var(--ds-spacing-px);
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  :global(.docs-copy-table__button) {
    opacity: 0;
    transition:
      opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
  }

  tr:hover :global(.docs-copy-table__button),
  :global(.docs-copy-table__button:focus-visible) {
    opacity: 1;
  }

  @media (max-width: 40rem) {
    table {
      min-width: var(--docs-table-min-width);
    }

    :global(.docs-copy-table__button) {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    tbody tr,
    :global(.docs-copy-table__button) {
      transition-duration: var(--ds-motion-duration-instant);
    }
  }
</style>
