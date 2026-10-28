<svelte:options
  customElement={{
    tag: 'aesir-quantity-stepper',
    props: {
      value: { type: 'Number', reflect: true },
      min: { type: 'Number', reflect: true },
      max: { type: 'Number', reflect: true },
      step: { type: 'Number', reflect: true },
      disabled: { type: 'Boolean', reflect: true }
    }
  }}
/>

<script>
  import { AesirQuantityStepper } from '@aesir/svelte/components/aesir-quantity-stepper';
  import { blockDisabledClick } from '../disabled-click.js';
  let { value = $bindable(1), min = 1, max = Infinity, step = 1, label = 'Quantity', name, disabled = false } = $props();
  const host = $host();
  blockDisabledClick(host, () => disabled);
</script>

<AesirQuantityStepper bind:value {min} {max} {step} {label} {name} {disabled} onchange={(next) => host.dispatchEvent(new CustomEvent('change', { detail: next, bubbles: true, composed: true }))} />
