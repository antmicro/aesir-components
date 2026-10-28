<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirIcon } from '../aesir-icon/index.js';
  import { restoreOnFormReset } from '../form-reset.svelte.js';

  type QuantityStepperProps = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'onchange' | 'style'> & {
    class?: string;
    style?: string;
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    name?: string;
    disabled?: boolean;
    onchange?: (value: number) => void;
  };

  let {
    class: className = '',
    style: rootStyle = undefined,
    value = $bindable(1),
    min = 1,
    max = Infinity,
    step = 1,
    label = 'Quantity',
    name = undefined,
    disabled = false,
    onchange = undefined,
    ...restProps
  }: QuantityStepperProps = $props();

  const number = (candidate: unknown, fallback: number) => {
    if (typeof candidate === 'string' && candidate.trim() === '') return fallback;
    const parsed = Number(candidate);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const lower = $derived(number(min, 1));
  const upper = $derived(Math.max(number(max, Infinity), lower));
  const increment = $derived.by(() => {
    const candidate = number(step, 1);
    return candidate > 0 ? candidate : 1;
  });
  const decimalPlaces = (candidate: number) => {
    const [significand, exponent = '0'] = String(candidate).split('e');
    return Math.min(100, Math.max(0, (significand.split('.')[1]?.length ?? 0) - Number(exponent)));
  };
  const precision = $derived(Math.max(decimalPlaces(lower), decimalPlaces(increment)));
  const valueAt = (steps: number) => Number((lower + steps * increment).toFixed(precision));
  const lastStep = $derived.by(() => {
    if (!Number.isFinite(upper)) return Infinity;
    const ratio = (upper - lower) / increment;
    const rounded = Math.round(ratio);
    return valueAt(rounded) <= upper ? rounded : Math.max(0, Math.floor(ratio));
  });
  const allowedUpper = $derived(Number.isFinite(lastStep) ? Math.min(upper, valueAt(lastStep)) : Infinity);
  const normalize = (candidate: unknown) => {
    const bounded = Math.min(allowedUpper, Math.max(lower, number(candidate, lower)));
    const steps = Math.min(lastStep, Math.max(0, Math.round((bounded - lower) / increment)));
    return Math.min(allowedUpper, Math.max(lower, valueAt(steps)));
  };
  const current = $derived(normalize(value));
  let input: HTMLInputElement;
  const initialValue = $state.snapshot(value);
  restoreOnFormReset(
    () => input,
    () => {
      value = number(initialValue, lower);
      input.value = String(current);
    }
  );
  const canDecrease = $derived(!disabled && current > lower);
  const canIncrease = $derived(!disabled && current < allowedUpper);

  const commit = (candidate: unknown) => {
    const next = normalize(candidate);
    if (Object.is(next, current)) {
      const edited = input.value !== String(current);
      input.value = String(next);
      if (edited && !Object.is(next, value)) {
        value = next;
        onchange?.(next);
      }
      return;
    }
    value = next;
    onchange?.(next);
  };
</script>

<div class={`aesir-quantity-stepper ${className}`.trim()} data-disabled={disabled || undefined} style={rootStyle} role="group" aria-label={label} {...restProps}>
  <button type="button" aria-label={`Decrease ${label.toLowerCase()}`} disabled={!canDecrease} onclick={() => commit(current - increment)}><AesirIcon name="minus" /></button>
  <input
    bind:this={input}
    type="number"
    value={current}
    {name}
    min={lower}
    max={Number.isFinite(upper) ? upper : undefined}
    step={increment}
    {disabled}
    aria-label={label}
    inputmode="numeric"
    onchange={(event) => commit(event.currentTarget.value)}
    onblur={(event) => commit(event.currentTarget.value)}
  />
  <button type="button" aria-label={`Increase ${label.toLowerCase()}`} disabled={!canIncrease} onclick={() => commit(current + increment)}><AesirIcon name="plus" /></button>
</div>

<style>
  :global {
    .aesir-quantity-stepper {
      display: inline-grid;
      width: fit-content;
      height: var(--ds-spacing-9);
      grid-template-columns: var(--ds-spacing-9) var(--ds-spacing-10) var(--ds-spacing-9);
      overflow: hidden;
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-lg);
      background: var(--ds-background);
      color: var(--ds-foreground);
      transition:
        border-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        box-shadow var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
    }
    .aesir-quantity-stepper:focus-within {
      border-color: var(--ds-accent-ring);
      box-shadow: 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-surface);
    }
    .aesir-quantity-stepper button,
    .aesir-quantity-stepper input {
      min-width: 0;
      padding: 0;
      border: 0;
      outline: 0;
      background: transparent;
      color: inherit;
      font: inherit;
    }
    .aesir-quantity-stepper button {
      display: grid;
      place-items: center;
      cursor: pointer;
      transition:
        background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }
    .aesir-quantity-stepper button:first-child {
      border-right: var(--ds-spacing-px) solid var(--ds-border);
    }
    .aesir-quantity-stepper button:last-child {
      border-left: var(--ds-spacing-px) solid var(--ds-border);
    }
    .aesir-quantity-stepper button:hover:not(:disabled) {
      background: var(--ds-surface-hover);
    }
    .aesir-quantity-stepper button:active:not(:disabled) {
      transform: scale(0.94);
    }
    .aesir-quantity-stepper button:focus-visible {
      box-shadow: inset 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-ring);
    }
    .aesir-quantity-stepper button:disabled {
      cursor: not-allowed;
      opacity: var(--ds-opacity-40);
    }
    .aesir-quantity-stepper svg {
      width: var(--ds-spacing-4);
      height: var(--ds-spacing-4);
      pointer-events: none;
    }
    .aesir-quantity-stepper input {
      width: 100%;
      font-size: var(--ds-font-size-sm);
      font-variant-numeric: tabular-nums;
      font-weight: var(--ds-font-weight-medium);
      text-align: center;
      appearance: textfield;
    }
    .aesir-quantity-stepper input::-webkit-inner-spin-button,
    .aesir-quantity-stepper input::-webkit-outer-spin-button {
      margin: 0;
      appearance: none;
    }
    .aesir-quantity-stepper[data-disabled] {
      opacity: var(--ds-opacity-50);
    }
    @media (prefers-reduced-motion: reduce) {
      .aesir-quantity-stepper,
      .aesir-quantity-stepper button {
        transition: none;
      }
    }
  }
</style>
