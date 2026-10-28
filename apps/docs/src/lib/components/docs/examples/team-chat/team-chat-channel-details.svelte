<script>
  import { tick } from 'svelte';
  import { AesirButton, AesirCard, AesirIcon, AesirInput, AesirTabs, AesirTextarea } from '@aesir/svelte';
  import Copy from '@lucide/svelte/icons/copy';
  import TeamChatMembers from './team-chat-members.svelte';
  let { room, people, tab = $bindable('about'), memberState, onprofile, onadd, onrename, onupdate } = $props();
  let editingName = $state(false);
  let name = $state('');
  let editingDetail = $state('');
  let detail = $state('');
  let copyNotice = $state('');
  let root;
  const validName = $derived(Boolean(name.trim()) && name.trim().replace(/\s+/g, ' ').length <= 80);
  const id = $props.id();
  const items = $derived([
    { value: 'about', label: 'About' },
    { value: 'members', label: `Members ${room.members.length}` }
  ]);
  const fields = $derived(room.type === 'channel' ? ['topic', 'description'] : ['topic']);
  function connectPanels(node) {
    root = node;
    node.querySelectorAll('[role="tab"]').forEach((button, index) => {
      button.id = `${id}-tab-${items[index].value}`;
      button.setAttribute('aria-controls', `${id}-panel-${items[index].value}`);
    });
    return () => {
      root = undefined;
    };
  }
  async function editName() {
    name = room.name;
    editingDetail = '';
    editingName = true;
    await tick();
    const input = root?.querySelector('[data-conversation-name]');
    input?.focus();
    input?.select();
  }
  async function cancelName() {
    editingName = false;
    await tick();
    root?.querySelector('[aria-label="Rename conversation"]')?.focus();
  }
  function saveName(event) {
    event.preventDefault();
    if (!validName || !onrename?.(name)) return;
    void cancelName();
  }
  async function editDetail(field) {
    detail = room[field] || '';
    editingName = false;
    editingDetail = field;
    await tick();
    root?.querySelector('[data-conversation-detail]')?.focus();
  }
  async function cancelDetail() {
    const field = editingDetail;
    editingDetail = '';
    await tick();
    root?.querySelector(`[aria-label="Edit ${field}"]`)?.focus();
  }
  function saveDetail(event) {
    event.preventDefault();
    if (!onupdate?.(editingDetail, detail)) return;
    void cancelDetail();
  }
  async function copyId() {
    try {
      await navigator.clipboard.writeText(room.id);
      copyNotice = `${room.type === 'channel' ? 'Channel' : 'Conversation'} ID copied.`;
    } catch {
      copyNotice = 'Could not copy. Select the ID and copy it manually.';
    }
  }
</script>

<div class="channel-details" {@attach connectPanels}>
  <AesirTabs {items} bind:value={tab} variant="line" border label={room.type === 'channel' ? 'Channel details' : 'Conversation details'} />
  <div id={`${id}-panel-about`} role="tabpanel" aria-labelledby={`${id}-tab-about`} tabindex="0" hidden={tab !== 'about'}>
    <div class="channel-about">
      <AesirCard class="about-card" title={room.type === 'channel' ? 'Channel name' : 'Conversation name'} titleElement="h3">
        {#snippet headerAction()}
          {#if !editingName && onrename}<AesirButton class="about-edit" variant="ghost" size="sm" aria-label="Rename conversation" onclick={editName}>Edit</AesirButton>{/if}
        {/snippet}
        {#if editingName}
          <form class="conversation-name-form" onsubmit={saveName}>
            <AesirInput
              bind:value={name}
              label={room.type === 'channel' ? 'Channel name' : 'Conversation name'}
              data-conversation-name
              maxlength={80}
              required
              description="Choose a name (1–80 characters)."
              onkeydown={(event) => {
                if (event.key === 'Escape' && !event.isComposing) {
                  event.preventDefault();
                  event.stopPropagation();
                  void cancelName();
                }
              }}
            />
            <div class="conversation-name-actions">
              <AesirButton variant="ghost" size="sm" onclick={cancelName}>Cancel</AesirButton>
              <AesirButton type="submit" size="sm" disabled={!validName}>Save name</AesirButton>
            </div>
          </form>
        {:else}
          <p class="conversation-name">{room.type === 'channel' ? '# ' : ''}{room.name}</p>
        {/if}
      </AesirCard>
      {#each fields as field (field)}
        {@const label = field === 'topic' ? 'Topic' : 'Description'}
        <AesirCard class="about-card" title={label} titleElement="h3">
          {#snippet headerAction()}
            {#if editingDetail !== field && onupdate}<AesirButton class="about-edit" variant="ghost" size="sm" aria-label={`Edit ${field}`} onclick={() => editDetail(field)}>Edit</AesirButton>{/if}
          {/snippet}
          {#if editingDetail === field}
            <form class="conversation-detail-form" onsubmit={saveDetail}>
              <AesirTextarea
                bind:value={detail}
                {label}
                data-conversation-detail
                rows={3}
                maxlength={250}
                showCount
                onkeydown={(event) => {
                  if (event.key === 'Escape' && !event.isComposing) {
                    event.preventDefault();
                    event.stopPropagation();
                    void cancelDetail();
                  }
                }}
              />
              <div class="conversation-name-actions">
                <AesirButton variant="ghost" size="sm" onclick={cancelDetail}>Cancel</AesirButton>
                <AesirButton type="submit" size="sm" disabled={detail.trim().length > 250}>Save {field}</AesirButton>
              </div>
            </form>
          {:else}
            <p class:empty={!room[field]} class="conversation-detail">{room[field] || `Add a ${field}`}</p>
          {/if}
        </AesirCard>
      {/each}
      <div class="conversation-id">
        <span>
          {room.type === 'channel' ? 'Channel ID' : 'Conversation ID'}:
          <span class="conversation-id-value">{room.id}</span>
        </span>
        <AesirButton variant="ghost" size="icon-sm" aria-label={`Copy ${room.type === 'channel' ? 'channel' : 'conversation'} ID`} onclick={copyId}>
          <AesirIcon icon={Copy} size={14} />
        </AesirButton>
      </div>
      <span class="copy-notice" role="status">{copyNotice}</span>
      <dl class="conversation-meta">
        {#if room.type === 'channel'}<div>
            <dt>Notifications</dt>
            <dd>{room.notifications === 'muted' ? 'Muted' : room.notifications === 'mentions' ? 'Just mentions' : 'All new posts'}</dd>
          </div>{/if}
        <div>
          <dt>Members</dt>
          <dd>{room.members.length}</dd>
        </div>
      </dl>
    </div>
  </div>
  <div id={`${id}-panel-members`} role="tabpanel" aria-labelledby={`${id}-tab-members`} tabindex="0" hidden={tab !== 'members'}>
    {#if tab === 'members'}<TeamChatMembers {room} {people} {onprofile} {onadd} viewState={memberState} />{/if}
  </div>
</div>

<style>
  .channel-details {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: var(--ds-spacing-4);
    height: 100%;
    min-height: 0;
    min-width: 0;
  }
  .channel-details > [role='tabpanel'] {
    min-height: 0;
    overflow: auto;
    scrollbar-gutter: stable;
  }
  .channel-about {
    display: grid;
    gap: var(--ds-spacing-4);
    min-width: 0;
  }
  .channel-about :global(.about-card) {
    gap: var(--ds-spacing-1);
    padding-block: var(--ds-spacing-4);
    background: var(--ds-background-secondary);
    box-shadow: none;
  }
  .channel-about :global(.about-card > .aesir-card__header),
  .channel-about :global(.about-card > .aesir-card__content) {
    padding-inline: var(--ds-spacing-4);
    min-width: 0;
  }
  .channel-about :global(.about-card .aesir-card__title) {
    margin: 0;
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-base);
  }
  .channel-about :global(.about-edit) {
    flex-shrink: 0;
    color: var(--ds-accent-text);
  }
  .conversation-name,
  .conversation-detail {
    margin: 0;
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-lg);
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
  .empty {
    color: var(--ds-foreground-muted);
  }
  .conversation-name-form,
  .conversation-detail-form {
    display: grid;
    gap: var(--ds-spacing-3);
    min-width: 0;
  }
  .conversation-name-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--ds-spacing-2);
  }
  .conversation-id {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-1);
    padding-inline: var(--ds-spacing-4);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    min-width: 0;
  }
  .conversation-id > span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .conversation-id-value {
    user-select: text;
  }
  .conversation-id :global(button) {
    flex-shrink: 0;
  }
  .copy-notice {
    padding-inline: var(--ds-spacing-4);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .copy-notice:empty {
    display: none;
  }
  .conversation-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ds-spacing-3) var(--ds-spacing-6);
    margin: 0;
    padding-inline: var(--ds-spacing-4);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .conversation-meta > div {
    display: flex;
    gap: var(--ds-spacing-2);
  }
  dd {
    margin: 0;
  }
</style>
