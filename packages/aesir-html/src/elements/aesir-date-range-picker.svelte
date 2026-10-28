<svelte:options customElement={{ tag: 'aesir-date-range-picker', props: { disabled: { type: 'Boolean' } } }} />

<script>
  import { AesirDateRangePicker } from '@aesir/svelte/components/aesir-date-range-picker';
  import { blockDisabledClick } from '../disabled-click.js';
  import { parseJson } from '../parse.js';
  let { value = $bindable({ start: '', end: '' }), label = 'Date range', startLabel = 'Start date', endLabel = 'End date', locale = 'en-US', min, max, disabled = false } = $props();
  const host = $host();
  blockDisabledClick(host, () => disabled);
  const parsed = $derived(parseJson(value));
</script>

<AesirDateRangePicker
  value={parsed}
  {label}
  {startLabel}
  {endLabel}
  {locale}
  {min}
  {max}
  {disabled}
  onchange={(value) => host.dispatchEvent(new CustomEvent('change', { detail: { value }, bubbles: true, composed: true }))}
/>
