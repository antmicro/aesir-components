<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirBadge } from '../aesir-badge/index.js';
  import { AesirIcon } from '../aesir-icon/index.js';

  type StepValue = string | number;
  type StepItem = { value: StepValue; label: string; description?: string; eyebrow?: string; status?: string; statusVariant?: 'success' | 'secondary' | 'outline'; icon?: string; disabled?: boolean };
  type StepperProps = Omit<HTMLAttributes<HTMLElement>, 'class' | 'onchange'> & {
    class?: string;
    items?: StepItem[];
    value?: StepValue;
    orientation?: 'horizontal' | 'vertical';
    label?: string;
    linear?: boolean;
    showStatus?: boolean;
    completedLabel?: string;
    currentLabel?: string;
    upcomingLabel?: string;
    onchange?: (item: StepItem) => void;
  };
  let {
    class: className = '',
    items = [],
    value = $bindable(),
    orientation = 'horizontal',
    label = 'Progress',
    linear = false,
    showStatus = true,
    completedLabel = 'Completed',
    currentLabel = 'In progress',
    upcomingLabel = 'Pending',
    onchange,
    ...restProps
  }: StepperProps = $props();

  const selected = $derived(items.findIndex((item) => item.value === value && !item.disabled));
  const active = $derived(selected >= 0 ? selected : items.findIndex((item) => !item.disabled));
  const isComplete = (index: number) => !items[index]?.disabled && selected >= 0 && index < selected;
  const stateFor = (index: number) => (isComplete(index) ? 'complete' : index === active ? 'current' : 'upcoming');
  const statusFor = (item: StepItem, index: number) => item.status ?? (isComplete(index) ? completedLabel : index === active ? currentLabel : upcomingLabel);
  const badgeFor = (item: StepItem, index: number) => item.statusVariant ?? (isComplete(index) ? 'success' : index === active ? 'secondary' : 'outline');

  const choose = (item: StepItem, index: number) => {
    if (item.disabled || (linear && index > active) || value === item.value) return;
    value = item.value;
    onchange?.(item);
  };
</script>

<nav class={`aesir-stepper ${className}`.trim()} data-orientation={orientation} aria-label={label} {...restProps}>
  <ol>
    {#each items as item, index (item.value)}
      <li data-state={stateFor(index)}>
        <button type="button" disabled={item.disabled || (linear && index > active)} aria-current={index === active ? 'step' : undefined} onclick={() => choose(item, index)}>
          <span class="aesir-stepper__rail" aria-hidden="true">
            <span class="aesir-stepper__indicator">
              {#if isComplete(index)}
                <AesirIcon name="check" size={16} />
              {:else if item.icon}
                <AesirIcon name={item.icon} size={16} />
              {:else}
                {index + 1}
              {/if}
            </span>
          </span>
          <span class="aesir-stepper__copy">
            <small class="aesir-stepper__eyebrow">{item.eyebrow ?? `Step ${index + 1}`}</small>
            <strong>{item.label}</strong>
            {#if item.description}<small class="aesir-stepper__description">{item.description}</small>{/if}
            {#if showStatus && statusFor(item, index)}
              <AesirBadge size="sm" variant={badgeFor(item, index)}>{statusFor(item, index)}</AesirBadge>
            {/if}
          </span>
        </button>
      </li>
    {/each}
  </ol>
</nav>

<style>
  :global {
    .aesir-stepper ol {
      display: flex;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .aesir-stepper li {
      min-width: 0;
      flex: 1;
    }
    .aesir-stepper button {
      display: grid;
      width: 100%;
      min-width: 0;
      gap: var(--ds-spacing-3);
      padding: 0 var(--ds-spacing-4) 0 0;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--ds-foreground);
      font: inherit;
      text-align: left;
      cursor: pointer;
    }
    .aesir-stepper__rail {
      position: relative;
      display: flex;
      width: 100%;
      height: var(--ds-spacing-8);
      align-items: center;
    }
    .aesir-stepper li:not(:last-child) .aesir-stepper__rail::after {
      position: absolute;
      top: 50%;
      right: 0;
      left: calc(var(--ds-spacing-8) + var(--ds-spacing-3));
      height: var(--ds-spacing-px);
      background: var(--ds-border);
      content: '';
      transform: translateY(-50%);
      transition: background-color var(--ds-motion-duration-moderate) var(--ds-motion-easing-subtle);
    }
    .aesir-stepper li[data-state='complete'] .aesir-stepper__rail::after {
      background: var(--ds-accent);
    }
    .aesir-stepper__indicator {
      position: relative;
      z-index: 1;
      display: grid;
      width: var(--ds-spacing-8);
      height: var(--ds-spacing-8);
      flex: 0 0 auto;
      place-items: center;
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-full);
      background: var(--ds-background);
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xs);
      transition:
        background-color var(--ds-motion-duration-moderate) var(--ds-motion-easing-subtle),
        border-color var(--ds-motion-duration-moderate) var(--ds-motion-easing-subtle),
        color var(--ds-motion-duration-moderate) var(--ds-motion-easing-subtle),
        transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }
    .aesir-stepper [data-state='complete'] .aesir-stepper__indicator {
      border-color: var(--ds-accent);
      background: var(--ds-accent);
      color: var(--ds-accent-foreground);
    }
    .aesir-stepper [data-state='current'] .aesir-stepper__indicator {
      border-color: var(--ds-foreground);
      background: var(--ds-foreground);
      color: var(--ds-background);
    }
    .aesir-stepper__copy {
      display: grid;
      justify-items: start;
      min-width: 0;
      gap: var(--ds-spacing-1-5);
      overflow-wrap: anywhere;
    }
    .aesir-stepper .aesir-badge {
      max-width: 100%;
      white-space: normal;
    }
    .aesir-stepper__eyebrow {
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xxs);
      font-weight: var(--ds-font-weight-medium);
      letter-spacing: 0.04em;
      line-height: var(--ds-font-line-height-xs);
      text-transform: uppercase;
    }
    .aesir-stepper strong {
      font-size: var(--ds-font-size-base);
      font-weight: var(--ds-font-weight-medium);
      line-height: var(--ds-font-line-height-base);
    }
    .aesir-stepper__description {
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-font-line-height-sm);
    }
    .aesir-stepper [data-state='upcoming'] .aesir-stepper__copy {
      color: var(--ds-foreground-muted);
    }
    .aesir-stepper button:focus-visible .aesir-stepper__indicator {
      box-shadow:
        0 0 0 var(--ds-spacing-0-5) var(--ds-background),
        0 0 0 var(--ds-spacing-1) var(--ds-accent-ring);
    }
    .aesir-stepper button:hover:not(:disabled) .aesir-stepper__indicator {
      transform: scale(1.06);
    }
    .aesir-stepper button:active:not(:disabled) .aesir-stepper__indicator {
      transform: scale(0.94);
    }
    .aesir-stepper button:disabled {
      cursor: not-allowed;
    }
    .aesir-stepper button:disabled .aesir-stepper__copy,
    .aesir-stepper button:disabled .aesir-stepper__indicator {
      opacity: var(--ds-opacity-50);
    }

    .aesir-stepper[data-orientation='vertical'] ol {
      flex-direction: column;
      gap: var(--ds-spacing-4);
    }
    .aesir-stepper[data-orientation='vertical'] button {
      grid-template-columns: var(--ds-spacing-8) minmax(0, 1fr);
      gap: var(--ds-spacing-3);
      padding-bottom: var(--ds-spacing-4);
    }
    .aesir-stepper[data-orientation='vertical'] .aesir-stepper__rail {
      width: var(--ds-spacing-8);
      height: 100%;
      min-height: var(--ds-spacing-8);
      align-items: flex-start;
    }
    .aesir-stepper[data-orientation='vertical'] li:not(:last-child) .aesir-stepper__rail::after {
      top: calc(var(--ds-spacing-8) + var(--ds-spacing-2));
      right: auto;
      bottom: calc(var(--ds-spacing-6) * -1);
      left: 50%;
      width: var(--ds-spacing-px);
      height: auto;
      transform: translateX(-50%);
    }
    @media (prefers-reduced-motion: reduce) {
      .aesir-stepper__rail::after,
      .aesir-stepper__indicator {
        transition-duration: var(--ds-motion-duration-instant);
      }
      .aesir-stepper button:hover:not(:disabled) .aesir-stepper__indicator,
      .aesir-stepper button:active:not(:disabled) .aesir-stepper__indicator {
        transform: none;
      }
    }
  }
</style>
