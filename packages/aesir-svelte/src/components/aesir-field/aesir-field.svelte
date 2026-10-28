<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  type FieldContext = { controlId: string; describedBy?: string; invalid: boolean; disabled: boolean; required: boolean };
  type FieldProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'id' | 'style'> & {
    class?: string;
    style?: string;
    id?: string;
    label?: string;
    description?: string;
    error?: string;
    optional?: boolean;
    required?: boolean;
    disabled?: boolean;
    reserveMessageSpace?: boolean;
    children?: Snippet<[FieldContext]>;
  };
  let {
    class: className = '',
    style: rootStyle,
    id,
    label,
    description,
    error,
    optional = false,
    required = false,
    disabled = false,
    reserveMessageSpace = false,
    children,
    ...restProps
  }: FieldProps = $props();

  const uid = $props.id();
  const controlId = $derived(id ?? `${uid}-control`);
  const messageId = $derived(`${uid}-${error ? 'error' : 'description'}`);
  const describedBy = $derived(error || description ? messageId : undefined);
  const hasSupport = $derived(Boolean(error || description || reserveMessageSpace));
</script>

<div class={`aesir-field ${className}`.trim()} data-invalid={error ? true : undefined} data-disabled={disabled || undefined} style={rootStyle} {...restProps}>
  {#if label}
    <label class="aesir-field__label" for={controlId}>
      <span>
        {label}{#if optional}<span class="aesir-field__optional">(optional)</span>{/if}
      </span>
      {#if required}<span class="aesir-field__required" aria-hidden="true">Required</span>{/if}
    </label>
  {/if}
  <div class="aesir-field__control">
    {@render children?.({ controlId, describedBy, invalid: Boolean(error), disabled, required })}
  </div>
  <div class="aesir-field__support" data-visible={hasSupport || undefined}>
    {#if error}<span id={messageId} class="aesir-field__error" aria-live="polite">{error}</span>
    {:else if description}<span id={messageId} class="aesir-field__description">{description}</span>
    {:else if reserveMessageSpace}<span aria-hidden="true">&nbsp;</span>{/if}
  </div>
</div>

<style>
  :global {
    .aesir-field {
      box-sizing: border-box;
      display: grid;
      width: 100%;
      color: var(--ds-foreground);
    }
    .aesir-field__label {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--ds-spacing-3);
      margin-bottom: var(--ds-spacing-1-5);
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
    }
    .aesir-field__optional {
      margin-inline-start: var(--ds-spacing-1);
      color: var(--ds-foreground-muted);
      font-weight: var(--ds-font-weight-normal);
    }
    .aesir-field__required {
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xxs);
      font-weight: var(--ds-font-weight-medium);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .aesir-field__control {
      min-width: 0;
    }
    .aesir-field__support {
      display: grid;
      grid-template-rows: 0fr;
      opacity: 0;
      transition:
        grid-template-rows var(--ds-motion-duration-fast) var(--ds-motion-easing-out),
        opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
    }
    .aesir-field__support[data-visible] {
      grid-template-rows: 1fr;
      opacity: 1;
    }
    .aesir-field__support > * {
      min-height: 0;
      overflow: hidden;
      padding-top: var(--ds-spacing-1-5);
      font-size: var(--ds-font-size-xs);
    }
    .aesir-field__description {
      color: var(--ds-foreground-muted);
    }
    .aesir-field__error {
      color: var(--ds-foreground-red);
    }
    .aesir-field[data-disabled] {
      opacity: 0.55;
    }
    @media (prefers-reduced-motion: reduce) {
      .aesir-field__support {
        transition: none;
      }
    }
  }
</style>
