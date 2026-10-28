<script>
  import { tick } from 'svelte';
  import { AesirButton, AesirIcon, AesirInput, AesirPopover, AesirScrollArea, AesirTooltip } from '@aesir/svelte';
  import Smile from '@lucide/svelte/icons/smile';
  import SmilePlus from '@lucide/svelte/icons/smile-plus';
  import Search from '@lucide/svelte/icons/search';
  import Leaf from '@lucide/svelte/icons/leaf';
  import Hamburger from '@lucide/svelte/icons/hamburger';
  import Plane from '@lucide/svelte/icons/plane';
  import Trophy from '@lucide/svelte/icons/trophy';
  import Lightbulb from '@lucide/svelte/icons/lightbulb';
  import Heart from '@lucide/svelte/icons/heart';
  import Flag from '@lucide/svelte/icons/flag';
  import { emojiCatalog, emojiCategories, emojiNavigationTarget, frequentEmoji, getEmojiGroups } from './team-chat-emoji-data.js';

  let { label = 'Insert emoji', placement = 'top', align = 'start', reaction = false, onselect } = $props();
  let open = $state(false);
  let query = $state('');
  let category = $state('all');
  let recent = $state([...frequentEmoji]);
  let preview = $state(emojiCatalog.find((item) => item.emoji === '👍'));
  let focused = $state('');
  let viewport = $state();
  let panel;
  let triggerButton;
  const icons = [Smile, Leaf, Hamburger, Plane, Trophy, Lightbulb, Heart, Flag];
  const categories = [{ id: 'all', label: 'All emoji', icon: Search }, ...emojiCategories.map((item, index) => ({ ...item, icon: icons[index] }))];
  const groups = $derived(getEmojiGroups(query, category, recent));
  const cells = $derived(groups.flatMap((group) => group.items.map((item) => ({ ...item, key: `${group.id}-${item.id}` }))));
  const tabStop = $derived(cells.some((item) => item.key === focused) ? focused : cells[0]?.key);
  const helpId = $props.id();

  function mountPanel(node) {
    panel = node;
    node.closest('[role="dialog"]')?.setAttribute('aria-label', 'Emoji picker');
    return () => {
      panel = undefined;
    };
  }
  async function setOpen(next) {
    open = next;
    if (next) {
      await tick();
      panel?.querySelector('input')?.focus();
    }
  }
  function navigate(event) {
    const button = event.target.closest('[data-emoji-key]');
    if (!button) return;
    const grids = [...panel.querySelectorAll('.emoji-grid')];
    const buttons = grids.map((grid) => [...grid.querySelectorAll('[data-emoji-key]')]);
    const group = grids.indexOf(button.parentElement);
    const next = emojiNavigationTarget(
      group,
      buttons[group].indexOf(button),
      event.key,
      buttons.map((items) => items.length),
      8,
      event.ctrlKey || event.metaKey
    );
    if (!next) return;
    event.preventDefault();
    buttons[next.group][next.index]?.focus();
  }
  function choose(item, close) {
    recent = [item.emoji, ...recent.filter((emoji) => emoji !== item.emoji)].slice(0, 24);
    close();
    triggerButton?.focus();
    onselect?.(item.emoji);
  }
  function changeCategory(id) {
    category = id;
    query = '';
    focused = '';
    if (viewport) viewport.scrollTop = 0;
  }
</script>

{#snippet pickerButton(props, tooltipProps)}
  <AesirButton
    {...props}
    {...tooltipProps}
    class={reaction ? 'emoji-reaction-trigger' : ''}
    variant={reaction ? 'outline' : 'ghost'}
    size="icon-sm"
    aria-label={label}
    onclick={(event) => {
      tooltipProps.onclick?.();
      triggerButton = event.currentTarget;
      if (!open) {
        query = '';
        category = 'all';
        focused = '';
      }
      props.onclick(event);
    }}
  >
    <AesirIcon icon={reaction ? SmilePlus : Smile} size={16} />
  </AesirButton>
{/snippet}

<AesirPopover
  bind:open={() => open, setOpen}
  {placement}
  {align}
  contentClass="chat-emoji-popover"
  contentStyle="width: min(22.5rem, calc(100vw - var(--ds-spacing-8))); padding: 0; overflow: hidden;"
>
  {#snippet trigger(props)}
    {#if reaction}
      <AesirTooltip content="Add reaction…" disabled={open} contentStyle="width: max-content; max-width: calc(100vw - var(--ds-spacing-4)); white-space: nowrap;">
        {#snippet trigger(tooltipProps)}{@render pickerButton(props, tooltipProps)}{/snippet}
      </AesirTooltip>
    {:else}
      {@render pickerButton(props, {})}
    {/if}
  {/snippet}
  {#snippet content({ close })}
    <section class="emoji-picker" aria-label="Emoji picker" {@attach mountPanel}>
      <div class="emoji-categories" role="group" aria-label="Emoji categories">
        {#each categories as item (item.id)}
          <AesirButton
            class="emoji-category"
            variant="ghost"
            size="icon-sm"
            aria-label={item.label}
            title={item.label}
            aria-pressed={category === item.id && !query.trim()}
            onclick={() => changeCategory(item.id)}
          >
            <AesirIcon icon={item.icon} size={18} />
          </AesirButton>
        {/each}
      </div>
      <div class="emoji-search">
        <AesirInput
          size="sm"
          type="search"
          bind:value={query}
          placeholder="Search all emoji"
          aria-label="Search all emoji"
          aria-describedby={helpId}
          autocomplete="off"
          oninput={() => {
            focused = '';
            if (viewport) viewport.scrollTop = 0;
          }}
          onkeydown={(event) => {
            if (event.isComposing || event.keyCode === 229) return;
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              panel?.querySelector('[data-emoji-key]')?.focus();
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              if (cells[0]) choose(cells[0], close);
            }
          }}
        >
          {#snippet leading()}<AesirIcon icon={Search} size={15} />{/snippet}
        </AesirInput>
      </div>
      <span class="sr-only" id={helpId}>Use arrow keys to browse emoji and Enter or Space to choose. Escape closes the picker.</span>
      <AesirScrollArea class="emoji-scroll" label="Emoji" bind:viewportRef={viewport}>
        <div class="emoji-sections">
          {#each groups as group (group.id)}
            {#if group.items.length}
              <section class="emoji-section" aria-label={group.label}>
                <h3>{group.label}</h3>
                <div class="emoji-grid" role="group" aria-label={group.label}>
                  {#each group.items as item (item.id)}
                    <AesirButton
                      class="emoji-cell"
                      variant="ghost"
                      size="icon-sm"
                      tabindex={tabStop === `${group.id}-${item.id}` ? 0 : -1}
                      data-emoji-key={`${group.id}-${item.id}`}
                      aria-label={`${item.name}, :${item.id}:`}
                      onkeydown={navigate}
                      onpointerenter={() => (preview = item)}
                      onfocus={() => {
                        focused = `${group.id}-${item.id}`;
                        preview = item;
                      }}
                      onclick={() => choose(item, close)}
                    >
                      <span class="emoji-glyph" aria-hidden="true">{item.emoji}</span>
                    </AesirButton>
                  {/each}
                </div>
              </section>
            {/if}
          {/each}
          {#if !cells.length}<div class="emoji-empty">
              <AesirIcon icon={Search} size={24} />
              <span>No emoji found</span>
              <small>Try a name like “coffee” or “celebrate”.</small>
            </div>{/if}
        </div>
      </AesirScrollArea>
      <footer class="emoji-preview">
        <span class="emoji-preview__glyph" aria-hidden="true">{preview.emoji}</span>
        <div>
          <span>{preview.name}</span>
          <small>:{preview.id}:</small>
        </div>
      </footer>
    </section>
  {/snippet}
</AesirPopover>

<style>
  :global(.emoji-reaction-trigger) {
    width: var(--ds-spacing-8);
    height: var(--ds-spacing-6);
    border-radius: var(--ds-radius-full);
    color: var(--ds-foreground-muted);
  }
  .emoji-picker {
    display: flex;
    flex-direction: column;
    height: min(30rem, calc(100dvh - var(--ds-spacing-8)));
    min-height: 0;
    color: var(--ds-foreground);
    background: var(--ds-background);
  }
  .emoji-categories {
    display: grid;
    grid-template-columns: repeat(9, minmax(0, 1fr));
    flex: none;
    padding: var(--ds-spacing-1) var(--ds-spacing-2) 0;
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  .emoji-categories :global(.emoji-category) {
    position: relative;
    width: 100%;
    height: var(--ds-spacing-10);
    border-radius: 0;
    color: var(--ds-foreground-muted);
  }
  .emoji-categories :global(.emoji-category[aria-pressed='true']) {
    color: var(--ds-foreground);
    background: var(--ds-background-secondary);
  }
  .emoji-categories :global(.emoji-category[aria-pressed='true'])::after {
    position: absolute;
    inset: auto var(--ds-spacing-1) 0;
    height: var(--ds-spacing-0-5);
    background: currentColor;
    content: '';
  }
  .emoji-search {
    flex: none;
    padding: var(--ds-spacing-3);
  }
  .emoji-picker :global(.emoji-scroll) {
    flex: 1;
    min-height: 0;
  }
  .emoji-sections {
    padding: 0 var(--ds-spacing-3) var(--ds-spacing-3);
  }
  .emoji-section + .emoji-section {
    margin-top: var(--ds-spacing-4);
  }
  .emoji-section h3 {
    margin: 0 0 var(--ds-spacing-2);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-normal);
  }
  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: var(--ds-spacing-0-5);
  }
  .emoji-grid :global(.emoji-cell) {
    width: 100%;
    height: var(--ds-spacing-10);
    padding: 0;
  }
  .emoji-glyph,
  .emoji-preview__glyph {
    font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
    font-size: var(--ds-font-size-2xl);
    line-height: 1;
  }
  .emoji-preview {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--ds-spacing-3);
    min-height: var(--ds-spacing-16);
    padding: var(--ds-spacing-3) var(--ds-spacing-4);
    border-top: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background-secondary);
  }
  .emoji-preview__glyph {
    display: grid;
    width: var(--ds-spacing-10);
    flex: none;
    place-items: center;
  }
  .emoji-preview > div {
    display: grid;
    min-width: 0;
    gap: var(--ds-spacing-1);
    font-size: var(--ds-font-size-sm);
  }
  .emoji-preview small {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    overflow-wrap: anywhere;
  }
  .emoji-empty {
    display: grid;
    gap: var(--ds-spacing-3);
    justify-items: center;
    padding: var(--ds-spacing-8) 0;
    text-align: center;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }
  .emoji-empty small {
    font-size: var(--ds-font-size-xs);
  }
  .sr-only {
    position: absolute;
    width: var(--ds-spacing-px);
    height: var(--ds-spacing-px);
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
