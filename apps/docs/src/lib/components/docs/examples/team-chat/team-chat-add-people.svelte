<script>
  import { tick } from 'svelte';
  import { AesirButton, AesirDialog, AesirIcon, AesirInput, AesirPopover, AesirScrollArea } from '@aesir/svelte';
  import X from '@lucide/svelte/icons/x';
  import Plus from '@lucide/svelte/icons/plus';
  import TeamChatAvatar from './team-chat-avatar.svelte';

  let { open = $bindable(false), room, people, onadd } = $props();
  let selected = $state([]);
  let query = $state('');
  let pickerOpen = $state(false);
  let optionsRef = $state();
  let root;
  const id = $props.id();
  const hintId = `${id}-hint`;
  const available = $derived(Object.keys(people).filter((id) => !room.members.includes(id)));
  const matches = $derived(available.filter((id) => !selected.includes(id) && people[id].name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())));

  function attachRoot(node) {
    root = node;
    // Let the dialog finish its initial focus trap before focusing the search.
    void tick().then(async () => {
      await tick();
      root?.querySelector('input')?.focus();
    });
    return () => {
      root = undefined;
    };
  }
  async function selectPerson(id) {
    if (!available.includes(id) || selected.includes(id)) return;
    selected = [...selected, id];
    query = '';
    pickerOpen = false;
    await tick();
    root?.querySelector('input')?.focus();
  }
  async function removePerson(id) {
    selected = selected.filter((entry) => entry !== id);
    pickerOpen = false;
    await tick();
    root?.querySelector('input')?.focus();
  }
  function addSelected() {
    const ids = selected.filter((id) => available.includes(id));
    if (!ids.length) return;
    onadd?.(ids);
    open = false;
  }
  function leavePicker(event) {
    if (root?.contains(event.relatedTarget) || optionsRef?.contains(event.relatedTarget)) return;
    pickerOpen = false;
  }
  async function searchKeydown(event) {
    if (event.isComposing) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      pickerOpen = true;
      await tick();
      const options = optionsRef?.querySelectorAll('[data-add-person]');
      (event.key === 'ArrowUp' ? options?.[options.length - 1] : options?.[0])?.focus();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (query.trim() || pickerOpen) {
        if (matches.length) void selectPerson(matches[0]);
      } else addSelected();
    } else if (event.key === 'Backspace' && !query && selected.length) {
      event.preventDefault();
      void removePerson(selected.at(-1));
    }
  }
  function optionKeydown(event) {
    if (event.isComposing || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const options = [...optionsRef.querySelectorAll('[data-add-person]')];
    const index = options.indexOf(event.currentTarget);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    options[next]?.focus();
  }
</script>

<AesirDialog class="chat-add-people-dialog" bind:open title="Add people to this channel" description={`# ${room.name}`} closeLabel="Close add people">
  <div class="add-people" {@attach attachRoot}>
    <AesirPopover
      class="add-people-picker"
      bind:open={pickerOpen}
      placement="bottom"
      align="start"
      contentClass="add-people-suggestions"
      contentStyle="width: min(var(--ds-sizing-xl), calc(100vw - var(--ds-spacing-16)));"
    >
      {#snippet trigger()}
        <div class="add-people-control" role="group" aria-label="Selected people">
          {#each selected as id (id)}
            <AesirButton class="add-people-chip" variant="secondary" size="sm" aria-label={`Remove ${people[id].name} from selection`} onclick={() => removePerson(id)}>
              <TeamChatAvatar person={people[id]} size="2xs" />
              <span class="add-people-chip__name">{people[id].name}</span>
              <AesirIcon icon={X} size={14} />
            </AesirButton>
          {/each}
          <AesirInput
            class="add-people-query"
            aria-label="Find people to add"
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
            aria-describedby={hintId}
            placeholder={selected.length ? 'Add another person…' : 'Search by name…'}
            bind:value={query}
            autocomplete="off"
            onclick={() => (pickerOpen = true)}
            oninput={() => (pickerOpen = true)}
            onblur={leavePicker}
            onkeydown={searchKeydown}
          />
        </div>
      {/snippet}
      {#snippet content()}
        <AesirScrollArea class="add-people-options" bind:ref={optionsRef} label="People you can add">
          <div class="add-people-results" onfocusout={leavePicker}>
            {#each matches as id (id)}
              <AesirButton
                class="add-people-option"
                variant="ghost"
                size="sm"
                width="full"
                data-add-person={id}
                aria-label={`Select ${people[id].name}`}
                onclick={() => selectPerson(id)}
                onkeydown={optionKeydown}
              >
                <TeamChatAvatar person={people[id]} size="xs" />
                <span class="add-people-option__name">{people[id].name}</span>
                <AesirIcon icon={Plus} size={15} />
              </AesirButton>
            {:else}<p class="add-people-empty">{available.length ? 'No people match your search.' : 'Everyone in this workspace is already in this channel.'}</p>{/each}
          </div>
        </AesirScrollArea>
      {/snippet}
    </AesirPopover>
    <p class="add-people-hint" id={hintId}>{available.length ? 'Search for people and select them to add to this channel.' : 'Everyone in this workspace is already in this channel.'}</p>
  </div>
  {#snippet footer({ close })}
    <AesirButton variant="ghost" size="sm" onclick={() => close()}>Cancel</AesirButton>
    <AesirButton size="sm" disabled={!selected.length} aria-label="Add selected people" onclick={addSelected}>
      Add{selected.length ? ` ${selected.length}` : ''}
      {selected.length === 1 ? 'person' : 'people'}
    </AesirButton>
  {/snippet}
</AesirDialog>

<style>
  :global(.chat-add-people-dialog) {
    width: min(100%, var(--ds-sizing-2xl));
    grid-template-rows: auto minmax(0, 1fr) auto;
    overflow: hidden;
  }
  :global(.chat-add-people-dialog .aesir-dialog__body) {
    min-height: 0;
    overflow: auto;
  }
  .add-people {
    display: grid;
    gap: var(--ds-spacing-2);
    min-width: 0;
  }
  .add-people :global(.add-people-picker) {
    display: block;
    min-width: 0;
  }
  .add-people-control {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ds-spacing-2);
    min-width: 0;
    padding: var(--ds-spacing-2);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background);
  }
  .add-people-control:focus-within {
    border-color: var(--ds-accent);
    box-shadow: 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-ring);
  }
  .add-people-control :global(.add-people-query) {
    flex: 1;
    min-width: min(var(--ds-spacing-32), 100%);
    max-width: 100%;
  }
  .add-people-control :global(.aesir-input__control) {
    border: 0;
    box-shadow: none;
    background: transparent;
    min-height: var(--ds-spacing-8);
  }
  .add-people-control :global(input) {
    min-width: 0;
    padding-inline: 0;
  }
  .add-people-control :global(.add-people-chip) {
    height: auto;
    min-height: var(--ds-spacing-8);
    min-width: 0;
    max-width: 100%;
    padding: var(--ds-spacing-1) var(--ds-spacing-2);
    gap: var(--ds-spacing-2);
    background: var(--ds-accent-surface);
    color: var(--ds-accent-text);
  }
  .add-people-chip__name,
  .add-people-option__name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .add-people-hint,
  .add-people-empty {
    margin: 0;
    font-size: var(--ds-font-size-xs);
    color: var(--ds-foreground-muted);
  }
  :global(.add-people-suggestions) {
    padding: var(--ds-spacing-1);
  }
  :global(.add-people-suggestions .add-people-options.aesir-scroll-area) {
    height: auto;
    max-height: var(--ds-sizing-xs);
  }
  :global(.add-people-suggestions .add-people-options > .aesir-scroll-area__viewport) {
    height: auto;
    max-height: var(--ds-sizing-xs);
  }
  .add-people-results {
    display: grid;
    gap: var(--ds-spacing-0-5);
    padding-right: var(--ds-spacing-2);
  }
  .add-people-results :global(.add-people-option) {
    height: var(--ds-spacing-9);
    min-width: 0;
    justify-content: flex-start;
    gap: var(--ds-spacing-2);
  }
  .add-people-option__name {
    flex: 1;
    text-align: left;
  }
  .add-people-empty {
    padding: var(--ds-spacing-3);
  }
</style>
