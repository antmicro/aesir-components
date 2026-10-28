<svelte:options
  customElement={{
    tag: 'aesir-progress',
    props: { value: { type: 'Number', reflect: true }, max: { type: 'Number', reflect: true }, showValue: { type: 'Boolean', reflect: true }, indeterminate: { type: 'Boolean', reflect: true } }
  }}
/>

<script>
  import { AesirProgress } from '@aesir/svelte/components/aesir-progress';
  let { value = 0, max = 100, label, showValue = false, indeterminate = false, size = 'default', variant = 'default' } = $props();
</script>

<AesirProgress {value} {max} {label} {showValue} {indeterminate} {size} {variant} />
