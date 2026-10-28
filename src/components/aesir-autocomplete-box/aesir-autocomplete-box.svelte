<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirIcon } from '../aesir-icon/index.js';
  import { autoUpdateAnchoredPosition, portal, registerDismissableOverlay } from '../overlay/overlay.js';
  import { restoreOnFormReset } from '../form-reset.svelte.js';
  type AutocompleteValue = string | number;
  type AutocompleteOption = { label: string; value: AutocompleteValue; disabled?: boolean; group?: string };
  type AutocompleteGroup = { label: string; options: (string | AutocompleteOption)[]; disabled?: boolean };
  type AutocompleteProps = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'onselect'> & {
    options?: (string | AutocompleteOption | AutocompleteGroup)[];
    name?: string;
    filter?: (option: AutocompleteOption, query: string) => boolean;
    maxResults?: number;
    loop?: boolean;
    allowCustomValue?: boolean;
    value?: AutocompleteValue | null;
    query?: string;
    open?: boolean;
    label: string;
    placeholder?: string;
    emptyText?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    errorPlacement?: 'message' | 'tooltip' | 'label';
    description?: string;
    maxHeight?: number;
    onselect?: (option: AutocompleteOption) => void;
    touched?: boolean;
    class?: string;
  };
  let {
    options = [],
    name,
    filter,
    maxResults,
    loop = false,
    allowCustomValue = true,
    value = $bindable(null),
    query = $bindable(''),
    open = $bindable(false),
    label,
    placeholder = 'Search…',
    emptyText = 'No results',
    disabled = false,
    required = false,
    error,
    errorPlacement = 'message',
    description,
    maxHeight = 256,
    onselect,
    touched = false,
    class: className,
    ...restProps
  }: AutocompleteProps = $props();
  let root: HTMLDivElement;
  let input: HTMLInputElement;
  let hidden: HTMLInputElement;
  const initialValue = value;
  restoreOnFormReset(
    () => hidden,
    () => {
      value = initialValue;
      filtering = false;
      open = false;
      activeValue = null;
      touched = false;
    }
  );
  let list = $state<HTMLDivElement>();
  let position = $state('');
  let activeValue = $state<AutocompleteValue | null>(null);
  let filtering = $state(false);
  let restoringFocus = false;
  const close = () => {
    open = false;
    filtering = false;
    activeValue = null;
    touched = true;
  };
  const showOptions = (highlightFirst = false) => {
    if (disabled || open) return;
    filtering = false;
    activeValue = highlightFirst ? (filtered[nextEnabled(-1, 1)]?.value ?? null) : null;
    open = true;
  };
  $effect(() => {
    if (disabled && open) close();
  });
  const uid = $props.id();
  const listId = `${uid}-list`;
  const normalized = $derived(
    options.flatMap((entry) => {
      if (typeof entry === 'string') return [{ label: entry, value: entry }];
      if ('options' in entry)
        return entry.options.map((option) =>
          typeof option === 'string' ? { label: option, value: option, group: entry.label, disabled: entry.disabled } : { ...option, group: entry.label, disabled: entry.disabled || option.disabled }
        );
      return [entry];
    })
  );
  const selectedOption = $derived(normalized.find((option) => option.value === value && !option.disabled));
  const effectiveValue = $derived(allowCustomValue ? value : (selectedOption?.value ?? null));
  const hasValue = $derived(effectiveValue != null && effectiveValue !== '');
  const validationError = $derived(error || (required && touched && !hasValue ? 'Required' : ''));
  const filtered = $derived.by(() => {
    const matching = filtering ? normalized.filter((option) => (filter ? filter(option, query) : option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))) : normalized;
    return maxResults == null ? matching : matching.slice(0, Math.max(0, maxResults));
  });
  const active = $derived(filtered.findIndex((option) => option.value === activeValue && !option.disabled));
  const filteredGroups = $derived.by(() => {
    const groups: { label?: string; options: { option: AutocompleteOption; index: number }[] }[] = [];
    filtered.forEach((option, index) => {
      const last = groups.at(-1);
      if (!last || last.label !== option.group) groups.push({ label: option.group, options: [] });
      groups.at(-1)?.options.push({ option, index });
    });
    return groups;
  });
  $effect(() => {
    if (filtering) return;
    query = selectedOption?.label ?? (effectiveValue == null ? '' : String(effectiveValue));
  });
  $effect(() => {
    input?.setCustomValidity(required && !disabled && !hasValue && query ? 'Select an option.' : '');
  });
  const nextEnabled = (start: number, direction: number) => {
    if (loop && filtered.length) {
      for (let attempt = 0; attempt < filtered.length; attempt += 1) {
        const index = (start + direction * (attempt + 1) + filtered.length * 2) % filtered.length;
        if (!filtered[index].disabled) return index;
      }
      return start;
    }
    for (let index = start + direction; index >= 0 && index < filtered.length; index += direction) {
      if (!filtered[index].disabled) return index;
    }
    return start;
  };
  const setActive = (index: number) => {
    activeValue = filtered[index]?.value ?? null;
  };
  $effect(() => {
    if (open && activeValue != null && active < 0) setActive(nextEnabled(-1, 1));
  });
  const choose = (option: AutocompleteOption) => {
    if (option.disabled) return;
    value = option.value;
    query = option.label;
    close();
    onselect?.(option);
    restoringFocus = true;
    input?.focus();
    restoringFocus = false;
  };
  const onkey = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (open) setActive(nextEnabled(active, 1));
      else showOptions(true);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      showOptions();
      setActive(active < 0 ? nextEnabled(filtered.length, -1) : nextEnabled(active, -1));
    } else if (event.key === 'Enter' && open && filtered[active]) {
      event.preventDefault();
      choose(filtered[active]);
    } else if (event.key === 'Escape' || event.key === 'Tab') close();
  };
  $effect(() => {
    if (!open || !input || !list) return;
    return autoUpdateAnchoredPosition(input.parentElement, list, { matchWidth: true, maxHeight }, (next: { style: string }) => (position = next.style));
  });
  $effect(() => {
    if (open && active >= 0) list?.querySelector(`[id="${uid}-option-${active}"]`)?.scrollIntoView({ block: 'nearest' });
  });
  $effect(() => {
    if (!open || !root) return;
    return registerDismissableOverlay(root.ownerDocument, {
      branches: () => [root, list],
      exclusive: true,
      onDismiss: (reason: string) => {
        close();
        if (reason === 'escape') input?.focus();
      }
    });
  });
</script>

{#snippet renderOption(option: AutocompleteOption, index: number)}
  <button
    id={`${uid}-option-${index}`}
    type="button"
    role="option"
    tabindex="-1"
    onpointerdown={(event) => event.preventDefault()}
    aria-selected={selectedOption?.value === option.value}
    class:active={index === active}
    disabled={option.disabled}
    onclick={() => choose(option)}
  >
    <span>{option.label}</span>
    {#if selectedOption?.value === option.value}<AesirIcon name="check" size={16} />{/if}
  </button>
{/snippet}

<div bind:this={root} class={`autocomplete-box ${className ?? ''}`.trim()} {...restProps}>
  {#if label}<label for={uid}>
      {label}{#if validationError && errorPlacement === 'label'}<span id={`${uid}-message`} class="label-error" aria-live="polite">{validationError}</span>{/if}
    </label>{/if}
  <div class="autocomplete-box__control" data-invalid={validationError ? true : undefined}>
    <AesirIcon name="search" size={16} />
    <input
      bind:this={input}
      id={uid}
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls={listId}
      aria-activedescendant={open && filtered[active] ? `${uid}-option-${active}` : undefined}
      {placeholder}
      {disabled}
      {required}
      aria-invalid={validationError ? true : undefined}
      aria-describedby={validationError || description ? `${uid}-message` : undefined}
      bind:value={query}
      onfocus={() => {
        if (!restoringFocus) showOptions(true);
      }}
      onclick={() => showOptions(true)}
      onblur={() => {
        touched = true;
      }}
      oninput={() => {
        value = allowCustomValue && query ? query : null;
        filtering = true;
        open = true;
        setActive(nextEnabled(-1, 1));
      }}
      onkeydown={onkey}
    />
    {#if query}<button
        type="button"
        {disabled}
        aria-label="Clear"
        onclick={() => {
          query = '';
          value = null;
          filtering = false;
          activeValue = null;
          showOptions(true);
          input?.focus();
        }}
      >
        <AesirIcon name="x" size={15} />
      </button>{/if}
  </div>
  <input bind:this={hidden} type="hidden" {name} value={effectiveValue == null ? '' : String(effectiveValue)} {disabled} />
  {#if validationError && (errorPlacement !== 'label' || !label)}
    <span id={`${uid}-message`} class="message-error" aria-live="polite">{validationError}</span>
  {:else if !validationError && description}<span id={`${uid}-message`} class="description">{description}</span>{/if}
  {#if open}
    <div use:portal bind:this={list} id={listId} class="autocomplete-box__list aesir-overlay-motion" data-motion="popover" data-state="open" role="listbox" style={position}>
      {#each filteredGroups as group, groupIndex (`${group.label ?? 'ungrouped'}-${groupIndex}`)}
        {#if group.label}
          <div role="group" aria-label={group.label} class="autocomplete-box__group">
            <span class="autocomplete-box__group-label" aria-hidden="true">{group.label}</span>
            {#each group.options as entry (entry.option.value)}{@render renderOption(entry.option, entry.index)}{/each}
          </div>
        {:else}
          {#each group.options as entry (entry.option.value)}{@render renderOption(entry.option, entry.index)}{/each}
        {/if}
      {:else}<p>{emptyText}</p>{/each}
    </div>
  {/if}
</div>

<style>
  .autocomplete-box__group {
    display: grid;
  }
  .autocomplete-box__group-label {
    padding: var(--ds-spacing-2);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .autocomplete-box {
    position: relative;
    display: grid;
    gap: var(--ds-spacing-2);
  }
  label {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    color: var(--ds-foreground);
    font-size: var(--ds-font-size-sm);
    font-weight: 600;
  }
  .autocomplete-box__control {
    display: flex;
    height: var(--ds-spacing-10);
    align-items: center;
    gap: var(--ds-spacing-2);
    padding: 0 var(--ds-spacing-3);
    border: 1px solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background);
  }
  .autocomplete-box__control:focus-within {
    border-color: var(--ds-accent);
    box-shadow: 0 0 0 2px var(--ds-accent-ring);
  }
  .autocomplete-box__control[data-invalid] {
    border-color: var(--ds-border-red);
    box-shadow: 0 0 0 var(--ds-spacing-px) var(--ds-border-red);
  }
  .label-error,
  .message-error {
    color: var(--ds-foreground-red);
    font-size: var(--ds-font-size-xs);
  }
  .label-error {
    font-size: var(--ds-font-size-xxs);
    text-transform: uppercase;
    height: 0px;
  }
  .description {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  input {
    min-width: 0;
    flex: 1;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--ds-foreground);
    font-family: inherit;
    font-size: var(--ds-font-size-sm);
  }
  .autocomplete-box__control button {
    display: grid;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--ds-foreground-muted);
  }
  .autocomplete-box__list {
    box-sizing: border-box;
    position: fixed;
    z-index: var(--aesir-overlay-z-popover, 50);
    max-height: 16rem;
    overflow: auto;
    overscroll-behavior-y: contain;
    padding: var(--ds-spacing-1-5);
    border: 1px solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background-secondary);
    box-shadow: 0 var(--ds-spacing-2) var(--ds-spacing-6) color-mix(in oklch, var(--ds-fixed-black) 14%, transparent);
    font-size: var(--ds-font-size-sm);
  }
  .autocomplete-box__list button {
    display: flex;
    width: 100%;
    height: var(--ds-spacing-9);
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--ds-spacing-2-5);
    border: 0;
    border-radius: var(--ds-radius-md);
    background: transparent;
    color: var(--ds-foreground);
    font-family: inherit;
    font-size: var(--ds-font-size-sm);
    text-align: left;
  }
  .autocomplete-box__list button:hover,
  .autocomplete-box__list button.active {
    background: var(--ds-surface);
  }
  .autocomplete-box__list button:disabled {
    opacity: 0.45;
  }
  p {
    margin: var(--ds-spacing-3);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }
</style>
