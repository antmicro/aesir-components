<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { onDestroy } from 'svelte';
  import { AesirIcon } from '../aesir-icon/index.js';
  import { autoUpdateAnchoredPosition, portal, registerDismissableOverlay } from '../overlay/overlay.js';
  import { restoreOnFormReset } from '../form-reset.svelte.js';

  type Option = { value: string; label: string; disabled?: boolean };
  type Group = { label: string; options: Option[]; disabled?: boolean };
  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'onchange'> & {
    label: string;
    name?: string;
    options: (Option | Group)[];
    value?: string;
    values?: string[];
    multiple?: boolean;
    open?: boolean;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
    loop?: boolean;
    description?: string;
    class?: string;
    selectedContent?: Snippet<[{ selected: Option | undefined; selections: Option[] }]>;
    onchange?: (value: string | string[]) => void;
  };
  let {
    label,
    name,
    options,
    value = $bindable(''),
    values = $bindable([]),
    multiple = false,
    open = $bindable(false),
    required = false,
    disabled = false,
    placeholder = 'Select an option',
    loop = true,
    description,
    class: className = '',
    selectedContent,
    onchange,
    ...restProps
  }: Props = $props();

  let trigger = $state<HTMLButtonElement>();
  let content = $state<HTMLDivElement>();
  let validationControl = $state<HTMLInputElement>();
  let position = $state('');
  let activeValue = $state<string>();
  let typeahead = '';
  let typeaheadTimer: ReturnType<typeof setTimeout> | undefined;
  const initialValue = $state.snapshot(value);
  const initialValues = $state.snapshot(values);
  const id = $props.id();
  const listId = `${id}-list`;
  const descriptionId = `${id}-description`;
  const items = $derived(options.flatMap((entry) => ('options' in entry ? entry.options.map((option) => ({ ...option, disabled: entry.disabled || option.disabled })) : [entry])));
  const selected = $derived(items.find((item) => item.value === value && !item.disabled));
  const selections = $derived(items.filter((item) => values.includes(item.value) && !item.disabled));
  const validValues = $derived([...new Set(values)].filter((selectedValue) => items.some((item) => item.value === selectedValue && !item.disabled)));
  const active = $derived.by(() => {
    const index = items.findIndex((item) => item.value === activeValue && !item.disabled);
    return index >= 0 ? index : items.findIndex((item) => !item.disabled);
  });
  const optionId = (index: number) => `${id}-option-${index}`;

  restoreOnFormReset(
    () => validationControl,
    () => {
      value = initialValue;
      values = [...initialValues];
      open = false;
    }
  );
  onDestroy(() => clearTimeout(typeaheadTimer));

  const firstEnabled = () => items.findIndex((item) => !item.disabled);
  const move = (direction: number) => {
    if (!items.length) return;
    let index = active;
    for (let attempt = 0; attempt < items.length; attempt += 1) {
      index += direction;
      if (loop) index = (index + items.length) % items.length;
      else if (index < 0 || index >= items.length) return;
      if (!items[index].disabled) {
        activeValue = items[index].value;
        return;
      }
    }
  };
  const show = () => {
    if (disabled || open) return;
    const selectedIndex = multiple ? -1 : items.findIndex((item) => item.value === value && !item.disabled);
    activeValue = items[selectedIndex >= 0 ? selectedIndex : firstEnabled()]?.value;
    open = true;
  };
  const choose = (item: Option) => {
    if (disabled || item.disabled) return;
    if (multiple) {
      const uniqueValues = [...new Set(values)];
      values = uniqueValues.includes(item.value) ? uniqueValues.filter((entry) => entry !== item.value) : [...uniqueValues, item.value];
      onchange?.(values);
    } else {
      value = item.value;
      onchange?.(value);
      open = false;
      trigger?.focus();
    }
  };
  const onKeydown = (event: KeyboardEvent) => {
    if (disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) show();
      else move(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Home' && open) {
      event.preventDefault();
      activeValue = items[firstEnabled()]?.value;
    } else if (event.key === 'End' && open) {
      event.preventDefault();
      activeValue = [...items].reverse().find((item) => !item.disabled)?.value;
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) show();
      else if (items[active]) choose(items[active]);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      open = false;
    } else if (event.key === 'Tab') open = false;
    else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      typeahead += event.key.toLocaleLowerCase();
      clearTimeout(typeaheadTimer);
      typeaheadTimer = setTimeout(() => (typeahead = ''), 500);
      const match = items.findIndex((item) => !item.disabled && item.label.toLocaleLowerCase().startsWith(typeahead));
      if (match >= 0) {
        if (!open) show();
        activeValue = items[match].value;
      }
    }
  };

  $effect(() => {
    if (disabled && open) open = false;
  });
  $effect(() => {
    if (!open || !trigger || !content) return;
    return autoUpdateAnchoredPosition(trigger, content, { width: Math.max(trigger.getBoundingClientRect().width, 180), maxHeight: 320 }, (next: { style: string }) => (position = next.style));
  });
  $effect(() => {
    if (!open || !trigger) return;
    return registerDismissableOverlay(trigger.ownerDocument, {
      branches: () => [trigger, content],
      exclusive: true,
      onDismiss: (reason: string) => {
        open = false;
        if (reason === 'escape') trigger?.focus();
      }
    });
  });
  $effect(() => {
    if (open && active >= 0) content?.querySelector(`#${optionId(active)}`)?.scrollIntoView({ block: 'nearest' });
  });
</script>

<div class={`aesir-select ${className}`.trim()} data-disabled={disabled || undefined} {...restProps}>
  <span class="aesir-select__label" id={`${id}-label`}>{label}</span>
  <button
    bind:this={trigger}
    type="button"
    role="combobox"
    aria-labelledby={`${id}-label`}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls={listId}
    aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
    aria-describedby={description ? descriptionId : undefined}
    aria-required={required || undefined}
    {disabled}
    onclick={() => (open ? (open = false) : show())}
    onkeydown={onKeydown}
  >
    <span class="aesir-select__value" data-placeholder={multiple ? !selections.length : !selected}>
      {#if selectedContent}{@render selectedContent({ selected, selections })}
      {:else if multiple}{selections.length ? selections.map((item) => item.label).join(', ') : placeholder}
      {:else}{selected?.label ?? placeholder}{/if}
    </span>
    <AesirIcon name="chevron-down" size={16} aria-hidden="true" />
  </button>
  <input
    bind:this={validationControl}
    class="aesir-select__native"
    type="text"
    tabindex="-1"
    aria-hidden="true"
    autocomplete="off"
    value={multiple ? validValues.join(',') : selected && !selected.disabled ? value : ''}
    {required}
    {disabled}
    oninvalid={(event) => {
      event.preventDefault();
      trigger?.focus();
      show();
    }}
  />
  {#if multiple}
    {#each validValues as selectedValue (selectedValue)}<input type="hidden" {name} value={selectedValue} {disabled} />{/each}
  {:else}<input type="hidden" {name} value={selected && !selected.disabled ? value : ''} {disabled} />{/if}
  {#if description}<span id={descriptionId} class="aesir-select__description">{description}</span>{/if}
</div>

{#if open}
  <div
    use:portal
    bind:this={content}
    id={listId}
    class="aesir-select__list aesir-overlay-motion"
    data-motion="popover"
    data-state="open"
    role="listbox"
    aria-label={label}
    aria-multiselectable={multiple || undefined}
    style={position}
  >
    {#each options as entry, groupIndex (`${'options' in entry ? 'group' : 'option'}-${groupIndex}`)}
      {#if 'options' in entry}
        <div role="group" aria-label={entry.label}>
          <div class="aesir-select__group-label" aria-hidden="true">{entry.label}</div>
          {#each entry.options as item (item.value)}
            {@const itemIndex = items.findIndex((candidate) => candidate.value === item.value)}
            {@const isSelected = !entry.disabled && !item.disabled && (multiple ? values.includes(item.value) : value === item.value)}
            <button
              id={optionId(itemIndex)}
              type="button"
              role="option"
              tabindex="-1"
              aria-selected={isSelected}
              data-active={active === itemIndex || undefined}
              disabled={disabled || entry.disabled || item.disabled}
              onpointerdown={(event) => event.preventDefault()}
              onpointermove={() => {
                if (!entry.disabled && !item.disabled) activeValue = item.value;
              }}
              onclick={() => choose(item)}
            >
              <span class="aesir-select__option-label">{item.label}</span>
              {#if multiple}
                <span class="aesir-select__option-indicator" aria-hidden="true">
                  {#if isSelected}<AesirIcon name="check" size={16} />{/if}
                </span>
              {/if}
            </button>
          {/each}
        </div>
      {:else}
        {@const itemIndex = items.findIndex((candidate) => candidate.value === entry.value)}
        {@const isSelected = !entry.disabled && (multiple ? values.includes(entry.value) : value === entry.value)}
        <button
          id={optionId(itemIndex)}
          type="button"
          role="option"
          tabindex="-1"
          aria-selected={isSelected}
          data-active={active === itemIndex || undefined}
          disabled={disabled || entry.disabled}
          onpointerdown={(event) => event.preventDefault()}
          onpointermove={() => {
            if (!entry.disabled) activeValue = entry.value;
          }}
          onclick={() => choose(entry)}
        >
          <span class="aesir-select__option-label">{entry.label}</span>
          {#if multiple}
            <span class="aesir-select__option-indicator" aria-hidden="true">
              {#if isSelected}<AesirIcon name="check" size={16} />{/if}
            </span>
          {/if}
        </button>
      {/if}
    {/each}
  </div>
{/if}

<style>
  :global(.aesir-select) {
    display: grid;
    gap: var(--ds-spacing-1-5);
    position: relative;
    color: var(--ds-foreground);
  }
  :global(.aesir-select__label) {
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
  }
  :global(.aesir-select > button) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-spacing-2);
    width: 100%;
    min-height: var(--ds-spacing-10);
    padding: 0 var(--ds-spacing-3);
    border: 1px solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    background: var(--ds-background);
    color: var(--ds-foreground);
    font: inherit;
    font-size: var(--ds-font-size-sm);
    text-align: left;
    cursor: pointer;
  }
  :global(.aesir-select > button:hover:not(:disabled)) {
    border-color: var(--ds-border-hover);
  }
  :global(.aesir-select > button:focus-visible) {
    outline: 2px solid var(--ds-accent-ring);
    outline-offset: 2px;
  }
  :global(.aesir-select__value) {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  :global(.aesir-select__value[data-placeholder='true']),
  :global(.aesir-select__description) {
    color: var(--ds-foreground-muted);
  }
  :global(.aesir-select__description) {
    font-size: var(--ds-font-size-xs);
  }
  :global(.aesir-select__native) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    opacity: 0;
    pointer-events: none;
  }
  :global(.aesir-select__list) {
    box-sizing: border-box;
    position: fixed;
    z-index: var(--aesir-overlay-z-popover, 50);
    overflow: auto;
    overscroll-behavior: contain;
    padding: var(--ds-spacing-1);
    border: 1px solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    background: var(--ds-background-secondary);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.12);
  }
  :global(.aesir-select__list [role='group']) {
    display: grid;
  }
  :global(.aesir-select__group-label) {
    padding: var(--ds-spacing-2);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  :global(.aesir-select__list [role='option']) {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
    width: 100%;
    min-height: var(--ds-spacing-8);
    padding: var(--ds-spacing-1) var(--ds-spacing-2);
    border: 0;
    border-radius: var(--ds-radius-sm);
    background: transparent;
    color: var(--ds-foreground);
    font: inherit;
    font-size: var(--ds-font-size-sm);
    overflow-wrap: anywhere;
    text-align: left;
    cursor: pointer;
  }
  :global(.aesir-select__option-label) {
    flex: 1;
    min-width: 0;
  }
  :global(.aesir-select__option-indicator) {
    display: grid;
    flex: 0 0 var(--ds-spacing-4);
    place-items: center;
    width: var(--ds-spacing-4);
    height: var(--ds-spacing-4);
    color: var(--ds-accent);
  }
  :global(.aesir-select__list [role='option'][data-active]) {
    background: var(--ds-surface-hover);
  }
  :global(.aesir-select__list [role='option'][aria-selected='true']) {
    color: var(--ds-accent);
  }
  :global(.aesir-select__list[aria-multiselectable='true'] [role='option'][aria-selected='true']) {
    color: var(--ds-foreground);
  }
  :global(.aesir-select__list [role='option']:disabled) {
    opacity: var(--ds-opacity-50);
    cursor: not-allowed;
  }
</style>
