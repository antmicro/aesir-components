<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { tick } from 'svelte';
  import AesirIcon from '../aesir-icon/aesir-icon.svelte';
  import { AesirKbd } from '../aesir-kbd/index.js';
  import { portal, registerModalOverlay, trapFocus } from '../overlay/overlay.js';
  import { createPresence } from '../overlay/presence.svelte.js';
  import { listenShared } from '../../utils/shared-event.js';
  import { searchCommandGroups } from './search.js';
  import type { CommandGroup, CommandItem, CommandMenuCloseOptions, CommandMenuContent, CommandMenuHeaderMeta, CommandMenuItemContent, CommandPage } from './types.js';

  type CommandMenuProps = Omit<HTMLAttributes<HTMLElement>, 'class' | 'content' | 'onselect' | 'title'> & {
    open?: boolean;
    groups?: CommandGroup[];
    placeholder?: string;
    emptyText?: string;
    label?: string;
    title?: string;
    shortcut?: string | false;
    showFooter?: boolean;
    onselect?: (item: CommandItem) => void;
    itemContent?: CommandMenuItemContent;
    headerMeta?: CommandMenuHeaderMeta;
    content?: CommandMenuContent;
    footer?: CommandMenuContent;
    class?: string;
  };

  type PagePathEntry = { id?: string; label: string; occurrence: number; source: CommandItem };

  let {
    open = $bindable(false),
    groups = [],
    placeholder = 'Type a command or search…',
    emptyText = 'No commands found.',
    label = 'Command menu',
    title,
    shortcut = 'k',
    showFooter = false,
    onselect,
    itemContent,
    headerMeta,
    content,
    footer,
    class: className = '',
    ...restProps
  }: CommandMenuProps = $props();

  const menuId = $props.id();
  const presence = createPresence(() => open, 180);
  let query = $state('');
  let activeKey = $state.raw<string | CommandItem | null>(null);
  let inputRef = $state<HTMLInputElement>();
  let listRef = $state<HTMLDivElement>();
  let dialogRef = $state<HTMLElement>();
  let previousFocus: HTMLElement | null = null;
  let instant = $state(false);
  let skipNextOpenMotion = false;
  let shortcutBuffer: string[] = [];
  let shortcutTimer: ReturnType<typeof setTimeout> | undefined;
  let pageStack = $state.raw<PagePathEntry[]>([]);
  const resolvedPages = $derived.by(() => {
    const pages: CommandPage[] = [];
    let availableGroups = groups;

    for (const entry of pageStack) {
      const availableItems = availableGroups.flatMap((group) => group.items ?? []);
      const matches = availableItems.filter((candidate) => (entry.id ? candidate.id === entry.id : !candidate.id && candidate.label === entry.label));
      const item = availableItems.find((candidate) => candidate === entry.source) ?? matches[entry.occurrence];
      if (!item?.groups?.length) break;
      pages.push({ label: item.label, groups: item.groups, placeholder: item.placeholder });
      availableGroups = item.groups;
    }

    return pages;
  });
  const currentPage = $derived(resolvedPages.at(-1));
  const currentGroups = $derived(currentPage?.groups ?? groups);

  const modifierTokens = new Set(['⌘', 'cmd', 'meta', 'ctrl', 'control', '⌥', 'alt', 'shift', '⇧']);

  const clearShortcutBuffer = () => {
    shortcutBuffer = [];
    clearTimeout(shortcutTimer);
  };

  const normalizeShortcutToken = (token: string) => {
    const normalized = String(token).trim().toLocaleLowerCase();
    if (['↵', 'return'].includes(normalized)) return 'enter';
    return normalized;
  };

  const shortcutTokens = (shortcut: string | string[]) => (Array.isArray(shortcut) ? shortcut : [shortcut]).map(normalizeShortcutToken);

  const matchesShortcutCombo = (event: KeyboardEvent, tokens: string[]) => {
    const normalized = tokens.map(normalizeShortcutToken);
    const key = normalized.find((token) => !modifierTokens.has(token));
    if (!key || normalizeShortcutToken(event.key) !== key) return false;

    return (
      (normalized.some((token) => ['⌘', 'cmd', 'meta'].includes(token)) ? event.metaKey : !event.metaKey) &&
      (normalized.some((token) => ['ctrl', 'control'].includes(token)) ? event.ctrlKey : !event.ctrlKey) &&
      (normalized.some((token) => ['⌥', 'alt'].includes(token)) ? event.altKey : !event.altKey) &&
      (normalized.some((token) => ['shift', '⇧'].includes(token)) ? event.shiftKey : !event.shiftKey)
    );
  };

  const handleItemShortcut = (event: KeyboardEvent) => {
    if (!open || event.defaultPrevented || event.repeat || event.isComposing) return;

    const target = event.target;
    const isEditable = target instanceof HTMLElement && (target.matches('input, textarea, select') || target.isContentEditable);
    if (isEditable && target !== inputRef) return;
    if (target === inputRef && query && !shortcutBuffer.length) return;

    const shortcutItems = currentGroups.flatMap((group) => (group.items ?? []).filter((item): item is CommandItem & { shortcut: string | string[] } => Boolean(item.shortcut) && !item.disabled));

    for (const item of shortcutItems) {
      const tokens = shortcutTokens(item.shortcut);
      if (tokens.some((token) => modifierTokens.has(token)) && matchesShortcutCombo(event, tokens)) {
        event.preventDefault();
        clearShortcutBuffer();
        activateItem(item, { skipMotion: true });
        return;
      }
    }

    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = normalizeShortcutToken(event.key);
    const sequences = shortcutItems
      .map((item) => ({
        item,
        tokens: shortcutTokens(item.shortcut)
      }))
      .filter(({ tokens }) => !tokens.some((token) => modifierTokens.has(token)));

    let candidate = [...shortcutBuffer, key];
    let exact = sequences.find(({ tokens }) => tokens.length === candidate.length && tokens.every((token, index) => token === candidate[index]));
    let hasPrefix = sequences.some(({ tokens }) => tokens.length > candidate.length && candidate.every((token, index) => token === tokens[index]));

    if (!exact && !hasPrefix) {
      candidate = [key];
      exact = sequences.find(({ tokens }) => tokens.length === 1 && tokens[0] === key);
      hasPrefix = sequences.some(({ tokens }) => tokens.length > 1 && tokens[0] === key);
    }

    if (exact) {
      if (target === inputRef && exact.tokens.length === 1) {
        clearShortcutBuffer();
        return;
      }
      event.preventDefault();
      clearShortcutBuffer();
      activateItem(exact.item, { skipMotion: true });
      return;
    }

    if (hasPrefix) {
      shortcutBuffer = candidate;
      clearTimeout(shortcutTimer);
      shortcutTimer = setTimeout(clearShortcutBuffer, 800);
    } else {
      clearShortcutBuffer();
    }
  };

  const filteredGroups = $derived.by(() => {
    let itemIndex = 0;
    const searchableGroups = currentGroups.map((group) => ({ ...group, _source: group }));

    return (searchCommandGroups(searchableGroups, query) as typeof searchableGroups)
      .map((group) => ({
        ...group,
        items: (group.items ?? []).map((item) => ({
          ...item,
          _source: item,
          _key: item.id ? `${group.label ?? ''}\u0000${item.id}` : item,
          _index: item.disabled ? -1 : itemIndex++
        }))
      }))
      .filter((group) => group.items.length);
  });

  const selectableItems = $derived(filteredGroups.flatMap((group) => group.items.filter((item) => !item.disabled)));
  const activeIndex = $derived(
    Math.max(
      0,
      selectableItems.findIndex((item) => item._key === activeKey)
    )
  );

  const close = ({ restoreFocus = true, skipMotion = false }: CommandMenuCloseOptions = {}) => {
    clearShortcutBuffer();
    instant = skipMotion;
    open = false;
    if (restoreFocus) queueMicrotask(() => previousFocus?.focus?.());
  };

  const runItem = (item: CommandItem | undefined) => {
    if (!item || item.disabled) return;
    item.action?.(item);
    onselect?.(item);
  };

  const enterPage = (item: CommandItem & { groups: CommandGroup[] }) => {
    const source = (item as CommandItem & { _source?: CommandItem })._source ?? item;
    const matches = currentGroups.flatMap((group) => group.items ?? []).filter((candidate) => (source.id ? candidate.id === source.id : !candidate.id && candidate.label === source.label));
    pageStack = [...pageStack.slice(0, resolvedPages.length), { id: source.id, label: source.label, occurrence: Math.max(0, matches.indexOf(source)), source }];
    query = '';
    activeKey = null;
    tick().then(() => inputRef?.focus());
  };

  const leavePage = () => {
    if (!resolvedPages.length) return false;
    pageStack = pageStack.slice(0, resolvedPages.length - 1);
    query = '';
    activeKey = null;
    tick().then(() => inputRef?.focus());
    return true;
  };

  const selectItem = (item: CommandItem | undefined, { skipMotion = false }: Pick<CommandMenuCloseOptions, 'skipMotion'> = {}) => {
    if (!item || item.disabled) return;
    if (item.groups?.length) {
      enterPage(item as CommandItem & { groups: CommandGroup[] });
      return;
    }
    runItem(item);
    close({ skipMotion });
  };

  const openItemInNewTab = (item: CommandItem | undefined) => {
    if (!item?.href || item.disabled) return;
    runItem(item);
    window.open(item.href, '_blank', 'noopener,noreferrer');
  };

  const activateItem = (item: CommandItem | undefined, { skipMotion = false }: Pick<CommandMenuCloseOptions, 'skipMotion'> = {}) => {
    if (!item || item.disabled) return;
    if (item.href && (item._index ?? -1) >= 0) {
      const link = listRef?.querySelector(`[data-command-index="${item._index}"]`);
      if (link instanceof HTMLAnchorElement) {
        link.click();
        return;
      }
    }
    selectItem(item, { skipMotion });
  };

  const setActive = (nextIndex: number) => {
    const length = selectableItems.length;
    if (!length) return;
    const item = selectableItems[(nextIndex + length) % length];
    activeKey = item._key;
    requestAnimationFrame(() => {
      listRef?.querySelector(`[data-command-index="${item._index}"]`)?.scrollIntoView({ block: 'nearest' });
    });
  };

  const onInputKeydown = (event: KeyboardEvent) => {
    if ((event.key === 'Backspace' || event.key === 'ArrowLeft') && !query && currentPage) {
      event.preventDefault();
      leavePage();
    } else if (event.key === 'Escape' && currentPage) {
      event.preventDefault();
      event.stopPropagation();
      leavePage();
    } else if (content) {
      return;
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(activeIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(activeIndex - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActive(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActive(selectableItems.length - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = selectableItems[activeIndex];
      if ((event.metaKey || event.ctrlKey) && item?.href) {
        openItemInNewTab(item);
        return;
      }
      activateItem(item, { skipMotion: true });
    }
  };

  $effect(() => {
    if (!open) return;
    instant = skipNextOpenMotion;
    skipNextOpenMotion = false;
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    query = '';
    activeKey = null;
    pageStack = [];
    const releaseOverlay = registerModalOverlay(document, { branches: () => [dialogRef], onEscape: () => close({ skipMotion: true }), restoreFocus: false });
    tick().then(() => inputRef?.focus());

    return () => {
      releaseOverlay();
    };
  });

  $effect(() => {
    const onDocumentKeydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (shortcut && event.key.toLocaleLowerCase() === shortcut.toLocaleLowerCase() && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (open) close({ skipMotion: true });
        else {
          skipNextOpenMotion = true;
          open = true;
        }
        return;
      }

      handleItemShortcut(event);
    };

    const release = listenShared(document, 'keydown', onDocumentKeydown);
    return () => {
      clearShortcutBuffer();
      release();
    };
  });
</script>

{#snippet defaultItemContent(item: CommandItem)}
  {#if item.icon}
    <AesirIcon class="aesir-command-menu__item-icon" name={item.icon} />
  {/if}
  <span class="aesir-command-menu__item-copy">
    <span class="aesir-command-menu__item-label">{item.label}</span>
    {#if item.description}
      <span class="aesir-command-menu__item-description">{item.description}</span>
    {/if}
  </span>
  {#if item.shortcut}
    <span class="aesir-command-menu__shortcut" aria-label={`Shortcut ${item.shortcut}`}>
      {#each Array.isArray(item.shortcut) ? item.shortcut : [item.shortcut] as key, keyIndex (`${key}-${keyIndex}`)}
        <AesirKbd small>{key}</AesirKbd>
      {/each}
    </span>
  {:else if item.groups?.length}
    <AesirIcon class="aesir-command-menu__item-chevron" name="chevron-right" />
  {/if}
{/snippet}

{#if presence.present}
  <div
    use:portal
    class="aesir-command-menu__backdrop aesir-overlay-motion"
    data-state={presence.state}
    data-instant={instant || undefined}
    role="presentation"
    onpointerdown={(event) => {
      if (event.target === event.currentTarget) close();
    }}
  >
    <section
      bind:this={dialogRef}
      use:trapFocus
      class={`aesir-command-menu aesir-overlay-motion ${className}`.trim()}
      data-state={presence.state}
      data-instant={instant || undefined}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      {...restProps}
    >
      {#if title || headerMeta}
        <header class="aesir-command-menu__header">
          {#if title}<h2>{title}</h2>{/if}
          {#if headerMeta}{@render headerMeta({ query, currentPage })}{/if}
        </header>
      {/if}

      <div class="aesir-command-menu__search">
        {#if currentPage}
          <button type="button" class="aesir-command-menu__back" aria-label="Back to previous commands" onclick={leavePage}><AesirIcon name="arrow-left" /></button>
          <span class="aesir-command-menu__page-title">{currentPage.label}</span>
        {/if}
        <input
          bind:this={inputRef}
          value={query}
          placeholder={currentPage?.placeholder ?? placeholder}
          name="command-query"
          aria-label="Search commands"
          autocomplete="off"
          spellcheck="false"
          role={content ? 'searchbox' : 'combobox'}
          aria-autocomplete={content ? undefined : 'list'}
          aria-expanded={content ? undefined : 'true'}
          aria-controls={content ? undefined : `${menuId}-list`}
          aria-activedescendant={!content && selectableItems[activeIndex] ? `${menuId}-item-${activeIndex}` : undefined}
          oninput={(event) => {
            query = event.currentTarget.value;
            activeKey = null;
          }}
          onkeydown={onInputKeydown}
        />
      </div>

      {#if content}
        <div class="aesir-command-menu__content">
          {@render content({ query, currentPage, close })}
        </div>
      {:else}
        <div bind:this={listRef} id={`${menuId}-list`} class="aesir-command-menu__list" role="listbox" aria-label="Commands">
          {#if filteredGroups.length}
            {#each filteredGroups as group, groupIndex (group._source)}
              <section class="aesir-command-menu__group" role="group" aria-labelledby={group.label ? `${menuId}-group-${groupIndex}` : undefined} aria-label={group.label ? undefined : 'Commands'}>
                {#if group.label}
                  <p id={`${menuId}-group-${groupIndex}`} class="aesir-command-menu__group-label">{group.label}</p>
                {/if}

                {#each group.items as item (item._key)}
                  {#if item.href}
                    <!-- eslint-disable svelte/no-navigation-without-resolve -->
                    <a
                      id={item._index >= 0 ? `${menuId}-item-${item._index}` : undefined}
                      href={item.disabled ? undefined : item.href}
                      role="option"
                      aria-selected={item._index === activeIndex}
                      aria-disabled={item.disabled || undefined}
                      tabindex="-1"
                      data-active={item._index === activeIndex || undefined}
                      data-command-index={item._index >= 0 ? item._index : undefined}
                      onpointermove={() => item._index >= 0 && (activeKey = item._key)}
                      onclick={(event) => {
                        if (item.disabled) {
                          event.preventDefault();
                          return;
                        }
                        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                          runItem(item);
                          return;
                        }
                        selectItem(item, { skipMotion: event.detail === 0 });
                      }}
                      onauxclick={(event) => event.button === 1 && runItem(item)}
                    >
                      {#if itemContent}{@render itemContent(item)}{:else}{@render defaultItemContent(item)}{/if}
                    </a>
                    <!-- eslint-enable svelte/no-navigation-without-resolve -->
                  {:else}
                    <button
                      id={item._index >= 0 ? `${menuId}-item-${item._index}` : undefined}
                      type="button"
                      role="option"
                      aria-selected={item._index === activeIndex}
                      disabled={item.disabled}
                      data-active={item._index === activeIndex || undefined}
                      data-command-index={item._index >= 0 ? item._index : undefined}
                      onpointermove={() => item._index >= 0 && (activeKey = item._key)}
                      onclick={(event) => selectItem(item, { skipMotion: event.detail === 0 })}
                    >
                      {#if itemContent}{@render itemContent(item)}{:else}{@render defaultItemContent(item)}{/if}
                    </button>
                  {/if}
                {/each}
              </section>
            {/each}
          {:else}
            <div class="aesir-command-menu__empty">
              <AesirIcon name="search" />
              <p>{emptyText}</p>
              <span>Try another word or phrase.</span>
            </div>
          {/if}
        </div>
      {/if}

      {#if footer}
        <footer class="aesir-command-menu__footer aesir-command-menu__footer--custom">
          {@render footer({ query, currentPage, close })}
        </footer>
      {:else if showFooter}
        <footer class="aesir-command-menu__footer">
          <span>
            <AesirKbd small>↑</AesirKbd>
            <AesirKbd small>↓</AesirKbd>
            Navigate
          </span>
          <span>
            <AesirKbd small>Enter</AesirKbd>
            Select
          </span>
          <span>
            <AesirKbd small>Esc</AesirKbd>
            {currentPage ? 'Back' : 'Close'}
          </span>
        </footer>
      {/if}
    </section>
  </div>
{/if}

<style>
  :global {
    html[data-overlay-open='true'] {
      overflow: hidden;
    }

    .aesir-overlay-motion {
      opacity: 1;
      transform: none;
      transition:
        opacity var(--aesir-overlay-motion-duration, var(--ds-motion-duration-fast)) var(--ds-motion-easing-out),
        transform var(--aesir-overlay-motion-duration, var(--ds-motion-duration-fast)) var(--ds-motion-easing-out);
    }

    .aesir-overlay-motion[data-motion='zoom'] {
      --aesir-overlay-start-transform: scale(0.97);
    }

    .aesir-overlay-motion[data-motion='popover'] {
      --aesir-overlay-start-transform: scale(0.97);

      transform-origin: var(--aesir-overlay-transform-origin, center);
    }

    .aesir-overlay-motion[data-motion='tooltip'] {
      --aesir-overlay-start-transform: scale(0.98);

      transform-origin: var(--aesir-overlay-transform-origin, center);
    }

    .aesir-overlay-motion[data-state='closed'] {
      opacity: 0;
      transform: var(--aesir-overlay-start-transform, none);
      transition-duration: var(--aesir-overlay-exit-duration, var(--ds-motion-duration-fast));
      pointer-events: none;
    }

    .aesir-overlay-motion[data-instant] {
      transition: none;
    }

    @starting-style {
      .aesir-overlay-motion {
        opacity: 0;
        transform: var(--aesir-overlay-start-transform, none);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-overlay-motion {
        --aesir-overlay-start-transform: none;

        transition-duration: var(--ds-motion-duration-instant);
        transform: none;
      }
    }

    .aesir-command-menu__backdrop {
      position: fixed;
      inset: 0;
      z-index: var(--aesir-overlay-z-dialog, 70);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: min(12vh, var(--ds-spacing-20)) var(--ds-spacing-4) var(--ds-spacing-4);
      background: color-mix(in oklch, var(--ds-background) 78%, transparent);
      --aesir-overlay-motion-duration: var(--ds-motion-duration-moderate);
      --aesir-overlay-exit-duration: var(--ds-motion-duration-fast);
    }

    .aesir-command-menu__backdrop[data-state='closed'] {
      opacity: 0;
    }

    .aesir-command-menu {
      display: flex;
      flex-direction: column;
      width: min(100%, var(--ds-sizing-2xl));
      max-height: min(72vh, var(--ds-sizing-xl));
      overflow: hidden;
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-xl);
      background: var(--ds-background-secondary);
      color: var(--ds-foreground);
      transform-origin: center top;
      --aesir-overlay-motion-duration: var(--ds-motion-duration-moderate);
      --aesir-overlay-exit-duration: var(--ds-motion-duration-fast);
    }

    .aesir-command-menu[data-state='closed'] {
      opacity: 0;
      transform: translateY(calc(var(--ds-spacing-1-5) * -1)) scale(0.99);
    }

    .aesir-command-menu__search {
      display: flex;
      flex: none;
      align-items: center;
      min-height: var(--ds-spacing-14);
      padding: 0 var(--ds-spacing-5);
      gap: var(--ds-spacing-2);
    }

    .aesir-command-menu__header {
      display: flex;
      flex: none;
      min-height: var(--ds-spacing-14);
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-spacing-4);
      padding: 0 var(--ds-spacing-5);
      border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    }

    .aesir-command-menu__header h2 {
      margin: 0;
      font-size: var(--ds-font-size-base);
      font-weight: var(--ds-font-weight-medium);
      line-height: var(--ds-font-line-height-base);
    }

    .aesir-command-menu__back {
      display: grid;
      width: var(--ds-spacing-8);
      height: var(--ds-spacing-8);
      flex: none;
      padding: 0;
      place-items: center;
      border: 0;
      border-radius: var(--ds-radius-md);
      background: transparent;
      color: var(--ds-foreground-muted);
      cursor: pointer;
    }

    .aesir-command-menu__back:hover,
    .aesir-command-menu__back:focus-visible {
      background: var(--ds-surface);
      color: var(--ds-foreground);
      outline: none;
    }

    .aesir-command-menu__page-title {
      flex: none;
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
    }

    .aesir-command-menu__search input {
      min-width: 0;
      width: 100%;
      height: var(--ds-spacing-14);
      padding: 0;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--ds-foreground);
      font: inherit;
      font-size: var(--ds-font-size-sm);
    }

    .aesir-command-menu__search input::placeholder {
      color: var(--ds-foreground-muted);
    }

    .aesir-command-menu__list {
      min-height: 0;
      max-height: min(58vh, var(--ds-spacing-96));
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 0 var(--ds-spacing-3) var(--ds-spacing-3);
      scrollbar-width: thin;
    }

    .aesir-command-menu__content {
      min-height: 0;
      max-height: min(58vh, var(--ds-spacing-96));
      overflow: auto;
      overscroll-behavior: contain;
      scrollbar-width: thin;
    }

    .aesir-command-menu__group + .aesir-command-menu__group {
      margin-top: var(--ds-spacing-2);
    }

    .aesir-command-menu__group-label {
      margin: 0;
      padding: var(--ds-spacing-2) var(--ds-spacing-2) var(--ds-spacing-1);
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xxs);
      font-weight: var(--ds-font-weight-medium);
    }

    .aesir-command-menu__group :where(button, a) {
      display: grid;
      width: 100%;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--ds-spacing-3);
      min-height: var(--ds-spacing-10);
      padding: var(--ds-spacing-2) var(--ds-spacing-3);
      border: 0;
      border-radius: var(--ds-radius-lg);
      outline: 0;
      background: transparent;
      color: var(--ds-foreground);
      font: inherit;
      font-size: var(--ds-font-size-sm);
      text-align: left;
      text-decoration: none;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      transition: background-color var(--ds-motion-duration-instant) var(--ds-motion-easing-subtle);
    }

    .aesir-command-menu__group :where(button, a):is(:hover, [data-active]) {
      background: var(--ds-surface);
    }

    .aesir-command-menu__group :where(button, a):focus-visible {
      box-shadow: inset 0 0 0 var(--ds-spacing-px) var(--ds-accent-border);
    }

    .aesir-command-menu__group :where(button:disabled, a[aria-disabled='true']) {
      cursor: not-allowed;
      opacity: var(--ds-opacity-50);
    }

    .aesir-command-menu__item-icon {
      width: var(--ds-spacing-4);
      height: var(--ds-spacing-4);
      color: var(--ds-foreground-muted);
      stroke-width: 1.75;
    }

    .aesir-command-menu__item-chevron {
      width: var(--ds-spacing-4);
      height: var(--ds-spacing-4);
      color: var(--ds-foreground-muted);
    }

    .aesir-command-menu__item-copy {
      display: grid;
      min-width: 0;
      gap: var(--ds-spacing-0-5);
    }

    .aesir-command-menu__item-label {
      overflow: hidden;
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-normal);
      line-height: 1.3;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .aesir-command-menu__item-description {
      overflow: hidden;
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xs);
      line-height: 1.25;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .aesir-command-menu__shortcut {
      display: inline-flex;
      gap: var(--ds-spacing-1);
    }

    .aesir-command-menu__shortcut :global(.aesir-kbd) {
      flex: none;
      width: var(--ds-spacing-6);
      min-width: var(--ds-spacing-6);
      padding-inline: 0;
    }

    .aesir-command-menu__footer {
      display: flex;
      flex: none;
      align-items: center;
      justify-content: flex-end;
      gap: var(--ds-spacing-4);
      min-height: var(--ds-spacing-10);
      padding: 0 var(--ds-spacing-4);
      border-top: var(--ds-spacing-px) solid var(--ds-border);
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xxs);
    }

    .aesir-command-menu__footer--custom {
      justify-content: space-between;
    }

    .aesir-command-menu__footer span {
      display: inline-flex;
      align-items: center;
      gap: var(--ds-spacing-1);
      white-space: nowrap;
    }

    .aesir-command-menu__empty {
      display: grid;
      min-height: var(--ds-spacing-32);
      place-items: center;
      align-content: center;
      gap: var(--ds-spacing-2);
      color: var(--ds-foreground-muted);
      text-align: center;
    }

    .aesir-command-menu__empty svg {
      width: var(--ds-spacing-5);
      height: var(--ds-spacing-5);
    }

    .aesir-command-menu__empty p {
      margin: 0;
      color: var(--ds-foreground);
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
    }

    .aesir-command-menu__empty span {
      font-size: var(--ds-font-size-xs);
    }

    .aesir-command-menu__backdrop[data-instant],
    .aesir-command-menu[data-instant] {
      transition: none;
    }

    @media (max-width: 640px) {
      .aesir-command-menu__backdrop {
        padding-top: var(--ds-spacing-6);
      }

      .aesir-command-menu {
        max-height: calc(100dvh - var(--ds-spacing-12));
      }

      .aesir-command-menu__footer {
        justify-content: center;
      }

      .aesir-command-menu__footer span:first-child {
        display: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-command-menu {
        transform: none;
      }
    }
  }
</style>
