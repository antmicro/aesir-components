<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { restoreOnFormReset } from '../form-reset.svelte.js';
  import AesirSegmentedField from './aesir-segmented-field.svelte';

  type Range = { start: string; end: string };
  type Props = Omit<HTMLAttributes<HTMLFieldSetElement>, 'class'> & {
    kind: 'date' | 'time';
    label: string;
    name?: string;
    value?: Range;
    disabled?: boolean;
    required?: boolean;
    readonly?: boolean;
    locale?: string;
    min?: string;
    max?: string;
    class?: string;
  };
  let {
    kind,
    label,
    name,
    value = $bindable({ start: '', end: '' }),
    disabled = false,
    required = false,
    readonly = false,
    locale = 'en-US',
    min,
    max,
    class: className = '',
    ...restProps
  }: Props = $props();
  let resetControl = $state<HTMLInputElement>();
  const initialValue = $state.snapshot(value);
  restoreOnFormReset(
    () => resetControl,
    () => (value = { ...initialValue })
  );
  const update = (key: keyof Range, next: string) => (value = { ...value, [key]: next });
  const startMax = $derived(value.end && max ? (value.end < max ? value.end : max) : value.end || max);
  const endMin = $derived(value.start && min ? (value.start > min ? value.start : min) : value.start || min);
</script>

<fieldset class={`aesir-segmented-range-field ${className}`.trim()} {disabled} {...restProps}>
  <input bind:this={resetControl} type="hidden" />
  <legend>{label}</legend>
  <div class="aesir-segmented-range-field__fields">
    <AesirSegmentedField
      {kind}
      label="Start"
      name={name ? `${name}.start` : undefined}
      value={value.start}
      {required}
      {readonly}
      {locale}
      {min}
      max={startMax}
      onchange={(next) => update('start', next)}
    />
    <AesirSegmentedField {kind} label="End" name={name ? `${name}.end` : undefined} value={value.end} {required} {readonly} {locale} min={endMin} {max} onchange={(next) => update('end', next)} />
  </div>
</fieldset>

<style>
  :global(.aesir-segmented-range-field) {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  legend {
    margin-bottom: var(--ds-spacing-2);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
  }
  .aesir-segmented-range-field__fields {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ds-spacing-3);
  }
</style>
