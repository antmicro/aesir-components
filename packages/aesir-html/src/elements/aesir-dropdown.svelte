<svelte:options
  customElement={{
    tag: 'aesir-dropdown',
    props: {
      open: { type: 'Boolean', reflect: true },
      modal: { type: 'String' },
      openOnHover: { type: 'Boolean', attribute: 'open-on-hover' },
      offset: { type: 'Number' },
      matchTriggerWidth: { type: 'Boolean', attribute: 'match-trigger-width' },
      matchViewportWidth: { type: 'Boolean', attribute: 'match-viewport-width' },
      mobileLayout: { attribute: 'mobile-layout' },
      mobileBreakpoint: { type: 'Number', attribute: 'mobile-breakpoint' },
      contentClass: { attribute: 'content-class' },
      contentStyle: { attribute: 'content-style' },
      error: { type: 'Boolean' }
    }
  }}
/>

<script>
  import { AesirDropdown } from '@aesir/svelte/components/aesir-dropdown';
  import { parseJson } from '../parse.js';
  import { connectSlottedTrigger } from '../trigger-attributes.js';

  let {
    items = [],
    open = $bindable(false),
    modal = true,
    openOnHover = false,
    placement = 'bottom',
    align = 'end',
    offset = 8,
    matchTriggerWidth = false,
    matchViewportWidth = false,
    mobileLayout = 'compact',
    mobileBreakpoint = 640,
    width = 'auto',
    contentClass = '',
    contentStyle,
    label = 'Dropdown menu',
    error = false
  } = $props();
  const host = $host();
  const parsedItems = $derived(parseJson(items));
  const selectItem = (item) => {
    host.dispatchEvent(new CustomEvent('select', { detail: item, bubbles: true, composed: true }));
  };
</script>

<AesirDropdown
  items={parsedItems}
  bind:open
  modal={modal !== false && modal !== 'false'}
  {openOnHover}
  {placement}
  {align}
  {offset}
  {matchTriggerWidth}
  {matchViewportWidth}
  {mobileLayout}
  {mobileBreakpoint}
  {contentClass}
  {contentStyle}
  style={width === 'full' ? 'display:flex;width:100%;min-width:0' : undefined}
  {label}
  {error}
  onselect={selectItem}
>
  {#snippet trigger(props)}
    <span use:connectSlottedTrigger={props} class:full-width={width === 'full'}><slot></slot></span>
  {/snippet}
</AesirDropdown>

<style>
  .full-width {
    display: block;
    width: 100%;
    min-width: 0;
  }
</style>
