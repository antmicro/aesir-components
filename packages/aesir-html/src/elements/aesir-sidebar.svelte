<svelte:options
  customElement={{
    tag: 'aesir-sidebar',
    props: {
      open: { type: 'Boolean', reflect: true },
      title: { attribute: 'sidebar-title' },
      resizable: { type: 'Boolean' },
      collapsible: { type: 'Boolean' },
      collapsed: { type: 'Boolean', reflect: true },
      sticky: { type: 'Boolean' },
      autoExpandActive: { type: 'Boolean', attribute: 'auto-expand-active' },
      treeLines: { type: 'Boolean', attribute: 'tree-lines' },
      stickyBranches: { type: 'Boolean', attribute: 'sticky-branches' },
      branchBehavior: { attribute: 'branch-behavior' },
      mobileTrigger: { attribute: 'mobile-trigger' },
      minWidth: { type: 'Number', attribute: 'min-width' },
      maxWidth: { type: 'Number', attribute: 'max-width' },
      width: { type: 'Number' }
    }
  }}
/>

<script>
  import { AesirSidebar } from '@aesir/svelte/components/aesir-sidebar';
  import { parseJson } from '../parse.js';

  let {
    title = 'Navigation',
    label,
    variant = 'classic',
    mode = 'responsive',
    branchBehavior = 'toggle',
    autoExpandActive = true,
    treeLines = false,
    stickyBranches = false,
    mobileTrigger = 'header',
    items = [],
    sections = [],
    value = $bindable(),
    expanded = $bindable([]),
    open = $bindable(false),
    width = $bindable(256),
    minWidth = 208,
    maxWidth = 448,
    resizable = false,
    collapsible = false,
    collapsed = $bindable(false),
    collapseTrigger = 'edge',
    sticky = true,
    stickyTop = '0px',
    closeLabel = 'Close navigation',
    menuLabel = 'Open navigation',
    resizeLabel = 'Resize navigation',
    collapseLabel = 'Collapse navigation',
    expandLabel = 'Expand navigation'
  } = $props();
  const host = $host();
  const parsedItems = $derived(parseJson(items));
  const parsedSections = $derived(parseJson(sections));

  const selectItem = (item) => {
    host.dispatchEvent(new CustomEvent('select', { detail: item, bubbles: true, composed: true }));
  };
</script>

<AesirSidebar
  {title}
  label={label ?? title}
  {variant}
  {mode}
  {branchBehavior}
  {autoExpandActive}
  {treeLines}
  {stickyBranches}
  {mobileTrigger}
  items={parsedItems}
  sections={parsedSections}
  bind:value
  bind:expanded
  bind:open
  bind:width
  bind:collapsed
  {minWidth}
  {maxWidth}
  {resizable}
  {collapsible}
  {collapseTrigger}
  {sticky}
  {stickyTop}
  {closeLabel}
  {menuLabel}
  {resizeLabel}
  {collapseLabel}
  {expandLabel}
  onselect={selectItem}
/>
