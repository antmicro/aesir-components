<script lang="ts">
  import { onMount } from 'svelte';
  import type { HTMLSelectAttributes } from 'svelte/elements';
  import { AesirIcon } from '../aesir-icon/index.js';
  import { restoreOnFormReset } from '../form-reset.svelte.js';

  type SelectValue = string | number | undefined;
  type MultiSelectValue = (string | number)[];
  type SelectOption = { value: string | number; label: string; disabled?: boolean };
  type SelectGroup = { label: string; options: SelectOption[]; disabled?: boolean };
  type NativeSelectProps = Omit<HTMLSelectAttributes, 'aria-describedby' | 'class' | 'disabled' | 'id' | 'required' | 'style' | 'value'> & {
    class?: string;
    style?: string;
    value?: SelectValue;
    values?: MultiSelectValue;
    options?: (SelectOption | SelectGroup)[];
    multiple?: boolean;
    label?: string;
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    optional?: boolean;
    required?: boolean;
    id?: string;
    'aria-describedby'?: string;
  };

  let {
    class: className = '',
    style: rootStyle = undefined,
    value = $bindable(),
    values = $bindable([]),
    options = [],
    multiple = false,
    label = undefined,
    description = undefined,
    placeholder = undefined,
    disabled = false,
    optional = false,
    required = false,
    id,
    'aria-describedby': ariaDescribedBy,
    ...restProps
  }: NativeSelectProps = $props();
  let select = $state<HTMLSelectElement>();
  let initialValue = $state.snapshot(value);
  const initialValues = $state.snapshot(values);
  onMount(() => {
    initialValue = $state.snapshot(value);
  });
  restoreOnFormReset(
    () => select,
    () => {
      value = initialValue;
      values = [...initialValues];
    }
  );
  const fieldId = $props.id();
  const selectId = $derived(id ?? `${fieldId}-control`);
  const descriptionId = $derived(`${fieldId}-description`);
  const describedBy = $derived([ariaDescribedBy, description ? descriptionId : undefined].filter(Boolean).join(' ') || undefined);
  const availableValues = $derived(
    options.flatMap((option) => {
      if ('options' in option) return option.disabled ? [] : option.options.filter((child) => !child.disabled).map((child) => child.value);
      return option.disabled ? [] : [option.value];
    })
  );
  const previouslyAvailableValues: (string | number)[] = [];

  $effect(() => {
    const available = new Set(availableValues);
    if (multiple) {
      const nextValues = values.filter((selected) => available.has(selected) || !previouslyAvailableValues.includes(selected));
      if (nextValues.length !== values.length) values = nextValues;
    } else if (value !== undefined && previouslyAvailableValues.includes(value) && !available.has(value)) {
      value = placeholder ? undefined : availableValues[0];
    } else if (value === undefined && !placeholder && availableValues.length > 0) {
      value = availableValues[0];
    }
    for (const optionValue of available) {
      if (!previouslyAvailableValues.includes(optionValue)) previouslyAvailableValues.push(optionValue);
    }
  });
</script>

<div class={`aesir-native-select ${className}`.trim()} data-disabled={disabled || undefined} style={rootStyle}>
  {#if label}
    <label for={selectId} class="aesir-native-select__label">
      {label}
      {#if optional}<span class="aesir-native-select__optional">(optional)</span>{/if}
    </label>
  {/if}
  <span class="aesir-native-select__control">
    {#if multiple}
      <select bind:this={select} id={selectId} multiple bind:value={values} {disabled} {required} aria-describedby={describedBy} {...restProps}>
        {#each options as option, index (index)}
          {#if 'options' in option}
            <optgroup label={option.label} disabled={option.disabled}>
              {#each option.options as child, childIndex (childIndex)}<option value={child.value} disabled={child.disabled}>{child.label}</option>{/each}
            </optgroup>
          {:else}<option value={option.value} disabled={option.disabled}>{option.label}</option>{/if}
        {/each}
      </select>
    {:else}
      <select bind:this={select} id={selectId} bind:value {disabled} {required} aria-describedby={describedBy} {...restProps}>
        {#if placeholder}<option value={undefined} disabled>{placeholder}</option>{/if}
        {#each options as option, index (index)}
          {#if 'options' in option}
            <optgroup label={option.label} disabled={option.disabled}>
              {#each option.options as child, childIndex (childIndex)}<option value={child.value} disabled={child.disabled}>{child.label}</option>{/each}
            </optgroup>
          {:else}<option value={option.value} disabled={option.disabled}>{option.label}</option>{/if}
        {/each}
      </select>
      <AesirIcon class="aesir-native-select__icon" name="chevron-down" size={16} strokeWidth={1.75} />
    {/if}
  </span>
  {#if description}<span id={descriptionId} class="aesir-native-select__description">{description}</span>{/if}
</div>

<style>
  :global {
    .aesir-native-select {
      display: grid;
      width: 100%;
      gap: var(--ds-spacing-1-5);
      color: var(--ds-foreground);
    }

    .aesir-native-select__label {
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
    }

    .aesir-native-select__optional {
      margin-inline-start: var(--ds-spacing-1);
      color: var(--ds-foreground-muted);
      font-weight: var(--ds-font-weight-normal);
    }

    .aesir-native-select__control {
      position: relative;
    }

    .aesir-native-select__icon {
      position: absolute;
      top: 50%;
      right: var(--ds-spacing-3);
      pointer-events: none;
      transform: translateY(-50%);
    }

    .aesir-native-select select {
      width: 100%;
      height: var(--ds-spacing-10);
      padding: 0 var(--ds-spacing-10) 0 var(--ds-spacing-3);
      appearance: none;
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-md);
      outline: none;
      background: var(--ds-background);
      color: var(--ds-foreground);
      font-family: var(--ds-font-family-sans);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-font-line-height-sm);
      transition:
        border-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        box-shadow var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
    }

    .aesir-native-select select[multiple] {
      height: auto;
      min-height: var(--ds-spacing-20);
      padding: var(--ds-spacing-2);
      appearance: auto;
    }

    .aesir-native-select select:hover:not(:disabled) {
      border-color: var(--ds-border-hover);
    }

    .aesir-native-select select:focus-visible {
      border-color: var(--ds-accent-ring);
      box-shadow: 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-surface);
    }

    .aesir-native-select__description {
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xs);
      line-height: var(--ds-font-line-height-xs);
    }

    .aesir-native-select[data-disabled] {
      opacity: var(--ds-opacity-50);
    }

    .aesir-native-select select:disabled {
      cursor: not-allowed;
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-native-select select {
        transition-duration: var(--ds-motion-duration-instant);
      }
    }
  }
</style>
