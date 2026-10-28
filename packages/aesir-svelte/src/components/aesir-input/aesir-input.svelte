<script lang="ts">
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import Minus from '@lucide/svelte/icons/minus';
  import Plus from '@lucide/svelte/icons/plus';
  import { restoreOnFormReset } from '../form-reset.svelte.js';

  type InputProps = Omit<HTMLInputAttributes, 'aria-describedby' | 'class' | 'disabled' | 'id' | 'max' | 'min' | 'readonly' | 'required' | 'size' | 'step' | 'style' | 'type' | 'value'> & {
    class?: string;
    style?: string;
    value?: string | number;
    id?: string;
    label?: string;
    description?: string;
    error?: string;
    errorPlacement?: 'message' | 'label';
    type?: HTMLInputAttributes['type'];
    size?: 'sm' | 'default' | 'lg';
    disabled?: boolean;
    readonly?: boolean;
    optional?: boolean;
    required?: boolean;
    reserveMessageSpace?: boolean;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    leading?: Snippet;
    trailing?: Snippet;
    leadingVisible?: boolean;
    trailingVisible?: boolean;
    'aria-describedby'?: string;
  };

  let {
    class: className = '',
    style: rootStyle,
    value = $bindable(''),
    id,
    label,
    description,
    error,
    errorPlacement = 'message',
    type = 'text',
    size = 'default',
    disabled = false,
    readonly = false,
    optional = false,
    required = false,
    reserveMessageSpace = false,
    min,
    max,
    step,
    leading,
    trailing,
    leadingVisible = true,
    trailingVisible = true,
    'aria-describedby': ariaDescribedBy,
    ...restProps
  }: InputProps = $props();
  let inputRef: HTMLInputElement;
  const initialValue = $state.snapshot(value);
  onMount(() => {
    // Preserve the initial value attribute, which the browser uses as the step base when min is absent.
    inputRef.defaultValue = String(initialValue);
  });
  restoreOnFormReset(
    () => inputRef,
    () => (value = initialValue)
  );

  const fieldId = $props.id();
  const inputId = $derived(id ?? `${fieldId}-control`);
  const messageId = $derived(`${fieldId}-${error ? 'error' : 'description'}`);
  const describedBy = $derived([ariaDescribedBy, error || description ? messageId : undefined].filter(Boolean).join(' ') || undefined);
  const hasLabelError = $derived(Boolean(error && errorPlacement === 'label' && label));
  const hasMessageError = $derived(Boolean(error && !hasLabelError));
  const hasSupport = $derived(Boolean(hasMessageError || (!error && description) || reserveMessageSpace));
  const isNumber = $derived(type === 'number');
  const numericValue = $derived(Number(value));
  const atMinimum = $derived(disabled || readonly || (value !== '' && Number.isFinite(numericValue) && min !== undefined && numericValue <= Number(min)));
  const lastValidStep = $derived.by(() => {
    const limit = Number(max);
    if (max === undefined || !Number.isFinite(limit)) return Infinity;
    if (step === 'any') return limit;

    const minimum = Number(min);
    const initial = Number(initialValue);
    const base = min !== undefined && Number.isFinite(minimum) ? minimum : initialValue !== '' && Number.isFinite(initial) ? initial : 0;
    const candidate = Number(step);
    const increment = Number.isFinite(candidate) && candidate > 0 ? candidate : 1;
    const decimalPlaces = (number: number) => {
      const [significand, exponent = '0'] = String(number).split('e');
      return Math.min(100, Math.max(0, (significand.split('.')[1]?.length ?? 0) - Number(exponent)));
    };
    const precision = Math.max(decimalPlaces(base), decimalPlaces(increment));
    const valueAt = (index: number) => Number((base + index * increment).toFixed(precision));
    const ratio = (limit - base) / increment;
    const rounded = Math.round(ratio);
    return valueAt(rounded) <= limit ? valueAt(rounded) : valueAt(Math.floor(ratio));
  });
  const atMaximum = $derived(disabled || readonly || (value !== '' && Number.isFinite(numericValue) && numericValue >= lastValidStep));

  const stepValue = (direction: number) => {
    if (!inputRef || disabled || readonly) return;
    if (step === 'any') {
      const current = inputRef.valueAsNumber;
      const minimum = Number(min);
      const maximum = Number(max);
      const hasMinimum = min !== undefined && Number.isFinite(minimum);
      const nextValue = Number.isFinite(current) ? current + direction : hasMinimum ? minimum : direction;
      const next = Math.min(max !== undefined && Number.isFinite(maximum) ? maximum : Infinity, Math.max(hasMinimum ? minimum : -Infinity, nextValue));
      inputRef.value = String(next);
    } else if (direction > 0) inputRef.stepUp();
    else inputRef.stepDown();
    inputRef.dispatchEvent(new Event('input', { bubbles: true }));
    inputRef.focus();
  };
</script>

<div class={`aesir-input ${className}`.trim()} data-size={size} data-invalid={error ? true : undefined} data-disabled={disabled || undefined} data-number={isNumber || undefined} style={rootStyle}>
  {#if label}
    <label for={inputId} class="aesir-input__label">
      <span>
        {label}
        {#if optional}<span class="aesir-input__optional">(optional)</span>{/if}
      </span>
      {#if hasLabelError}<span id={messageId} class="aesir-input__label-error" aria-live="polite">{error}</span>{/if}
    </label>
  {/if}
  <div class="aesir-input__control" data-number={isNumber || undefined}>
    {#if leading && leadingVisible}<span class="aesir-input__adornment aesir-input__adornment--leading">{@render leading()}</span>{/if}
    {#if isNumber}
      <button class="aesir-input__stepper" type="button" disabled={atMinimum} aria-label={label ? `Decrease ${label}` : 'Decrease value'} onclick={() => stepValue(-1)}>
        <Minus aria-hidden="true" />
      </button>
    {/if}
    <input
      bind:this={inputRef}
      id={inputId}
      {type}
      bind:value
      {disabled}
      {readonly}
      {required}
      {min}
      {max}
      {step}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      {...restProps}
    />
    {#if isNumber}
      <button class="aesir-input__stepper" type="button" disabled={atMaximum} aria-label={label ? `Increase ${label}` : 'Increase value'} onclick={() => stepValue(1)}>
        <Plus aria-hidden="true" />
      </button>
    {/if}
    {#if trailing && trailingVisible}<span class="aesir-input__adornment aesir-input__adornment--trailing">{@render trailing()}</span>{/if}
  </div>
  <div class="aesir-input__support" data-visible={hasSupport || undefined}>
    <div class="aesir-input__support-inner">
      {#if hasMessageError}
        <span id={messageId} class="aesir-input__message" aria-live="polite">{error}</span>
      {:else if !error && description}
        <span id={messageId} class="aesir-input__description">{description}</span>
      {:else if reserveMessageSpace}
        <span class="aesir-input__description" aria-hidden="true">&nbsp;</span>
      {/if}
    </div>
  </div>
</div>

<style>
  :global {
    .aesir-input {
      box-sizing: border-box;
      display: grid;
      width: 100%;
      color: var(--ds-foreground);
      --aesir-input-height: var(--ds-spacing-10);
      --aesir-input-font-size: var(--ds-font-size-sm);
      --aesir-input-stepper-width: var(--ds-spacing-10);
    }

    .aesir-input[data-size='sm'] {
      --aesir-input-height: var(--ds-spacing-8);
      --aesir-input-font-size: var(--ds-font-size-sm);
      --aesir-input-stepper-width: var(--ds-spacing-8);
    }

    .aesir-input[data-size='lg'] {
      --aesir-input-height: var(--ds-spacing-12);
      --aesir-input-font-size: var(--ds-font-size-base);
      --aesir-input-stepper-width: var(--ds-spacing-12);
    }

    .aesir-input__label {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--ds-spacing-3);
      margin-bottom: var(--ds-spacing-1-5);
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
    }

    .aesir-input__label-error {
      flex: 0 0 auto;
      color: var(--ds-foreground-red);
      font-size: var(--ds-font-size-xxs);
      font-weight: var(--ds-font-weight-medium);
      letter-spacing: 0.04em;
      line-height: var(--ds-font-line-height-xs);
      text-transform: uppercase;
      transition:
        opacity 160ms cubic-bezier(0.23, 1, 0.32, 1),
        transform 160ms cubic-bezier(0.23, 1, 0.32, 1);

      @starting-style {
        opacity: 0;
        transform: translateY(calc(var(--ds-spacing-1) * -1));
      }
    }

    .aesir-input__optional {
      margin-inline-start: var(--ds-spacing-1);
      color: var(--ds-foreground-muted);
      font-weight: var(--ds-font-weight-normal);
    }

    .aesir-input__control {
      box-sizing: border-box;
      display: flex;
      width: 100%;
      height: var(--aesir-input-height);
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-md);
      background: var(--ds-background);
      overflow: hidden;
      transition:
        border-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        box-shadow var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
    }

    .aesir-input input {
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      padding: 0 var(--ds-spacing-3);
      border: 0;
      outline: none;
      background: transparent;
      color: var(--ds-foreground);
      font-family: var(--ds-font-family-sans);
      font-size: var(--aesir-input-font-size);
      line-height: var(--ds-font-line-height-sm);
    }

    .aesir-input input::placeholder {
      color: var(--ds-foreground-muted);
    }

    .aesir-input__adornment {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      color: var(--ds-foreground-muted);
    }

    .aesir-input__adornment:empty {
      display: none;
    }

    .aesir-input__adornment--leading {
      padding-inline-start: var(--ds-spacing-3);
    }

    .aesir-input__adornment--leading + input {
      padding-inline-start: var(--ds-spacing-2);
    }

    .aesir-input__adornment--trailing {
      padding-inline-end: var(--ds-spacing-1);
    }

    .aesir-input__adornment :where(svg) {
      width: var(--ds-spacing-4);
      height: var(--ds-spacing-4);
      flex-shrink: 0;
    }

    .aesir-input__control:hover:has(input:not(:disabled)) {
      border-color: var(--ds-border-hover);
    }

    .aesir-input__control:focus-within {
      border-color: var(--ds-accent-ring);
      box-shadow: 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-surface);
    }

    .aesir-input input[type='number'] {
      appearance: textfield;
      padding-inline: var(--ds-spacing-2);
      text-align: center;
    }

    .aesir-input input[type='number']::-webkit-inner-spin-button,
    .aesir-input input[type='number']::-webkit-outer-spin-button {
      margin: 0;
      appearance: none;
    }

    .aesir-input input[type='search']::-webkit-search-cancel-button,
    .aesir-input input[type='search']::-webkit-search-decoration {
      appearance: none;
    }

    .aesir-input__stepper {
      display: grid;
      width: var(--aesir-number-stepper-width, var(--aesir-input-stepper-width));
      flex: 0 0 var(--aesir-number-stepper-width, var(--aesir-input-stepper-width));
      min-width: 0;
      padding: 0;
      place-items: center;
      border: 0;
      background: transparent;
      color: var(--ds-foreground-muted);
      cursor: pointer;
      touch-action: manipulation;
      transition:
        background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }

    .aesir-input__stepper:first-of-type {
      border-right: var(--ds-spacing-px) solid var(--ds-border);
    }

    .aesir-input__stepper:last-of-type {
      border-left: var(--ds-spacing-px) solid var(--ds-border);
    }

    .aesir-input__stepper:hover:not(:disabled) {
      background: var(--ds-surface-hover);
      color: var(--ds-foreground);
    }

    .aesir-input__stepper:active:not(:disabled) {
      transform: scale(0.94);
    }

    .aesir-input__stepper:focus-visible {
      outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
      outline-offset: calc(var(--ds-spacing-0-5) * -1);
    }

    .aesir-input__stepper:disabled {
      cursor: not-allowed;
      opacity: var(--ds-opacity-50);
    }

    .aesir-input__stepper svg {
      width: var(--ds-spacing-3);
      height: var(--ds-spacing-3);
      pointer-events: none;
    }

    .aesir-input__description,
    .aesir-input__message {
      display: block;
      font-size: var(--ds-font-size-xs);
      line-height: var(--ds-font-line-height-xs);
    }

    .aesir-input__support {
      display: grid;
      margin-top: 0;
      grid-template-rows: 0fr;
      opacity: 0;
      transform: translateY(calc(var(--ds-spacing-1) * -1));
      transition:
        grid-template-rows 180ms cubic-bezier(0.23, 1, 0.32, 1),
        margin-top 180ms cubic-bezier(0.23, 1, 0.32, 1),
        opacity 140ms ease-out,
        transform 180ms cubic-bezier(0.23, 1, 0.32, 1);
    }

    .aesir-input__support[data-visible] {
      margin-top: var(--ds-spacing-1-5);
      grid-template-rows: 1fr;
      opacity: 1;
      transform: translateY(0);
    }

    .aesir-input__support-inner {
      min-height: 0;
      overflow: hidden;
    }

    .aesir-input__description {
      color: var(--ds-foreground-muted);
    }

    .aesir-input__message {
      color: var(--ds-foreground-red);
    }

    .aesir-input[data-invalid] .aesir-input__control {
      border-color: var(--ds-border-red);
    }

    .aesir-input[data-disabled] {
      opacity: var(--ds-opacity-50);
    }

    .aesir-input input:disabled {
      cursor: not-allowed;
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-input__label-error,
      .aesir-input__support {
        transition-duration: 0ms;
        transform: none;
      }
    }
  }
</style>
