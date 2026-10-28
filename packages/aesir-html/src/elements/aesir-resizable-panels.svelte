<svelte:options
  customElement={{
    tag: 'aesir-resizable-panels',
    props: { size: { type: 'Number', reflect: true }, min: { type: 'Number' }, max: { type: 'Number' }, disabled: { type: 'Boolean' }, animate: { type: 'Boolean' } }
  }}
/>

<script>
  import { AesirResizablePanels } from '@aesir/svelte/components/aesir-resizable-panels';
  import { blockDisabledClick } from '../disabled-click.js';
  let { orientation = 'horizontal', size = $bindable(50), min = 20, max = 80, label = 'Resize panels', disabled = false, animate = false } = $props();
  const host = $host();
  blockDisabledClick(host, () => disabled);
  const onsizechange = (size) => host.dispatchEvent(new CustomEvent('sizechange', { detail: { size }, bubbles: true, composed: true }));
</script>

<AesirResizablePanels {orientation} bind:size {min} {max} {label} {disabled} {animate} {onsizechange}>
  {#snippet first()}<slot name="first"></slot>{/snippet}{#snippet second()}<slot name="second"></slot>{/snippet}
</AesirResizablePanels>
