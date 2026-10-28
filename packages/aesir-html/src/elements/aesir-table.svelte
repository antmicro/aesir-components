<svelte:options
  customElement={{
    tag: 'aesir-table',
    props: {
      showHeader: { type: 'Boolean', attribute: 'show-header' },
      hideHeader: { type: 'Boolean', attribute: 'hide-header' },
      copyable: { type: 'Boolean' },
      selectable: { type: 'Boolean' },
      selected: { type: 'Array' },
      rowKey: { attribute: 'row-key' },
      selectionLabel: { attribute: 'selection-label' },
      copyColumn: { attribute: 'copy-column' },
      copyLabel: { attribute: 'copy-label' },
      sortKey: { attribute: 'sort-key' },
      sortDirection: { attribute: 'sort-direction' }
    }
  }}
/>

<script>
  import { AesirTable } from '@aesir/svelte/components/aesir-table';
  import { parseJson } from '../parse.js';

  let {
    columns = [],
    rows = [],
    caption,
    showHeader = true,
    hideHeader = false,
    variant = 'default',
    density = 'default',
    layout = 'auto',
    copyable = false,
    copyColumn,
    copyLabel = 'Copy value',
    selectable = false,
    selected = $bindable([]),
    rowKey = 'id',
    selectionLabel = 'Select row',
    sortKey = $bindable(),
    sortDirection = $bindable('ascending')
  } = $props();
  const parsedColumns = $derived(parseJson(columns));
  const parsedRows = $derived(parseJson(rows));
</script>

<AesirTable
  columns={parsedColumns}
  rows={parsedRows}
  {caption}
  showHeader={showHeader && !hideHeader}
  {variant}
  {density}
  {layout}
  {copyable}
  {copyColumn}
  {copyLabel}
  {selectable}
  bind:selected
  {rowKey}
  {selectionLabel}
  bind:sortKey
  bind:sortDirection
  onselectionchange={(value) => $host().dispatchEvent(new CustomEvent('selectionchange', { detail: { value }, bubbles: true, composed: true }))}
  onsortchange={(value) => $host().dispatchEvent(new CustomEvent('sortchange', { detail: value, bubbles: true, composed: true }))}
/>
