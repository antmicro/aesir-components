<script>
  import { AesirBadge } from '@aesir/svelte';
  import { cellCode, cellValue } from './table-helpers.js';

  let { columns = [], rows = [], minWidth = 'var(--ds-sizing-lg)', codeTone = 'accent', class: className = '' } = $props();
</script>

<div class={`docs-table ${className}`.trim()} data-code-tone={codeTone} style={`--docs-table-min-width: ${minWidth}`}>
  <table>
    <colgroup>
      {#each columns as column (column.key)}
        <col style:width={column.width} />
      {/each}
    </colgroup>
    <thead>
      <tr>
        {#each columns as column (column.key)}
          <th>{column.label}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as row, rowIndex (row.id ?? rowIndex)}
        <tr>
          {#each columns as column (column.key)}
            {@const cell = row[column.key]}
            <td>
              {#if cell?.badges}
                <span class="docs-table__value">
                  <span class="docs-table__badges">
                    {#each cell.badges as badge (badge.label)}
                      <AesirBadge size="xs" variant={badge.tone === 'required' ? 'destructive' : badge.tone === 'bindable' ? 'info' : 'outline'}>{badge.label}</AesirBadge>
                    {/each}
                  </span>
                  {#if cellCode(cell, column)}<code>{cellValue(cell)}</code>{:else}{cellValue(cell)}{/if}
                </span>
              {:else if cellCode(cell, column)}
                <code>{cellValue(cell)}</code>
              {:else}
                {cellValue(cell)}
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .docs-table {
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
    table-layout: fixed;
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

  tbody tr:not(:last-child) {
    border-bottom: var(--ds-spacing-px) solid color-mix(in oklch, var(--ds-border) 80%, transparent);
  }

  td {
    padding: var(--ds-spacing-3);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
    overflow-wrap: anywhere;
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

  .docs-table[data-code-tone='neutral'] code {
    background: var(--ds-surface);
    color: var(--ds-foreground-muted);
  }

  .docs-table__value {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--ds-spacing-1);
  }

  .docs-table__badges {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ds-spacing-1);
  }

  @media (max-width: 40rem) {
    table {
      min-width: var(--docs-table-min-width);
    }
  }
</style>
