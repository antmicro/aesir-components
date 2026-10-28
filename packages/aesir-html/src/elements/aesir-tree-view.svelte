<svelte:options
  customElement={{
    tag: 'aesir-tree-view',
    props: { items: { type: 'Array' }, expanded: { type: 'Array' }, lines: { type: 'Boolean' }, disabled: { type: 'Boolean' }, selectBranches: { type: 'Boolean', attribute: 'select-branches' } }
  }}
/>

<script>
  import { AesirTreeView } from '@aesir/svelte/components/aesir-tree-view';
  import { blockDisabledClick } from '../disabled-click.js';
  import { parseJson } from '../parse.js';
  let { items = [], value = $bindable(), expanded = $bindable([]), label = 'Tree view', size = 'default', lines = true, disabled = false, selectBranches = false } = $props();
  const resolvedSize = $derived(size === 'sm' ? 'sm' : 'default');
  const host = $host();
  blockDisabledClick(host, () => disabled);
</script>

<AesirTreeView
  items={parseJson(items)}
  bind:value
  bind:expanded
  {label}
  size={resolvedSize}
  {lines}
  {disabled}
  {selectBranches}
  onselect={(item) => host.dispatchEvent(new CustomEvent('select', { detail: item, bubbles: true, composed: true }))}
/>
