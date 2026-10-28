<svelte:options customElement={{ tag: 'aesir-date-picker', props: { open: { type: 'Boolean', reflect: true }, disabled: { type: 'Boolean', reflect: true } } }} />

<script>
  import { AesirDatePicker } from '@aesir/svelte/components/aesir-date-picker';
  import { blockDisabledClick } from '../disabled-click.js';
  let { value = $bindable(''), open = $bindable(false), label, locale = 'en-US', min, max, disabled = false } = $props();
  const host = $host();
  blockDisabledClick(host, () => disabled);
</script>

<AesirDatePicker bind:value bind:open {label} {locale} {min} {max} {disabled} onselect={(date) => host.dispatchEvent(new CustomEvent('select', { detail: date, bubbles: true, composed: true }))} />
