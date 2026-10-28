<script>
  import { tick } from 'svelte';
  import { AesirButton, AesirIcon, AesirInput, AesirSelect } from '@aesir/svelte';
  import UserRoundPlus from '@lucide/svelte/icons/user-round-plus';
  import Search from '@lucide/svelte/icons/search';
  import X from '@lucide/svelte/icons/x';
  import TeamChatAvatar from './team-chat-avatar.svelte';
  import TeamChatAddPeople from './team-chat-add-people.svelte';
  import { presenceLabels } from './team-chat-demo.js';

  let { room, people, onprofile, onadd, viewState } = $props();
  let adding = $state(false);
  let localState = $state({ query: '', filter: 'all', scrollTop: 0 });
  const state = $derived(viewState ?? localState);
  let root;
  const available = $derived(Object.keys(people).filter((id) => !room.members.includes(id)));
  const canAdd = $derived(room.type === 'channel' && Boolean(onadd));
  const searchingMembers = $derived(Boolean(state.query.trim()));
  const matchingMembers = $derived(room.members.filter((id) => people[id].name.toLocaleLowerCase().includes(state.query.trim().toLocaleLowerCase())));
  const matchingOthers = $derived(available.filter((id) => people[id].name.toLocaleLowerCase().includes(state.query.trim().toLocaleLowerCase())));
  const filters = [
    { value: 'all', label: 'All' },
    { value: 'members', label: 'In this channel' },
    { value: 'others', label: 'Not in this channel' }
  ];

  function observeMembers(node) {
    root = node;
    const viewport = node.closest('[role="tabpanel"]') ?? node.closest('.aesir-dialog');
    const savedState = state;
    const rememberScroll = () => (savedState.scrollTop = viewport.scrollTop);
    viewport?.addEventListener('scroll', rememberScroll);
    void tick().then(() => {
      if (node.isConnected && viewport) viewport.scrollTop = savedState.scrollTop;
    });
    return () => {
      viewport?.removeEventListener('scroll', rememberScroll);
      root = undefined;
    };
  }
  function setMemberQuery(value) {
    state.query = value;
    if (!value.trim()) state.filter = 'all';
  }
  function showPicker(event) {
    event.currentTarget.focus();
    adding = true;
  }
  async function addPerson(id) {
    if (!canAdd || !available.includes(id)) return;
    onadd([id]);
    await tick();
    root?.querySelector('[aria-label="Search members"]')?.focus();
  }
</script>

<div class="chat-members" {@attach observeMembers}>
  <div class="members-toolbar">
    <strong>
      Members <span>{room.members.length}</span>
    </strong>
  </div>
  <div class="members-search">
    <AesirInput aria-label="Search members" placeholder="Search people" bind:value={() => state.query, setMemberQuery}>
      {#snippet leading()}<AesirIcon icon={Search} size={16} />{/snippet}
      {#snippet trailing()}
        {#if state.query}<AesirButton
            variant="ghost"
            size="icon-sm"
            aria-label="Clear member search"
            onclick={() => {
              setMemberQuery('');
              root?.querySelector('[aria-label="Search members"]')?.focus();
            }}
          >
            <AesirIcon icon={X} size={14} />
          </AesirButton>{/if}
      {/snippet}
    </AesirInput>
    {#if canAdd && searchingMembers}<AesirSelect class="members-filter" label="Filter channel people" options={filters} bind:value={state.filter} />{/if}
  </div>
  {#if canAdd}
    <AesirButton class="members-add" variant="ghost" width="full" aria-label="Add people" onclick={showPicker}>
      <span class="members-add__icon"><AesirIcon icon={UserRoundPlus} size={20} /></span>
      Add people
    </AesirButton>
  {/if}
  {#if !searchingMembers || state.filter !== 'others' || !canAdd}
    <h3>{room.type === 'channel' ? 'Members in this channel' : 'Conversation members'}</h3>
    <div class="member-list">
      {#each matchingMembers as id (id)}
        <AesirButton class="member-profile" variant="ghost" width="full" aria-label={`View ${people[id].name}'s profile`} onclick={(event) => onprofile?.(id, event)}>
          <TeamChatAvatar person={people[id]} />
          <span class="member-identity">
            {people[id].name}{#if id === 'you'}<small>(you)</small>{/if}
          </span>
          <span class="member-presence">{presenceLabels[people[id].presence]}</span>
        </AesirButton>
      {:else}
        <p class="members-empty">No members match your search.</p>
      {/each}
    </div>
  {/if}
  {#if canAdd && searchingMembers && state.filter !== 'members'}
    <section class="members-other" aria-label="Not in this channel">
      <h3>Not in this channel</h3>
      <div class="other-people-list">
        {#each matchingOthers as id (id)}
          <div>
            <AesirButton class="member-profile member-profile--other" variant="ghost" width="full" aria-label={`View ${people[id].name}'s profile`} onclick={(event) => onprofile?.(id, event)}>
              <TeamChatAvatar person={people[id]} />
              <span class="member-identity">{people[id].name}</span>
            </AesirButton>
            <AesirButton class="member-add-action" variant="outline" size="sm" aria-label={`Add ${people[id].name} to channel`} onclick={() => addPerson(id)}>Add to channel</AesirButton>
          </div>
        {:else}
          <p class="members-empty">{available.length ? 'No people match your search.' : 'Everyone in this workspace is already in this channel.'}</p>
        {/each}
      </div>
    </section>
  {/if}
</div>

{#if adding && canAdd}<TeamChatAddPeople bind:open={adding} {room} {people} {onadd} />{/if}

<style>
  .chat-members,
  .member-list,
  .other-people-list {
    display: grid;
    gap: var(--ds-spacing-4);
  }
  .members-search {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--ds-spacing-3);
  }
  .members-search:has(:global(.members-filter)) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.7fr);
  }
  .members-search > :global(*) {
    min-width: 0;
  }
  :global(.members-filter .aesir-select__label) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  :global(.members-add.aesir-button) {
    justify-content: flex-start;
    height: auto;
    padding: var(--ds-spacing-2);
    gap: var(--ds-spacing-3);
  }
  .members-add__icon {
    display: grid;
    place-items: center;
    width: var(--ds-spacing-9);
    height: var(--ds-spacing-9);
    flex: none;
    border-radius: var(--ds-radius-md);
    background: var(--ds-accent-surface);
    color: var(--ds-accent-text-muted);
  }
  h3 {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
  }
  .members-other {
    display: grid;
    gap: var(--ds-spacing-4);
    border-top: var(--ds-spacing-px) solid var(--ds-border);
    padding-top: var(--ds-spacing-4);
  }
  .other-people-list > div :global(.member-add-action) {
    margin-inline-start: auto;
    flex: none;
  }
  .members-toolbar,
  :global(.member-profile.aesir-button),
  .other-people-list > div {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-3);
    font-size: var(--ds-font-size-sm);
  }
  :global(.member-profile.aesir-button) {
    height: auto;
    min-height: var(--ds-spacing-12);
    padding: var(--ds-spacing-2);
    justify-content: flex-start;
    text-align: start;
    white-space: normal;
    font-weight: var(--ds-font-weight-normal);
    color: var(--ds-foreground);
  }
  :global(.member-profile--other.aesir-button) {
    flex: 1;
    min-width: 0;
  }
  .members-toolbar {
    justify-content: space-between;
    flex-wrap: wrap;
  }
  .members-toolbar strong {
    font-weight: var(--ds-font-weight-medium);
  }
  .members-toolbar strong span {
    margin-inline-start: var(--ds-spacing-1);
    color: var(--ds-foreground-muted);
  }
  .member-identity {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .member-list small {
    margin-inline-start: var(--ds-spacing-1);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  @media (max-width: 30rem) {
    .members-search:has(:global(.members-filter)) {
      grid-template-columns: minmax(0, 1fr);
    }
    .other-people-list > div {
      flex-wrap: wrap;
    }
  }
  .member-presence {
    margin-inline-start: auto;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .members-empty {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }
</style>
