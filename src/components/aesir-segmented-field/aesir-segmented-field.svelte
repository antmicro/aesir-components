<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { restoreOnFormReset } from '../form-reset.svelte.js';

  type Kind = 'date' | 'time';
  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'onchange'> & {
    kind: Kind;
    label: string;
    name?: string;
    value?: string;
    disabled?: boolean;
    required?: boolean;
    readonly?: boolean;
    locale?: string;
    min?: string;
    max?: string;
    description?: string;
    class?: string;
    onchange?: (value: string) => void;
  };
  let {
    kind,
    label,
    name,
    value = $bindable(''),
    disabled = false,
    required = false,
    readonly = false,
    locale = 'en-US',
    min,
    max,
    description,
    class: className = '',
    onchange,
    ...restProps
  }: Props = $props();
  const id = $props.id();
  const dateParts = $derived(new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(2024, 11, 31)));
  const dateSeparator = $derived(dateParts.find((part) => part.type === 'literal')?.value ?? '/');
  const dateSegments = {
    month: { key: 'month', label: 'Month', length: 2, max: 12 },
    day: { key: 'day', label: 'Day', length: 2, max: 31 },
    year: { key: 'year', label: 'Year', length: 4, max: 9999 }
  };
  const segments = $derived(
    kind === 'date'
      ? dateParts.filter((part) => part.type in dateSegments).map((part) => dateSegments[part.type as keyof typeof dateSegments])
      : [
          { key: 'hour', label: 'Hour', length: 2, max: 23 },
          { key: 'minute', label: 'Minute', length: 2, max: 59 }
        ]
  );
  let fields = $state<Record<string, string>>({});
  let inputs = $state<(HTMLInputElement | undefined)[]>([]);
  let commitError = $state('');
  let hidden: HTMLInputElement;
  let committedInternally = '';
  let syncedKind: Kind | undefined;
  const initialValue = value;

  const parse = (source: string): Record<string, string> => {
    if (kind === 'time') {
      const match = /^(\d{2}):(\d{2})$/.exec(source);
      return { hour: match?.[1] ?? '', minute: match?.[2] ?? '' };
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(source);
    return { year: match?.[1] ?? '', month: match?.[2] ?? '', day: match?.[3] ?? '' };
  };
  const valueError = (source: string): string => {
    if (!source) return '';
    if (kind === 'time') {
      const match = /^(\d{2}):(\d{2})$/.exec(source);
      if (!match || +match[1] > 23 || +match[2] > 59) return 'Enter a valid time.';
    } else {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(source);
      if (!match) return 'Enter a valid date.';
      const year = +match[1];
      const month = +match[2];
      const day = +match[3];
      const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
      const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31][month - 1] ?? 0;
      if (year < 1 || day < 1 || day > daysInMonth) return 'Enter a valid date.';
    }
    if ((min && source < min) || (max && source > max)) return `Enter a value between ${min ?? 'the minimum'} and ${max ?? 'the maximum'}.`;
    return '';
  };
  const setCommitError = (message: string) => {
    commitError = message;
    inputs[0]?.setCustomValidity(message);
  };
  $effect(() => {
    const currentKind = kind;
    const currentValue = value;
    if (currentKind === syncedKind && currentValue === committedInternally) return;
    syncedKind = currentKind;
    commitError = '';
    fields = parse(currentValue);
  });
  $effect(() => {
    const externalError = valueError(value);
    inputs[0]?.setCustomValidity(commitError || externalError);
  });
  restoreOnFormReset(
    () => hidden,
    () => {
      value = initialValue;
      fields = parse(initialValue);
      commitError = '';
    }
  );
  const clearValue = () => {
    const hadValue = Boolean(value);
    committedInternally = '';
    value = '';
    if (hadValue) onchange?.('');
  };
  const commit = () => {
    const parts = segments.map((segment) => fields[segment.key] ?? '');
    if (parts.some((part, index) => part.length !== segments[index].length)) {
      setCommitError('');
      clearValue();
      return;
    }
    let next = '';
    if (kind === 'time') {
      if (+parts[0] > 23 || +parts[1] > 59) {
        setCommitError('Enter a valid time.');
        clearValue();
        return;
      }
      next = `${parts[0]}:${parts[1]}`;
    } else {
      const year = +(fields.year ?? 0);
      const month = +(fields.month ?? 0);
      const day = +(fields.day ?? 0);
      const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
      const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
      if (year < 1 || day < 1 || day > daysInMonth) {
        setCommitError('Enter a valid date.');
        clearValue();
        return;
      }
      next = `${fields.year}-${fields.month}-${fields.day}`;
    }
    if ((min && next < min) || (max && next > max)) {
      setCommitError(`Enter a value between ${min ?? 'the minimum'} and ${max ?? 'the maximum'}.`);
      clearValue();
      return;
    }
    setCommitError('');
    if (next !== value) {
      committedInternally = next;
      value = next;
      onchange?.(next);
    }
  };
  const update = (key: string, raw: string, index: number) => {
    const segment = segments[index];
    const digits = raw.replace(/\D/g, '').slice(0, segment.length);
    fields[key] = digits;
    commit();
    if (digits.length === segment.length && index < segments.length - 1) inputs[index + 1]?.focus();
  };
  const onkey = (event: KeyboardEvent, index: number) => {
    const segment = segments[index];
    if (event.key === 'ArrowLeft' && (event.target as HTMLInputElement).selectionStart === 0 && index > 0) {
      event.preventDefault();
      inputs[index - 1]?.focus();
    } else if (event.key === 'ArrowRight' && (event.target as HTMLInputElement).selectionStart === (event.target as HTMLInputElement).value.length && index < segments.length - 1) {
      event.preventDefault();
      inputs[index + 1]?.focus();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const current = +(fields[segment.key] ?? 0);
      const min = segment.key === 'year' || segment.key === 'day' || segment.key === 'month' ? 1 : 0;
      const next = Math.max(min, Math.min(segment.max, current + (event.key === 'ArrowUp' ? 1 : -1)));
      fields[segment.key] = String(next).padStart(segment.length, '0');
      commit();
    } else if (event.key === 'Backspace' && !(event.target as HTMLInputElement).value && index > 0) {
      inputs[index - 1]?.focus();
    }
  };
  const onpaste = (event: ClipboardEvent) => {
    const text = event.clipboardData?.getData('text').trim() ?? '';
    if (kind === 'date' ? !/^\d{4}-\d{2}-\d{2}$/.test(text) : !/^\d{2}:\d{2}$/.test(text)) return;
    event.preventDefault();
    fields = parse(text);
    commit();
    inputs.at(-1)?.focus();
  };
</script>

<div class={`aesir-segmented-field ${className}`.trim()} {...restProps}>
  <span id={`${id}-label`} class="aesir-segmented-field__label">{label}</span>
  <div class="aesir-segmented-field__control" role="group" aria-labelledby={`${id}-label`} data-disabled={disabled || undefined}>
    {#each segments as segment, index (segment.key)}
      {#if index > 0}<span aria-hidden="true" class="aesir-segmented-field__separator">{kind === 'date' ? dateSeparator : ':'}</span>{/if}
      <input
        bind:this={inputs[index]}
        aria-label={`${label} ${segment.label}`}
        inputmode="numeric"
        autocomplete="off"
        maxlength={segment.length}
        size={segment.length}
        placeholder={segment.key === 'year' ? 'yyyy' : segment.key === 'month' ? 'mm' : segment.key === 'day' ? 'dd' : segment.key === 'hour' ? 'hh' : 'mm'}
        value={fields[segment.key] ?? ''}
        {disabled}
        {readonly}
        {required}
        pattern={`[0-9]{${segment.length}}`}
        oninput={(event) => update(segment.key, event.currentTarget.value, index)}
        onkeydown={(event) => onkey(event, index)}
        {onpaste}
      />
    {/each}
  </div>
  <input bind:this={hidden} type="hidden" {name} {value} {disabled} />
  {#if description}<span class="aesir-segmented-field__description">{description}</span>{/if}
</div>

<style>
  :global(.aesir-segmented-field) {
    display: grid;
    gap: var(--ds-spacing-1-5);
    color: var(--ds-foreground);
  }
  .aesir-segmented-field__label {
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
  }
  .aesir-segmented-field__control {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    min-height: var(--ds-spacing-10);
    padding: 0 var(--ds-spacing-2);
    border: 1px solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    background: var(--ds-background);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
  }
  .aesir-segmented-field__control:focus-within {
    border-color: var(--ds-accent-ring);
    box-shadow: 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-surface);
  }
  .aesir-segmented-field__control[data-disabled] {
    opacity: var(--ds-opacity-50);
  }
  input:not([type='hidden']) {
    width: auto;
    min-width: 2ch;
    padding: var(--ds-spacing-1);
    border: 0;
    outline: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }
  input:not([type='hidden'])::placeholder {
    color: var(--ds-foreground-muted);
  }
  .aesir-segmented-field__separator,
  .aesir-segmented-field__description {
    color: var(--ds-foreground-muted);
  }
  .aesir-segmented-field__description {
    font-size: var(--ds-font-size-xs);
  }
</style>
