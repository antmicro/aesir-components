<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { restoreOnFormReset } from '../form-reset.svelte.js';

  type SliderProps = Omit<HTMLInputAttributes, 'class' | 'disabled' | 'max' | 'min' | 'step' | 'style' | 'type' | 'value'> & {
    class?: string;
    style?: string;
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    showValue?: boolean;
    disabled?: boolean;
  };

  let {
    class: className = '',
    style: rootStyle = undefined,
    value = $bindable(50),
    min = 0,
    max = 100,
    step = 1,
    label = undefined,
    showValue = true,
    disabled = false,
    ...restProps
  }: SliderProps = $props();
  let input: HTMLInputElement;
  const decimalPlaces = (number: number) => {
    const [mantissa, exponent = '0'] = String(number).split('e');
    return Math.max(0, (mantissa.split('.')[1]?.length ?? 0) - Number(exponent));
  };
  const initialValue = $state.snapshot(value);
  restoreOnFormReset(
    () => input,
    () => (value = initialValue)
  );
  const effectiveMin = $derived(Number.isFinite(Number(min)) ? Number(min) : 0);
  const effectiveMax = $derived(Number.isFinite(Number(max)) ? Number(max) : 100);
  const displayValue = $derived.by(() => {
    const lower = effectiveMin;
    const upper = effectiveMax;
    const current = Number(value);
    if (upper <= lower) return lower;

    const candidate = Number.isFinite(current) ? current : lower + (upper - lower) / 2;
    const bounded = Math.min(upper, Math.max(lower, candidate));
    const interval = Number(step);
    const stepSize = Number.isFinite(interval) && interval > 0 ? interval : 1;
    const rangeSteps = (upper - lower) / stepSize;
    if (!Number.isFinite(rangeSteps)) return bounded;
    const precision = Math.max(decimalPlaces(lower), decimalPlaces(upper), decimalPlaces(stepSize));
    const normalize = (number: number) => (precision <= 100 ? Number(number.toFixed(precision)) : number);
    let maxSteps = Math.floor(rangeSteps);
    if (maxSteps > 0 && normalize(lower + maxSteps * stepSize) > upper) maxSteps -= 1;
    if (normalize(lower + (maxSteps + 1) * stepSize) <= upper) maxSteps += 1;

    const valueSteps = (bounded - lower) / stepSize;
    const halfStep = Math.floor(valueSteps) + 0.5;
    const tolerance = Math.min(1e-10, Number.EPSILON * Math.max(1, Math.abs(valueSteps)) * 2);
    const roundedValueSteps = Math.abs(valueSteps - halfStep) <= tolerance ? halfStep : valueSteps;
    const steps = Math.min(maxSteps, Math.round(roundedValueSteps));
    const snapped = normalize(lower + steps * stepSize);
    return Math.min(upper, Math.max(lower, snapped));
  });
  const progress = $derived.by(() => {
    const lower = effectiveMin;
    const upper = effectiveMax;
    const current = Number(displayValue);
    if (!Number.isFinite(current) || upper <= lower) return 0;
    return Math.min(100, Math.max(0, ((current - lower) / (upper - lower)) * 100));
  });
</script>

<label class={`aesir-slider ${className}`.trim()} data-disabled={disabled || undefined} style={rootStyle}>
  {#if label || showValue}
    <span class="aesir-slider__header">
      {#if label}<span>{label}</span>{/if}
      {#if showValue}<output>{displayValue}</output>{/if}
    </span>
  {/if}
  <input
    bind:this={input}
    type="range"
    bind:value={() => displayValue, (next) => (value = next)}
    {min}
    {max}
    {step}
    {disabled}
    aria-label={label}
    style={`--aesir-slider-progress: ${progress}%`}
    {...restProps}
  />
</label>

<style>
  :global {
    .aesir-slider {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      width: 100%;
      gap: var(--ds-spacing-2);
      color: var(--ds-foreground);
    }

    .aesir-slider__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-spacing-3);
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
    }

    .aesir-slider__header > * {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .aesir-slider output {
      flex-shrink: 0;
      color: var(--ds-foreground-muted);
      font-family: var(--ds-font-family-mono);
      font-size: var(--ds-font-size-xs);
    }

    .aesir-slider input {
      width: 100%;
      height: var(--ds-spacing-5);
      margin: 0;
      appearance: none;
      outline: none;
      background: transparent;
      cursor: pointer;
    }

    .aesir-slider input::-webkit-slider-runnable-track {
      height: var(--ds-spacing-1-5);
      border-radius: var(--ds-radius-full);
      background: linear-gradient(to right, var(--ds-accent) var(--aesir-slider-progress), var(--ds-surface-active) var(--aesir-slider-progress));
    }

    .aesir-slider input::-webkit-slider-thumb {
      width: var(--ds-spacing-5);
      height: var(--ds-spacing-5);
      margin-top: calc(var(--ds-spacing-2) * -1 + var(--ds-spacing-0-5));
      appearance: none;
      border: var(--ds-spacing-0-5) solid var(--ds-accent);
      border-radius: var(--ds-radius-full);
      background: var(--ds-background);
      transition:
        box-shadow var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }

    .aesir-slider input:active::-webkit-slider-thumb {
      transform: scale(0.96);
    }

    .aesir-slider input:focus-visible::-webkit-slider-thumb {
      box-shadow: 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-surface);
    }

    @media (hover: hover) and (pointer: fine) {
      .aesir-slider input:hover::-webkit-slider-thumb {
        transform: scale(1.04);
      }

      .aesir-slider input:active::-webkit-slider-thumb {
        transform: scale(0.96);
      }
    }

    .aesir-slider[data-disabled] {
      opacity: var(--ds-opacity-50);
    }

    .aesir-slider input:disabled {
      cursor: not-allowed;
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-slider input::-webkit-slider-thumb {
        transition-duration: var(--ds-motion-duration-instant);
      }

      .aesir-slider input:active::-webkit-slider-thumb,
      .aesir-slider input:hover::-webkit-slider-thumb {
        transform: none;
      }
    }
  }
</style>
