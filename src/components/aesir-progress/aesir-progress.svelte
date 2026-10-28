<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  type ProgressProps = Omit<HTMLAttributes<HTMLDivElement>, 'class'> & {
    class?: string;
    value?: number;
    max?: number;
    label?: string;
    showValue?: boolean;
    indeterminate?: boolean;
    size?: 'sm' | 'default' | 'lg';
    variant?: 'default' | 'success' | 'warning' | 'destructive';
    formatValue?: (value: number, max: number) => string;
  };

  let {
    class: className = '',
    value = 0,
    max = 100,
    label = undefined,
    showValue = false,
    indeterminate = false,
    size = 'default',
    variant = 'default',
    formatValue = undefined,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    ...restProps
  }: ProgressProps = $props();
  const normalizedMax = $derived(Number.isFinite(Number(max)) && Number(max) > 0 ? Number(max) : 100);
  const finiteValue = $derived(Number.isFinite(Number(value)) ? Number(value) : 0);
  const boundedValue = $derived(Math.min(Math.max(finiteValue, 0), normalizedMax));
  const percent = $derived((boundedValue / normalizedMax) * 100);
  const valueLabel = $derived(formatValue?.(boundedValue, normalizedMax) ?? `${Math.round(percent)}%`);
</script>

<div {...restProps} class={`aesir-progress ${className}`.trim()} data-size={size} data-variant={variant} data-indeterminate={indeterminate || undefined}>
  {#if label || (showValue && !indeterminate)}<div class="aesir-progress__header">
      {#if label}<span>{label}</span>{/if}{#if showValue && !indeterminate}<span class="aesir-progress__value">{valueLabel}</span>{/if}
    </div>{/if}
  <div
    class="aesir-progress__track"
    role="progressbar"
    aria-label={ariaLabel ?? label ?? 'Progress'}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={ariaDescribedBy}
    aria-valuemin="0"
    aria-valuemax={normalizedMax}
    aria-valuenow={indeterminate ? undefined : boundedValue}
    aria-valuetext={indeterminate ? undefined : valueLabel}
  >
    <div class="aesir-progress__indicator" style={indeterminate ? undefined : `--aesir-progress-value: ${percent}%`}></div>
  </div>
</div>

<style>
  :global {
    .aesir-progress {
      display: grid;
      width: 100%;
      gap: var(--ds-spacing-2);
      --aesir-progress-height: var(--ds-spacing-2);
      --aesir-progress-color: var(--ds-accent);
    }
    .aesir-progress[data-size='sm'] {
      --aesir-progress-height: var(--ds-spacing-1);
    }
    .aesir-progress[data-size='lg'] {
      --aesir-progress-height: var(--ds-spacing-3);
    }
    .aesir-progress[data-variant='success'] {
      --aesir-progress-color: var(--ds-emphasis-green);
    }
    .aesir-progress[data-variant='warning'] {
      --aesir-progress-color: var(--ds-emphasis-orange);
    }
    .aesir-progress[data-variant='destructive'] {
      --aesir-progress-color: var(--ds-emphasis-red);
    }
    .aesir-progress__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-spacing-3);
      min-width: 0;
      overflow-wrap: anywhere;
      color: var(--ds-foreground);
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
    }
    .aesir-progress__value {
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xs);
      font-variant-numeric: tabular-nums;
    }
    .aesir-progress__track {
      width: 100%;
      height: var(--aesir-progress-height);
      overflow: hidden;
      border-radius: var(--ds-radius-full);
      background: var(--ds-surface-active);
    }
    .aesir-progress__indicator {
      width: 100%;
      height: 100%;
      border-radius: inherit;
      background: var(--aesir-progress-color);
      transform: translateX(calc(var(--aesir-progress-value, 0%) - 100%));
      transition: transform var(--ds-motion-duration-moderate) var(--ds-motion-easing-out);
    }
    .aesir-progress[data-indeterminate] .aesir-progress__indicator {
      width: 40%;
      animation: aesir-progress-indeterminate 1.2s ease-in-out infinite;
      transform: translateX(-100%);
    }
    @keyframes aesir-progress-indeterminate {
      50% {
        transform: translateX(150%);
      }
      100% {
        transform: translateX(250%);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .aesir-progress__indicator {
        transition: none;
      }
      .aesir-progress[data-indeterminate] .aesir-progress__indicator {
        width: 100%;
        animation: aesir-progress-pulse 1.5s ease-in-out infinite;
        transform: none;
      }
      @keyframes aesir-progress-pulse {
        50% {
          opacity: 0.45;
        }
      }
    }
  }
</style>
