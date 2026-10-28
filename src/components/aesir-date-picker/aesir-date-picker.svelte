<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { SvelteDate } from 'svelte/reactivity';
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirIcon } from '../aesir-icon/index.js';
  import { restoreOnFormReset } from '../form-reset.svelte.js';
  import { autoUpdateAnchoredPosition, getFloatingOverlayZIndex, portal, registerDismissableOverlay } from '../overlay/overlay.js';
  type DatePickerProps = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'onselect'> & {
    value?: string;
    open?: boolean;
    label: string;
    locale?: string;
    min?: string;
    max?: string;
    name?: string;
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    isDateUnavailable?: (date: string) => boolean;
    disabled?: boolean;
    onselect?: (date: string) => void;
    class?: string;
  };
  let {
    value = $bindable(''),
    open = $bindable(false),
    label,
    locale = 'en-US',
    min,
    max,
    name,
    weekStartsOn,
    isDateUnavailable,
    disabled = false,
    onselect,
    class: className = '',
    ...restProps
  }: DatePickerProps = $props();
  let root: HTMLDivElement;
  let trigger: HTMLButtonElement;
  let resetControl = $state<HTMLInputElement>();
  let calendar = $state<HTMLDivElement>();
  let position = $state('');
  const initialValue = $state.snapshot(value);
  restoreOnFormReset(
    () => resetControl,
    () => {
      value = initialValue;
      open = false;
    }
  );
  const uid = $props.id();
  const calendarId = `${uid}-calendar`;
  const localDate = (year: number, month: number, day: number) => {
    // Calendar cells are immutable computed values; only `view` needs reactive date tracking.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const date = new Date(0);
    date.setFullYear(year, month, day);
    date.setHours(12, 0, 0, 0);
    return date;
  };
  const parse = (date: string) => {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!parts) return new Date();
    const candidate = localDate(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
    return candidate.getFullYear() === Number(parts[1]) && candidate.getMonth() + 1 === Number(parts[2]) && candidate.getDate() === Number(parts[3]) ? candidate : new Date();
  };
  const iso = (date: Date) => `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const boundedViewDate = (selected: string, minimum?: string, maximum?: string) => {
    const date = parse(selected);
    const day = iso(date);
    if (minimum && day < minimum) return parse(minimum);
    if (maximum && day > maximum) return parse(maximum);
    return date;
  };
  const view = new SvelteDate(parse(value).getTime());
  const formatter = $derived(new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }));
  const firstWeekday = $derived(weekStartsOn ?? ((new Intl.Locale(locale) as Intl.Locale & { weekInfo?: { firstDay: number } }).weekInfo?.firstDay ?? 1) % 7);
  const weekdays = $derived([...Array(7)].map((_, i) => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 7 + ((firstWeekday + i) % 7)))));
  const cells = $derived.by(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const start = localDate(year, month, 1);
    const offset = (start.getDay() - firstWeekday + 7) % 7;
    return [...Array(42)].map((_, i) => localDate(year, month, i - offset + 1));
  });
  const unavailable = (date: string) => Boolean((min && date < min) || (max && date > max) || isDateUnavailable?.(date));
  const select = (date: Date) => {
    const next = iso(date);
    if (unavailable(next)) return;
    value = next;
    open = false;
    onselect?.(next);
    trigger?.focus();
  };
  const shift = (amount: number) => view.setTime(localDate(view.getFullYear(), view.getMonth() + amount, 1).getTime());
  const focusDate = async (date: Date) => {
    view.setTime(localDate(date.getFullYear(), date.getMonth(), 1).getTime());
    await tick();
    calendar?.querySelector<HTMLButtonElement>(`[data-date="${iso(date)}"]`)?.focus();
  };
  const onDateKeydown = (event: KeyboardEvent, date: Date) => {
    let next: Date | undefined;
    if (event.key === 'ArrowLeft') next = localDate(date.getFullYear(), date.getMonth(), date.getDate() - 1);
    if (event.key === 'ArrowRight') next = localDate(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    if (event.key === 'ArrowUp') next = localDate(date.getFullYear(), date.getMonth(), date.getDate() - 7);
    if (event.key === 'ArrowDown') next = localDate(date.getFullYear(), date.getMonth(), date.getDate() + 7);
    if (event.key === 'Home') next = localDate(date.getFullYear(), date.getMonth(), date.getDate() - ((date.getDay() - firstWeekday + 7) % 7));
    if (event.key === 'End') next = localDate(date.getFullYear(), date.getMonth(), date.getDate() + (6 - ((date.getDay() - firstWeekday + 7) % 7)));
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      const month = date.getMonth() + (event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1);
      next = localDate(date.getFullYear(), month, Math.min(date.getDate(), localDate(date.getFullYear(), month + 1, 0).getDate()));
    }
    if (!next) return;
    event.preventDefault();
    const direction = next < date ? -1 : 1;
    while (unavailable(iso(next)) && Math.abs(next.getTime() - date.getTime()) < 366 * 86400000) next.setDate(next.getDate() + direction);
    if (!unavailable(iso(next))) void focusDate(next);
  };
  const openCalendar = async () => {
    view.setTime(boundedViewDate(value, min, max).getTime());
    open = !open;
    if (!open) return;
    await tick();
    const preferred = value && !unavailable(value) ? value : cells.map(iso).find((date) => !unavailable(date));
    calendar?.querySelector<HTMLButtonElement>(`[data-date="${preferred}"]`)?.focus();
  };
  $effect(() => {
    if (disabled && open) open = false;
  });
  $effect(() => {
    const selected = value;
    const minimum = min;
    const maximum = max;
    if (open) untrack(() => view.setTime(boundedViewDate(selected, minimum, maximum).getTime()));
  });
  $effect(() => {
    if (!open || !trigger || !calendar) return;
    return autoUpdateAnchoredPosition(trigger, calendar, { width: 304 }, (next: { style: string }) => {
      const zIndex = getFloatingOverlayZIndex(trigger);
      position = `${next.style}${zIndex === undefined ? '' : `z-index:${zIndex};`}`;
    });
  });
  $effect(() => {
    if (!open || !root) return;
    return registerDismissableOverlay(root.ownerDocument, {
      branches: () => [root, calendar],
      exclusive: true,
      onDismiss: (reason: string) => {
        open = false;
        if (reason === 'escape') trigger?.focus();
      }
    });
  });
</script>

<div bind:this={root} class={`date-picker ${className ?? ''}`.trim()} {...restProps}>
  <input bind:this={resetControl} type="hidden" {name} {value} {disabled} />
  {#if label}<label class="date-picker__label" for={uid}>{label}</label>{/if}
  <button bind:this={trigger} id={uid} class="date-picker__trigger" type="button" {disabled} aria-haspopup="dialog" aria-expanded={open} aria-controls={calendarId} onclick={openCalendar}>
    <AesirIcon name="calendar" size={17} />
    <span>{value || 'Select a date'}</span>
    <AesirIcon name="chevron-down" size={15} />
  </button>
</div>
{#if open}
  <div
    use:portal
    bind:this={calendar}
    id={calendarId}
    class="date-picker__calendar aesir-overlay-motion"
    data-motion="popover"
    data-state="open"
    role="dialog"
    aria-label="Choose date"
    tabindex="-1"
    style={position}
  >
    <header>
      <button type="button" aria-label="Previous month" onclick={() => shift(-1)}><AesirIcon name="chevron-left" /></button>
      <strong aria-live="polite">{formatter.format(view)}</strong>
      <button type="button" aria-label="Next month" onclick={() => shift(1)}><AesirIcon name="chevron-right" /></button>
    </header>
    <div class="date-picker__grid" role="group" aria-label={formatter.format(view)}>
      {#each weekdays as day, index (index)}<span class="weekday">{day}</span>{/each}
      {#each cells as date (iso(date))}
        {@const dateValue = iso(date)}
        <button
          data-date={dateValue}
          type="button"
          class:outside={date.getMonth() !== view.getMonth()}
          class:selected={dateValue === value}
          aria-label={new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(date)}
          aria-pressed={dateValue === value}
          tabindex={dateValue === value || (!value && dateValue === iso(new Date())) ? 0 : -1}
          disabled={unavailable(dateValue)}
          onclick={() => select(date)}
          onkeydown={(event) => onDateKeydown(event, date)}
        >
          {date.getDate()}
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .date-picker {
    position: relative;
    display: grid;
    gap: var(--ds-spacing-2);
  }
  .date-picker__label {
    color: var(--ds-foreground);
    font-size: var(--ds-font-size-sm);
    font-weight: 600;
  }
  .date-picker__trigger {
    display: flex;
    width: 100%;
    height: var(--ds-spacing-10);
    align-items: center;
    gap: var(--ds-spacing-2);
    cursor: pointer;
    touch-action: manipulation;
    padding: 0 var(--ds-spacing-3);
    border: 1px solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background);
    color: var(--ds-foreground);
    font-family: inherit;
    font-size: var(--ds-font-size-sm);
    text-align: left;
    transition:
      background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      border-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      box-shadow var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
  }
  .date-picker__trigger:hover:not(:disabled) {
    border-color: var(--ds-border-hover);
    background: var(--ds-surface-hover);
  }
  .date-picker__trigger:active:not(:disabled) {
    transform: translateY(var(--ds-spacing-px));
  }
  .date-picker__trigger:focus-visible {
    outline: none;
    box-shadow: 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-ring);
  }
  .date-picker__trigger:disabled {
    cursor: default;
    opacity: var(--ds-opacity-50);
  }
  .date-picker__trigger span {
    flex: 1;
  }
  .date-picker__calendar {
    position: fixed;
    z-index: var(--aesir-overlay-z-popover, 50);
    padding: var(--ds-spacing-3);
    border: 1px solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background-secondary);
    box-shadow: 0 var(--ds-spacing-2) var(--ds-spacing-6) color-mix(in oklch, var(--ds-fixed-black) 14%, transparent);
    font-size: var(--ds-font-size-sm);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--ds-spacing-3);
  }
  header button,
  .date-picker__grid button {
    display: grid;
    cursor: pointer;
    border: 0;
    border-radius: var(--ds-radius-md);
    background: transparent;
    color: var(--ds-foreground);
    font-family: inherit;
    font-size: var(--ds-font-size-sm);
    place-items: center;
  }
  header button {
    width: var(--ds-spacing-8);
    height: var(--ds-spacing-8);
  }
  .date-picker__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--ds-spacing-1);
  }
  .weekday {
    padding-block: var(--ds-spacing-1);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    text-align: center;
  }
  .date-picker__grid button {
    aspect-ratio: 1;
    font-size: var(--ds-font-size-sm);
  }
  header button:hover:not(:disabled),
  .date-picker__grid button:hover:not(:disabled) {
    background: var(--ds-surface-hover);
  }
  .date-picker__grid button.outside {
    color: var(--ds-foreground-muted);
    opacity: 0.55;
  }
  .date-picker__grid button.selected {
    background: var(--ds-accent);
    color: var(--ds-accent-foreground);
  }
  .date-picker__grid button:disabled {
    cursor: default;
    opacity: 0.25;
  }
  @media (prefers-reduced-motion: reduce) {
    .date-picker__trigger {
      transition-duration: var(--ds-motion-duration-instant);
    }
    .date-picker__trigger:active:not(:disabled) {
      transform: none;
    }
  }
</style>
