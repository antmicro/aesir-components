<svelte:options customElement={{ tag: 'aesir-stepper', props: { items: { type: 'Array' }, linear: { type: 'Boolean' }, showStatus: { type: 'Boolean' } } }} />

<script>
  import { AesirStepper } from '@aesir/svelte/components/aesir-stepper';
  import { parseJson } from '../parse.js';
  let {
    items = [],
    value = $bindable(),
    orientation = 'horizontal',
    label = 'Progress',
    linear = false,
    showStatus = true,
    completedLabel = 'Completed',
    currentLabel = 'In progress',
    upcomingLabel = 'Pending'
  } = $props();
  const host = $host();
</script>

<AesirStepper
  items={parseJson(items)}
  bind:value
  {orientation}
  {label}
  {linear}
  {showStatus}
  {completedLabel}
  {currentLabel}
  {upcomingLabel}
  onchange={(item) => host.dispatchEvent(new CustomEvent('change', { detail: item, bubbles: true, composed: true }))}
/>
