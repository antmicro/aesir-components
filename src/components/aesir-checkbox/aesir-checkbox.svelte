<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { restoreOnFormReset } from '../form-reset.svelte.js';

  type CheckboxProps = Omit<HTMLInputAttributes, 'aria-describedby' | 'checked' | 'class' | 'disabled' | 'id' | 'onclick' | 'readonly' | 'style' | 'type'> & {
    class?: string;
    style?: string;
    checked?: boolean;
    indeterminate?: boolean;
    label?: string;
    description?: string;
    disabled?: boolean;
    readonly?: boolean;
    id?: string;
    'aria-describedby'?: string;
    onclick?: (event: MouseEvent) => void;
  };

  let {
    class: className = '',
    style: rootStyle = undefined,
    checked = $bindable(false),
    indeterminate = $bindable(false),
    label = undefined,
    description = undefined,
    disabled = false,
    readonly = false,
    id,
    'aria-describedby': ariaDescribedBy,
    onclick,
    ...restProps
  }: CheckboxProps = $props();
  let input: HTMLInputElement;
  const initialChecked = $state.snapshot(checked);
  const initialIndeterminate = $state.snapshot(indeterminate);
  restoreOnFormReset(
    () => input,
    () => {
      checked = initialChecked;
      indeterminate = initialIndeterminate;
    }
  );
  const fieldId = $props.id();
  const inputId = $derived(id ?? `${fieldId}-control`);
  const descriptionId = $derived(`${fieldId}-description`);
  const describedBy = $derived([ariaDescribedBy, description ? descriptionId : undefined].filter(Boolean).join(' ') || undefined);

  $effect(() => {
    if (input) input.indeterminate = indeterminate;
  });

  const preventReadonlyChange = (event: MouseEvent) => {
    if (readonly) event.preventDefault();
    else if (indeterminate) indeterminate = false;
    onclick?.(event);
  };
</script>

<div
  class={`aesir-checkbox ${className}`.trim()}
  data-state={indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked'}
  data-disabled={disabled || undefined}
  data-readonly={readonly || undefined}
  style={rootStyle}
>
  <label class="aesir-checkbox__control-label" for={inputId}>
    <input
      bind:this={input}
      id={inputId}
      type="checkbox"
      bind:checked
      {disabled}
      aria-readonly={readonly || undefined}
      aria-checked={indeterminate ? 'mixed' : undefined}
      aria-describedby={describedBy}
      onclick={preventReadonlyChange}
      {...restProps}
    />
    <span class="aesir-checkbox__control" aria-hidden="true"></span>
    {#if label}<span class="aesir-checkbox__label">{label}</span>{/if}
  </label>
  {#if description}<span id={descriptionId} class="aesir-checkbox__description">{description}</span>{/if}
</div>

<style>
  :global {
    .aesir-checkbox {
      display: inline-grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: start;
      gap: var(--ds-spacing-2);
      color: var(--ds-foreground);
      cursor: pointer;
    }

    .aesir-checkbox__control-label {
      display: contents;
      cursor: inherit;
    }

    .aesir-checkbox input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .aesir-checkbox__control {
      position: relative;
      display: grid;
      width: var(--ds-spacing-4);
      height: var(--ds-spacing-4);
      margin-top: var(--ds-spacing-0-5);
      place-items: center;
      border: var(--ds-spacing-px) solid var(--ds-border-hover);
      border-radius: var(--ds-radius-sm);
      background: var(--ds-background);
      transition:
        background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        border-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
    }

    .aesir-checkbox__control::after {
      width: var(--ds-spacing-1-5);
      height: var(--ds-spacing-2-5);
      border-right: var(--ds-spacing-0-5) solid var(--ds-background);
      border-bottom: var(--ds-spacing-0-5) solid var(--ds-background);
      content: '';
      opacity: 0;
      transform: translateY(calc(var(--ds-spacing-0-5) * -1)) rotate(45deg) scale(0.75);
      transition:
        opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-out),
        transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }

    .aesir-checkbox input:checked + .aesir-checkbox__control {
      border-color: var(--ds-accent);
      background: var(--ds-accent);
    }

    .aesir-checkbox input:indeterminate + .aesir-checkbox__control {
      border-color: var(--ds-accent);
      background: var(--ds-accent);
    }

    .aesir-checkbox input:checked + .aesir-checkbox__control::after {
      opacity: 1;
      transform: translateY(calc(var(--ds-spacing-0-5) * -1)) rotate(45deg) scale(1);
    }

    .aesir-checkbox input:indeterminate + .aesir-checkbox__control::after {
      width: var(--ds-spacing-2);
      height: var(--ds-spacing-0-5);
      border: 0;
      border-radius: var(--ds-radius-full);
      background: var(--ds-background);
      opacity: 1;
      transform: none;
    }

    .aesir-checkbox input:focus-visible + .aesir-checkbox__control {
      outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
      outline-offset: var(--ds-spacing-0-5);
    }

    .aesir-checkbox__label {
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-font-line-height-sm);
    }

    .aesir-checkbox__description {
      grid-column: 2;
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xs);
      line-height: var(--ds-font-line-height-xs);
    }

    .aesir-checkbox[data-disabled],
    .aesir-checkbox[data-readonly] {
      cursor: not-allowed;
      opacity: var(--ds-opacity-50);
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-checkbox__control,
      .aesir-checkbox__control::after {
        transition-duration: var(--ds-motion-duration-instant);
      }
    }
  }
</style>
