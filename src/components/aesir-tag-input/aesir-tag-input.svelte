<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirBadge } from '../aesir-badge/index.js';
  import { AesirIcon } from '../aesir-icon/index.js';
  import { restoreOnFormReset } from '../form-reset.svelte.js';
  import { autoUpdateAnchoredPosition, portal, registerDismissableOverlay } from '../overlay/overlay.js';
  import { createPresence } from '../overlay/presence.svelte.js';

  type TagValue = string | number;
  type TagOption = { label: string; value: TagValue; disabled?: boolean };
  type TagInputProps = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'onchange'> & {
    class?: string;
    options?: (string | TagOption)[];
    name?: string;
    value?: TagValue[];
    query?: string;
    open?: boolean;
    label: string;
    description?: string;
    placeholder?: string;
    emptyText?: string;
    disabled?: boolean;
    max?: number;
    maxHeight?: number;
    allowCustom?: boolean;
    closeOnSelect?: boolean;
    onchange?: (value: TagValue[]) => void;
  };
  let {
    class: className = '',
    options = [],
    name,
    value = $bindable([]),
    query = $bindable(''),
    open = $bindable(false),
    label,
    description,
    placeholder = 'Add…',
    emptyText = 'No results',
    disabled = false,
    max,
    maxHeight = 256,
    allowCustom = false,
    closeOnSelect = true,
    onchange,
    ...restProps
  }: TagInputProps = $props();

  let root: HTMLDivElement;
  let control: HTMLDivElement;
  let input: HTMLInputElement;
  let list = $state<HTMLDivElement>();
  let position = $state('');
  let activeValue = $state<TagValue | null>(null);
  const initialValue = $state.snapshot(value);
  const initialQuery = $state.snapshot(query);
  restoreOnFormReset(
    () => input,
    () => {
      value = [...initialValue];
      query = initialQuery;
      open = false;
      activeValue = null;
    }
  );
  const presence = createPresence(() => open, 120);
  const uid = $props.id();
  const listId = `${uid}-list`;
  const comparable = (entry: TagValue | null | undefined) =>
    String(entry ?? '')
      .trim()
      .toLocaleLowerCase();
  const selected = $derived.by(() => {
    const seen: string[] = [];
    return value.filter((item) => {
      const key = comparable(item);
      if (seen.includes(key)) return false;
      seen.push(key);
      return true;
    });
  });
  const normalized = $derived.by(() => {
    const seen: TagValue[] = [];
    return options
      .map((option) => (typeof option === 'string' ? { label: option, value: option } : option))
      .filter((option) => {
        if (seen.includes(option.value)) return false;
        seen.push(option.value);
        return true;
      });
  });
  const full = $derived(max !== undefined && selected.length >= max);

  const isDuplicate = (option: TagOption) => {
    const candidateValue = comparable(option.value);
    const candidateLabel = comparable(option.label);

    return selected.some((selectedValue) => {
      const selected = normalized.find((entry) => entry.value === selectedValue);
      return comparable(selectedValue) === candidateValue || comparable(selected?.label ?? selectedValue) === candidateLabel;
    });
  };
  const filtered = $derived(normalized.filter((option) => !isDuplicate(option) && option.label.toLowerCase().includes(query.trim().toLowerCase())));
  const active = $derived(filtered.findIndex((option) => option.value === activeValue && !option.disabled));

  const close = () => {
    open = false;
    activeValue = null;
  };

  const showOptions = () => {
    if (disabled || full) return;
    open = true;
  };

  $effect(() => {
    if ((disabled || full) && open) close();
  });

  const nextEnabled = (start: number, direction: number) => {
    for (let index = start + direction; index >= 0 && index < filtered.length; index += direction) {
      if (!filtered[index].disabled) return index;
    }
    return start;
  };
  const setActive = (index: number) => {
    activeValue = filtered[index]?.value ?? null;
  };

  const commit = (next: TagValue[]) => {
    value = next;
    onchange?.(value);
  };

  const add = (option: TagOption) => {
    if (disabled || full || option.disabled) return;
    if (isDuplicate(option)) {
      query = '';
      activeValue = null;
      return;
    }
    commit([...selected, option.value]);
    query = '';
    activeValue = null;
    if (closeOnSelect) close();
    else open = true;
    input?.focus();
  };

  const remove = (item: TagValue | undefined) => {
    if (!disabled) commit(selected.filter((entry) => entry !== item));
    input?.focus();
  };

  const onkey = (event: KeyboardEvent) => {
    if (full) {
      if (event.key === 'Backspace') {
        if (query) query = '';
        else if (selected.length) remove(selected.at(-1));
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      showOptions();
      setActive(nextEnabled(active, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      showOptions();
      setActive(active < 0 ? nextEnabled(filtered.length, -1) : nextEnabled(active, -1));
    } else if (event.key === 'Enter') {
      if (!open && !query.trim()) return;
      event.preventDefault();
      const exact = normalized.find((option) => !option.disabled && comparable(option.label) === comparable(query));
      if (filtered[active]) add(filtered[active]);
      else if (exact) add(exact);
      else if (allowCustom && query.trim()) add({ label: query.trim(), value: query.trim() });
    } else if (event.key === 'Backspace' && !query && selected.length) {
      remove(selected.at(-1));
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      close();
    }
  };

  $effect(() => {
    if (!open || !control || !list) return;
    return autoUpdateAnchoredPosition(control, list, { matchWidth: true, maxHeight }, (next: { style: string }) => (position = next.style));
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

<div bind:this={root} class={`aesir-tag-input ${className}`.trim()} data-disabled={disabled || undefined} {...restProps}>
  {#if label}<label for={uid}>{label}</label>{/if}
  <div
    bind:this={control}
    class="aesir-tag-input__control"
    role="presentation"
    onclick={() => {
      input?.focus();
      showOptions();
    }}
  >
    {#each selected as item (item)}
      {@const option = normalized.find((entry) => entry.value === item)}
      <AesirBadge class="aesir-tag-input__badge" variant="secondary" size="sm">
        <span>{option?.label ?? item}</span>
        <button
          type="button"
          aria-label={`Remove ${option?.label ?? item}`}
          {disabled}
          onclick={(event) => {
            event.stopPropagation();
            remove(item);
          }}
        >
          <AesirIcon name="x" size={12} />
        </button>
      </AesirBadge>
    {/each}
    <input
      bind:this={input}
      id={uid}
      bind:value={query}
      {disabled}
      readonly={full}
      {placeholder}
      role="combobox"
      aria-expanded={open}
      aria-controls={listId}
      aria-autocomplete="list"
      aria-describedby={description ? `${uid}-description` : undefined}
      aria-activedescendant={open && filtered[active] ? `${uid}-option-${active}` : undefined}
      onfocus={showOptions}
      oninput={() => {
        if (disabled || full) return;
        open = true;
        setActive(nextEnabled(-1, 1));
      }}
      onkeydown={onkey}
    />
  </div>
  {#if name}
    {#each selected as item (item)}<input type="hidden" {name} value={String(item)} {disabled} />{/each}
  {/if}
  {#if description}<small id={`${uid}-description`}>{description}</small>{/if}

  {#if presence.present && !disabled && !full}
    <div
      use:portal
      bind:this={list}
      id={listId}
      class="aesir-tag-input__list aesir-overlay-motion"
      data-motion="popover"
      data-state={presence.state}
      role="listbox"
      aria-multiselectable="true"
      style={position}
    >
      {#each filtered as option, index (option.value)}
        <button
          id={`${uid}-option-${index}`}
          type="button"
          role="option"
          tabindex="-1"
          aria-selected={value.includes(option.value)}
          class:active={active === index}
          disabled={option.disabled}
          onpointerdown={(event) => event.preventDefault()}
          onclick={() => add(option)}
        >
          <span>{option.label}</span>
          <AesirIcon name="plus" size={15} />
        </button>
      {:else}
        <p>{emptyText}</p>
      {/each}
    </div>
  {/if}
</div>

<style>
  :global {
    .aesir-tag-input {
      position: relative;
      display: grid;
      width: 100%;
      gap: var(--ds-spacing-1-5);
      color: var(--ds-foreground);
    }

    .aesir-tag-input > label {
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
    }

    .aesir-tag-input__control {
      display: flex;
      min-width: 0;
      min-height: var(--ds-spacing-10);
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ds-spacing-1-5);
      padding: var(--ds-spacing-1-5);
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-lg);
      background: var(--ds-background);
      cursor: text;
      transition:
        border-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        box-shadow var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
    }

    .aesir-tag-input__control:focus-within {
      border-color: var(--ds-accent);
      box-shadow: 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-ring);
    }

    .aesir-tag-input__badge {
      box-sizing: border-box;
      min-width: 0;
      max-width: 100%;
      min-height: var(--ds-spacing-7);
      gap: var(--ds-spacing-1);
      padding-inline: var(--ds-spacing-2);
      border-radius: var(--ds-radius-md);
      font-size: var(--ds-font-size-xs);
      white-space: normal;
      cursor: default;
      user-select: none;
      -webkit-user-select: none;
    }

    .aesir-tag-input__badge > span {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .aesir-tag-input__badge button {
      display: grid;
      flex: none;
      width: var(--ds-spacing-4);
      height: var(--ds-spacing-4);
      place-items: center;
      padding: 0;
      border: 0;
      border-radius: var(--ds-radius-full);
      outline: 0;
      background: transparent;
      color: var(--ds-foreground-muted);
      cursor: pointer;
    }

    .aesir-tag-input__badge button:hover,
    .aesir-tag-input__badge button:focus-visible {
      background: var(--ds-surface-active);
      color: var(--ds-foreground);
    }

    .aesir-tag-input input {
      min-width: var(--ds-spacing-24);
      height: var(--ds-spacing-7);
      flex: 1;
      padding: 0 var(--ds-spacing-1);
      border: 0;
      outline: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: var(--ds-font-size-sm);
    }

    .aesir-tag-input input::placeholder {
      color: var(--ds-foreground-muted);
    }

    .aesir-tag-input > small {
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xs);
    }

    .aesir-tag-input__list {
      box-sizing: border-box;
      position: fixed;
      z-index: var(--aesir-overlay-z-popover, 50);
      display: grid;
      max-height: var(--ds-sizing-xs);
      overflow-y: auto;
      overscroll-behavior-y: contain;
      padding: var(--ds-spacing-1-5);
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-lg);
      background: var(--ds-background-secondary);
      box-shadow: 0 var(--ds-spacing-2) var(--ds-spacing-6) color-mix(in oklch, var(--ds-fixed-black) 14%, transparent);
      color: var(--ds-foreground);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-font-line-height-sm);
      --aesir-overlay-motion-duration: var(--ds-motion-duration-fast);
    }

    .aesir-tag-input__list > button {
      display: flex;
      width: 100%;
      min-height: var(--ds-spacing-9);
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-spacing-3);
      padding: var(--ds-spacing-2) var(--ds-spacing-3);
      border: 0;
      border-radius: var(--ds-radius-md);
      outline: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: inherit;
      line-height: inherit;
      text-align: left;
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      transition:
        background-color var(--ds-motion-duration-instant) var(--ds-motion-easing-subtle),
        color var(--ds-motion-duration-instant) var(--ds-motion-easing-subtle);
    }

    .aesir-tag-input__list > button:hover,
    .aesir-tag-input__list > button:focus-visible,
    .aesir-tag-input__list > button.active {
      background: var(--ds-surface-hover);
    }

    .aesir-tag-input__list > button:disabled {
      cursor: not-allowed;
      opacity: var(--ds-opacity-50);
    }

    .aesir-tag-input__list > p {
      margin: var(--ds-spacing-3);
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-sm);
    }

    .aesir-tag-input[data-disabled] {
      opacity: var(--ds-opacity-50);
    }
  }
</style>
