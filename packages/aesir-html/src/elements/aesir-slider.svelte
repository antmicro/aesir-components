<svelte:options
  customElement={{
    tag: 'aesir-slider',
    props: {
      value: { type: 'Number', reflect: true },
      min: { type: 'Number' },
      max: { type: 'Number' },
      step: { type: 'Number' },
      showValue: { type: 'Boolean', attribute: 'show-value' },
      disabled: { type: 'Boolean', reflect: true }
    }
  }}
/>

<script>
  import { AesirSlider } from '@aesir/svelte/components/aesir-slider';
  import { blockDisabledClick } from '../disabled-click.js';

  let { value = $bindable(0), min = 0, max = 100, step = 1, label, showValue = false, disabled = false, name } = $props();
  blockDisabledClick($host(), () => disabled);
</script>

<AesirSlider bind:value {min} {max} {step} {label} {showValue} {disabled} {name} />
