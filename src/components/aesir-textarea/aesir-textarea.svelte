<script lang="ts">
  import { tick } from 'svelte';
  import type { HTMLTextareaAttributes } from 'svelte/elements';
  import { restoreOnFormReset } from '../form-reset.svelte.js';

  type TextareaProps = Omit<HTMLTextareaAttributes, 'aria-describedby' | 'class' | 'disabled' | 'id' | 'maxlength' | 'required' | 'rows' | 'style' | 'value'> & {
    class?: string;
    style?: string;
    value?: string;
    id?: string;
    label?: string;
    description?: string;
    error?: string;
    errorPlacement?: 'message' | 'label';
    size?: 'sm' | 'default' | 'lg';
    disabled?: boolean;
    optional?: boolean;
    required?: boolean;
    reserveMessageSpace?: boolean;
    resize?: 'none' | 'vertical' | 'horizontal' | 'both' | 'auto';
    rows?: number;
    maxlength?: number;
    showCount?: boolean;
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
    size = 'default',
    disabled = false,
    optional = false,
    required = false,
    reserveMessageSpace = false,
    resize = 'vertical',
    rows = 4,
    maxlength,
    showCount = false,
    'aria-describedby': ariaDescribedBy,
    ...restProps
  }: TextareaProps = $props();
  let textareaRef: HTMLTextAreaElement;
  let metricsRef = $state<HTMLSpanElement>();
  const initialValue = $state.snapshot(value);
  restoreOnFormReset(
    () => textareaRef,
    () => (value = initialValue)
  );

  const fieldId = $props.id();
  const textareaId = $derived(id ?? `${fieldId}-control`);
  const messageId = $derived(`${fieldId}-${error ? 'error' : 'description'}`);
  const describedBy = $derived([ariaDescribedBy, error || description ? messageId : undefined].filter(Boolean).join(' ') || undefined);
  const hasLabelError = $derived(Boolean(error && errorPlacement === 'label' && label));
  const hasMessageError = $derived(Boolean(error && !hasLabelError));
  const hasSupport = $derived(Boolean(hasMessageError || (!error && description) || showCount || reserveMessageSpace));
  const count = $derived(String(value ?? '').length);
  const measureHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  $effect(() => {
    if (resize !== 'auto' || !textareaRef) return;
    value;
    rows;
    size;
    let canceled = false;
    const element = textareaRef;
    void tick().then(() => {
      if (!canceled) measureHeight(element);
    });
    return () => {
      canceled = true;
    };
  });

  $effect(() => {
    if (resize !== 'auto' || !textareaRef || !metricsRef) return;
    const element = textareaRef;
    const metrics = metricsRef;
    let previousWidth = element.clientWidth;
    let frame: number | undefined;
    const observer = new ResizeObserver((entries) => {
      const width = element.clientWidth;
      if (width === previousWidth && !entries.some((entry) => entry.target === metrics)) return;
      previousWidth = width;
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = undefined;
        measureHeight(element);
      });
    });
    observer.observe(element);
    observer.observe(metrics, { box: 'border-box' });
    return () => {
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
      element.style.height = '';
    };
  });
</script>

<div class={`aesir-textarea ${className}`.trim()} data-size={size} data-invalid={error ? true : undefined} data-disabled={disabled || undefined} data-resize={resize} style={rootStyle}>
  {#if label}
    <label for={textareaId} class="aesir-textarea__label">
      <span>
        {label}{#if optional}<span class="aesir-textarea__optional">(optional)</span>{/if}
      </span>
      {#if hasLabelError}<span id={messageId} class="aesir-textarea__label-error" aria-live="polite">{error}</span>{/if}
    </label>
  {/if}
  <textarea
    bind:this={textareaRef}
    id={textareaId}
    bind:value
    {disabled}
    {required}
    {rows}
    {maxlength}
    aria-invalid={error ? true : undefined}
    aria-describedby={describedBy}
    {...restProps}
  ></textarea>
  {#if resize === 'auto'}<span bind:this={metricsRef} class="aesir-textarea__metrics" aria-hidden="true">M</span>{/if}
  <div class="aesir-textarea__support" data-visible={hasSupport || undefined}>
    <div class="aesir-textarea__support-inner">
      <span>
        {#if hasMessageError}<span id={messageId} class="aesir-textarea__message" aria-live="polite">{error}</span>
        {:else if !error && description}<span id={messageId} class="aesir-textarea__description">{description}</span>
        {:else if reserveMessageSpace}<span aria-hidden="true">&nbsp;</span>{/if}
      </span>
      {#if showCount}<span class="aesir-textarea__count">
          {count}{#if maxlength !== undefined}
            / {maxlength}{/if}
        </span>{/if}
    </div>
  </div>
</div>

<style>
  :global {
    .aesir-textarea {
      display: grid;
      position: relative;
      width: 100%;
      color: var(--ds-foreground);
      --aesir-textarea-font-size: var(--ds-font-size-sm);
      --aesir-textarea-padding: var(--ds-spacing-3);
    }
    .aesir-textarea[data-size='sm'] {
      --aesir-textarea-font-size: var(--ds-font-size-xs);
      --aesir-textarea-padding: var(--ds-spacing-2-5);
    }
    .aesir-textarea[data-size='lg'] {
      --aesir-textarea-font-size: var(--ds-font-size-base);
      --aesir-textarea-padding: var(--ds-spacing-3-5);
    }
    .aesir-textarea__label {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--ds-spacing-3);
      margin-bottom: var(--ds-spacing-1-5);
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
    }
    .aesir-textarea__optional {
      margin-inline-start: var(--ds-spacing-1);
      color: var(--ds-foreground-muted);
      font-weight: var(--ds-font-weight-normal);
    }
    .aesir-textarea__label-error {
      flex: none;
      color: var(--ds-foreground-red);
      font-size: var(--ds-font-size-xxs);
      font-weight: var(--ds-font-weight-medium);
      letter-spacing: 0.04em;
      line-height: var(--ds-font-line-height-xs);
      text-transform: uppercase;
    }
    .aesir-textarea textarea {
      box-sizing: border-box;
      display: block;
      width: 100%;
      min-height: calc(var(--ds-spacing-10) * 2);
      padding: var(--aesir-textarea-padding);
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-md);
      outline: none;
      background: var(--ds-background);
      color: var(--ds-foreground);
      font-family: var(--ds-font-family-sans);
      font-size: var(--aesir-textarea-font-size);
      line-height: var(--ds-font-line-height-sm);
      resize: vertical;
      transition:
        border-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        box-shadow var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
    }
    .aesir-textarea[data-resize='none'] textarea,
    .aesir-textarea[data-resize='auto'] textarea {
      resize: none;
    }
    .aesir-textarea[data-resize='horizontal'] textarea {
      resize: horizontal;
    }
    .aesir-textarea[data-resize='both'] textarea {
      resize: both;
    }
    .aesir-textarea__metrics {
      position: absolute;
      top: 0;
      left: 0;
      visibility: hidden;
      width: max-content;
      padding: var(--aesir-textarea-padding);
      border: var(--ds-spacing-px) solid transparent;
      font-family: var(--ds-font-family-sans);
      font-size: var(--aesir-textarea-font-size);
      line-height: var(--ds-font-line-height-sm);
      pointer-events: none;
    }
    .aesir-textarea textarea::placeholder {
      color: var(--ds-foreground-muted);
    }
    .aesir-textarea textarea:hover:not(:disabled) {
      border-color: var(--ds-border-hover);
    }
    .aesir-textarea textarea:focus {
      border-color: var(--ds-accent-ring);
      box-shadow: 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-surface);
    }
    .aesir-textarea[data-invalid] textarea {
      border-color: var(--ds-border-red);
    }
    .aesir-textarea textarea:disabled {
      cursor: not-allowed;
      opacity: var(--ds-opacity-50);
    }
    .aesir-textarea__support {
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
    .aesir-textarea__support[data-visible] {
      margin-top: var(--ds-spacing-1-5);
      grid-template-rows: 1fr;
      opacity: 1;
      transform: translateY(0);
    }
    .aesir-textarea__support-inner {
      display: flex;
      min-height: 0;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--ds-spacing-3);
      overflow: hidden;
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xs);
      line-height: var(--ds-font-line-height-xs);
    }
    .aesir-textarea__message {
      color: var(--ds-foreground-red);
    }
    .aesir-textarea__count {
      flex: none;
      font-variant-numeric: tabular-nums;
    }
    @media (prefers-reduced-motion: reduce) {
      .aesir-textarea textarea,
      .aesir-textarea__support {
        transition: none;
      }
    }
  }
</style>
