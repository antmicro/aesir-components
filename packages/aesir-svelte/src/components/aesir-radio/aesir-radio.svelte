<script module lang="ts">
  const restoredGroups = new WeakMap<Event, string[]>();
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { restoreOnFormReset } from '../form-reset.svelte.js';

  type RadioValue = string | number;
  type RadioProps = Omit<HTMLInputAttributes, 'aria-describedby' | 'aria-labelledby' | 'class' | 'disabled' | 'id' | 'name' | 'onclick' | 'readonly' | 'style' | 'type' | 'value'> & {
    class?: string;
    style?: string;
    group?: RadioValue;
    value: RadioValue;
    label: string;
    description?: string;
    disabled?: boolean;
    readonly?: boolean;
    name?: string;
    id?: string;
    'aria-describedby'?: string;
    'aria-labelledby'?: string;
    onclick?: (event: MouseEvent) => void;
  };

  let {
    class: className = '',
    style: rootStyle = undefined,
    group = $bindable(),
    value,
    label,
    description = undefined,
    disabled = false,
    readonly = false,
    name = undefined,
    id,
    'aria-describedby': ariaDescribedBy,
    'aria-labelledby': ariaLabelledBy,
    onclick,
    onchange,
    ...restProps
  }: RadioProps = $props();
  let input: HTMLInputElement;
  const initialGroup = $state.snapshot(group);
  const initialChecked = untrack(() => group === value);
  restoreOnFormReset(
    () => input,
    (event) => {
      if (input.name) {
        let groups = restoredGroups.get(event);
        if (!groups) {
          groups = [];
          restoredGroups.set(event, groups);
        }
        if (groups.includes(input.name)) return;
        groups.push(input.name);
      }
      group = initialGroup;
      syncNativeRadioGroup();
    }
  );
  const fieldId = $props.id();
  const inputId = $derived(id ?? `${fieldId}-control`);
  const labelId = $derived(`${fieldId}-label`);
  const descriptionId = $derived(`${fieldId}-description`);
  const describedBy = $derived([ariaDescribedBy, description ? descriptionId : undefined].filter(Boolean).join(' ') || undefined);
  const labelledBy = $derived(ariaLabelledBy ?? labelId);

  const syncNativeRadioGroup = () => {
    if (!input.name) {
      input.checked = group === value;
      return;
    }

    const controls = input.form ? Array.from(input.form.elements) : Array.from((input.getRootNode() as ParentNode).querySelectorAll('input[type="radio"]'));
    for (const control of controls) {
      if (control instanceof HTMLInputElement && control.type === 'radio' && control.name === input.name && control.form === input.form) {
        control.checked = control.value === String(group);
      }
    }
  };

  const preventReadonlyChange = (event: MouseEvent) => {
    if (readonly) {
      event.preventDefault();
      queueMicrotask(syncNativeRadioGroup);
    }
    onclick?.(event);
  };

  const handleChange = (event: Event & { currentTarget: HTMLInputElement }) => {
    if (readonly) syncNativeRadioGroup();
    else group = value;
    onchange?.(event);
  };
</script>

<label
  class={`aesir-radio ${className}`.trim()}
  for={inputId}
  data-state={group === value ? 'checked' : 'unchecked'}
  data-disabled={disabled || undefined}
  data-readonly={readonly || undefined}
  style={rootStyle}
>
  <input
    bind:this={input}
    id={inputId}
    type="radio"
    checked={group === value}
    defaultChecked={initialChecked}
    {value}
    {name}
    {disabled}
    aria-describedby={describedBy}
    aria-labelledby={labelledBy}
    onclick={preventReadonlyChange}
    onchange={handleChange}
    {...restProps}
  />
  <span class="aesir-radio__control" aria-hidden="true"></span>
  <span id={labelId} class="aesir-radio__label">{label}</span>
  {#if description}<span id={descriptionId} class="aesir-radio__description">{description}</span>{/if}
</label>

<style>
  :global {
    .aesir-radio {
      display: inline-grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: start;
      gap: var(--ds-spacing-2);
      color: var(--ds-foreground);
      cursor: pointer;
    }

    .aesir-radio input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .aesir-radio__control {
      width: var(--ds-spacing-4);
      height: var(--ds-spacing-4);
      margin-top: var(--ds-spacing-0-5);
      border: var(--ds-spacing-px) solid var(--ds-border-hover);
      border-radius: var(--ds-radius-full);
      background: var(--ds-background);
      transition:
        background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        border-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        box-shadow var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }

    .aesir-radio input:checked + .aesir-radio__control {
      border-color: var(--ds-accent);
      box-shadow: inset 0 0 0 var(--ds-spacing-1) var(--ds-background);
      background: var(--ds-accent);
    }

    .aesir-radio input:focus-visible + .aesir-radio__control {
      outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
      outline-offset: var(--ds-spacing-0-5);
    }

    .aesir-radio__label {
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
      line-height: var(--ds-font-line-height-sm);
      overflow-wrap: anywhere;
    }

    .aesir-radio__description {
      grid-column: 2;
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xs);
      line-height: var(--ds-font-line-height-xs);
      overflow-wrap: anywhere;
    }

    .aesir-radio[data-disabled],
    .aesir-radio[data-readonly] {
      cursor: not-allowed;
      opacity: var(--ds-opacity-50);
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-radio__control {
        transition-duration: var(--ds-motion-duration-instant);
      }
    }
  }
</style>
