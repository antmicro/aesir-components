<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { restoreOnFormReset } from '../form-reset.svelte.js';

  type SwitchProps = Omit<HTMLInputAttributes, 'aria-describedby' | 'checked' | 'class' | 'disabled' | 'id' | 'onclick' | 'readonly' | 'style' | 'type'> & {
    class?: string;
    style?: string;
    checked?: boolean;
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
    label = undefined,
    description = undefined,
    disabled = false,
    readonly = false,
    id,
    'aria-describedby': ariaDescribedBy,
    onclick,
    ...restProps
  }: SwitchProps = $props();
  let input: HTMLInputElement;
  const initialChecked = $state.snapshot(checked);
  restoreOnFormReset(
    () => input,
    () => (checked = initialChecked)
  );
  const fieldId = $props.id();
  const inputId = $derived(id ?? `${fieldId}-control`);
  const descriptionId = $derived(`${fieldId}-description`);
  const describedBy = $derived([ariaDescribedBy, description ? descriptionId : undefined].filter(Boolean).join(' ') || undefined);

  const preventReadonlyChange = (event: MouseEvent) => {
    if (readonly) event.preventDefault();
    onclick?.(event);
  };
</script>

<div class={`aesir-switch ${className}`.trim()} data-state={checked ? 'checked' : 'unchecked'} data-disabled={disabled || undefined} data-readonly={readonly || undefined} style={rootStyle}>
  <label class="aesir-switch__control-label" for={inputId}>
    {#if label}<span class="aesir-switch__label">{label}</span>{/if}
    <input
      bind:this={input}
      id={inputId}
      type="checkbox"
      role="switch"
      bind:checked
      {disabled}
      aria-readonly={readonly || undefined}
      aria-describedby={describedBy}
      onclick={preventReadonlyChange}
      {...restProps}
    />
    <span class="aesir-switch__track" aria-hidden="true"><span></span></span>
    {#if description}<span id={descriptionId} class="aesir-switch__description" aria-hidden="true">{description}</span>{/if}
  </label>
</div>

<style>
  :global {
    .aesir-switch {
      display: inline-grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--ds-spacing-3);
      color: var(--ds-foreground);
      cursor: pointer;
    }

    .aesir-switch__control-label {
      display: contents;
      cursor: inherit;
    }

    .aesir-switch__label {
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
      line-height: var(--ds-font-line-height-sm);
    }

    .aesir-switch__description {
      grid-column: 1;
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xs);
      line-height: var(--ds-font-line-height-xs);
    }

    .aesir-switch input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .aesir-switch__track {
      display: flex;
      box-sizing: border-box;
      width: var(--ds-spacing-10);
      height: var(--ds-spacing-6);
      align-items: center;
      padding: var(--ds-spacing-0-5);
      border-radius: var(--ds-radius-full);
      background: var(--ds-surface-active);
      transition: background-color var(--ds-motion-duration-moderate) var(--ds-motion-easing-subtle);
    }

    .aesir-switch__track span {
      width: var(--ds-spacing-5);
      height: var(--ds-spacing-5);
      border-radius: var(--ds-radius-full);
      background: var(--ds-background);
      transition: transform var(--ds-motion-duration-moderate) var(--ds-motion-easing-in-out);
    }

    .aesir-switch input:checked + .aesir-switch__track {
      background: var(--ds-accent);
    }

    .aesir-switch input:checked + .aesir-switch__track span {
      transform: translateX(var(--ds-spacing-4));
    }

    .aesir-switch input:focus-visible + .aesir-switch__track {
      outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
      outline-offset: var(--ds-spacing-0-5);
    }

    .aesir-switch[data-disabled],
    .aesir-switch[data-readonly] {
      cursor: not-allowed;
      opacity: var(--ds-opacity-50);
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-switch__track,
      .aesir-switch__track span {
        transition-duration: var(--ds-motion-duration-instant);
      }
    }
  }
</style>
