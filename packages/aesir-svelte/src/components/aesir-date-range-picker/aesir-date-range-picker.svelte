<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirDatePicker } from '../aesir-date-picker/index.js';
  import { restoreOnFormReset } from '../form-reset.svelte.js';
  type DateRange = { start: string; end: string };
  type DateRangePickerProps = Omit<HTMLAttributes<HTMLFieldSetElement>, 'class' | 'onchange'> & {
    class?: string;
    value?: DateRange;
    label?: string;
    startLabel?: string;
    endLabel?: string;
    locale?: string;
    min?: string;
    max?: string;
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    isDateUnavailable?: (date: string) => boolean;
    disabled?: boolean;
    onchange?: (value: DateRange) => void;
  };
  let {
    class: className = '',
    value = $bindable({ start: '', end: '' }),
    label = 'Date range',
    startLabel = 'Start date',
    endLabel = 'End date',
    locale = 'en-US',
    min,
    max,
    weekStartsOn,
    isDateUnavailable,
    disabled = false,
    onchange,
    ...restProps
  }: DateRangePickerProps = $props();
  let resetControl = $state<HTMLInputElement>();
  const initialValue = $state.snapshot(value);
  restoreOnFormReset(
    () => resetControl,
    () => (value = { ...initialValue })
  );
  const update = (key: keyof DateRange, date: string) => {
    if (value[key] === date) return;
    value = { ...value, [key]: date };
    onchange?.(value);
  };
  const validEndpoint = (candidate: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return false;
    const date = new Date(`${candidate}T12:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === candidate;
  };
  const peerEnd = $derived(validEndpoint(value.end) ? value.end : undefined);
  const peerStart = $derived(validEndpoint(value.start) ? value.start : undefined);
  const startMax = $derived(peerEnd && max ? (peerEnd < max ? peerEnd : max) : peerEnd || max);
  const endMin = $derived(peerStart && min ? (peerStart > min ? peerStart : min) : peerStart || min);
</script>

<fieldset class={`aesir-date-range-picker ${className}`.trim()} {disabled} {...restProps}>
  <legend>{label}</legend>
  <input bind:this={resetControl} type="hidden" />
  <div>
    <AesirDatePicker
      class=""
      value={value.start}
      label={startLabel}
      {locale}
      {min}
      max={startMax}
      {weekStartsOn}
      {isDateUnavailable}
      {disabled}
      onselect={(date: string) => update('start', date)}
    /><AesirDatePicker class="" value={value.end} label={endLabel} {locale} min={endMin} {max} {weekStartsOn} {isDateUnavailable} {disabled} onselect={(date: string) => update('end', date)} />
  </div>
</fieldset>

<style>
  :global {
    .aesir-date-range-picker {
      min-width: 0;
      margin: 0;
      padding: 0;
      border: 0;
    }
    .aesir-date-range-picker > legend {
      margin-bottom: var(--ds-spacing-2);
      color: var(--ds-foreground);
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
    }
    .aesir-date-range-picker > div {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--ds-spacing-3);
    }
    @media (max-width: 36rem) {
      .aesir-date-range-picker > div {
        grid-template-columns: 1fr;
      }
    }
  }
</style>
