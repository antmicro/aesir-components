<script>
  import { tick } from 'svelte';
  import { AesirBadge, AesirButton, AesirIcon, AesirInput, AesirScrollArea, AesirToggleGroup, AesirToggleGroupItem } from '@aesir/svelte';
  import House from '@lucide/svelte/icons/house';
  import MessagesSquare from '@lucide/svelte/icons/messages-square';
  import Bell from '@lucide/svelte/icons/bell';
  import Search from '@lucide/svelte/icons/search';
  import Hash from '@lucide/svelte/icons/hash';
  import Users from '@lucide/svelte/icons/users';
  import Bookmark from '@lucide/svelte/icons/bookmark';
  import Clock from '@lucide/svelte/icons/clock';
  import FilePenLine from '@lucide/svelte/icons/file-pen-line';
  import TeamChatSidebarHeader from './team-chat-sidebar-header.svelte';
  import Plus from '@lucide/svelte/icons/plus';
  import X from '@lucide/svelte/icons/x';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import Settings from '@lucide/svelte/icons/settings';
  import Inbox from '@lucide/svelte/icons/inbox';
  import Mail from '@lucide/svelte/icons/mail';
  import AtSign from '@lucide/svelte/icons/at-sign';
  import MessageCircle from '@lucide/svelte/icons/message-circle';
  import Smile from '@lucide/svelte/icons/smile';
  import TeamChatAvatar from './team-chat-avatar.svelte';
  import TeamChatSearchHighlight from './team-chat-search-highlight.svelte';
  import { latestChatMessage, mobileChatActivity, mobileChatPeople, mobileChatSearch, sortMobileConversations } from './team-chat-mobile-model.js';
  import { plainChatText } from './team-chat-formatting.js';
  import { presenceLabels } from './team-chat-demo.js';

  let {
    tab = $bindable('home'),
    layout = 'mobile',
    selected,
    hidden = false,
    rooms,
    messages,
    people,
    drafts,
    draftCount = 0,
    scheduledCount = 0,
    showUnread = true,
    onconversation,
    onmessage,
    onperson,
    onnewmessage,
    onpreferences,
    onchannelmenu,
    onmarkread,
    onnavigate,
    children
  } = $props();
  let query = $state('');
  let dmQuery = $state('');
  let activityFilter = $state('all');
  let clearedActivity = $state([]);
  let root;
  const id = $props.id();
  const tabs = [
    { id: 'home', label: 'Home', icon: House },
    { id: 'dms', label: 'DMs', icon: MessagesSquare },
    { id: 'activity', label: 'Activity', icon: Bell },
    { id: 'more', label: 'More', icon: Ellipsis },
    { id: 'search', label: 'Search', icon: Search }
  ];
  const activityFilters = [
    { value: 'all', label: 'All', icon: Inbox },
    { value: 'unread', label: 'Unread', icon: Mail },
    { value: 'mentions', label: 'Mentions', icon: AtSign },
    { value: 'replies', label: 'Replies', icon: MessageCircle },
    { value: 'reactions', label: 'Reactions', icon: Smile }
  ];
  const channels = $derived(rooms.filter((room) => room.type === 'channel').toSorted((a, b) => Number(Boolean(b.starred)) - Number(Boolean(a.starred))));
  const directRooms = $derived(
    sortMobileConversations(
      rooms.filter((room) => room.type !== 'channel'),
      messages
    )
  );
  const quickPeople = $derived(mobileChatPeople(rooms, people, messages));
  const visibleDirectRooms = $derived.by(() => {
    const term = layout === 'sidebar' ? dmQuery.trim().toLocaleLowerCase() : '';
    return directRooms.filter((room) => `${room.name} ${room.members.map((id) => people[id]?.name ?? '').join(' ')}`.toLocaleLowerCase().includes(term));
  });
  const searchGroups = $derived(mobileChatSearch(rooms, people, messages, query));
  const activities = $derived(mobileChatActivity(rooms, messages).filter((entry) => !clearedActivity.includes(entry.message.id)));
  const visibleActivities = $derived(activities.filter((entry) => activityFilter === 'all' || entry.types.includes(activityFilter)));
  const unreadDMs = $derived(rooms.filter((room) => room.type !== 'channel' && room.unread).length);
  const unreadActivity = $derived(activities.filter((entry) => entry.unread).length);
  const showUnreadActivity = $derived(showUnread && unreadActivity > 0);

  function hasUnread(id) {
    return showUnread && (id === 'home' ? channels.some((room) => room.unread) : id === 'dms' ? unreadDMs > 0 : id === 'activity' ? unreadActivity > 0 : false);
  }

  function mountRoot(node) {
    root = node;
    return () => {
      root = undefined;
    };
  }
  async function selectTab(id) {
    tab = id;
    onnavigate?.();
    await tick();
    if (id === 'search') root?.querySelector('[aria-label="Search messages, people, and channels"]')?.focus();
    else root?.querySelector('[data-mobile-heading]')?.focus({ preventScroll: true });
  }
  function chooseResult(result) {
    if (result.kind === 'message') onmessage?.(result.message);
    else if (result.kind === 'person') onperson?.(result.person);
    else onconversation?.(result.room.id);
  }
  function searchKeydown(event) {
    if (event.isComposing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      query = '';
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const result = searchGroups[0]?.items[0];
      if (result) chooseResult(result);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      root?.querySelector('[data-mobile-search-result]')?.focus();
    }
  }
  function resultKeydown(event) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const results = [...root.querySelectorAll('[data-mobile-search-result]')];
    const index = results.indexOf(event.currentTarget);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? results.length - 1 : index + (event.key === 'ArrowDown' ? 1 : -1);
    (results[next] ?? root.querySelector('[aria-label="Search messages, people, and channels"]'))?.focus();
  }
  async function clearActivity() {
    clearedActivity = activities.map((entry) => entry.message.id);
    onmarkread?.();
    await tick();
    root?.querySelector('.activity-filter[aria-pressed="true"]')?.focus({ preventScroll: true });
  }
  function dmSearchKeydown(event) {
    if (event.isComposing) return;
    if (event.key === 'Escape' && dmQuery) {
      event.preventDefault();
      event.stopPropagation();
      dmQuery = '';
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (visibleDirectRooms[0]) onconversation?.(visibleDirectRooms[0].id);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      root?.querySelector('.mobile-row--preview')?.focus();
    }
  }
</script>

{#snippet roomLeading(room, size = 'xs')}
  {#if room.type === 'direct'}<TeamChatAvatar person={people[room.members.find((id) => id !== 'you')]} {size} />
  {:else}<span class="room-icon"><AesirIcon icon={room.type === 'group' ? Users : Hash} size={room.type === 'channel' ? 16 : 20} /></span>{/if}
{/snippet}

{#snippet shortcuts()}
  <AesirButton variant="ghost" class="mobile-shortcut" width="full" aria-label="Open drafts" onclick={() => onconversation?.('drafts')}>
    <AesirIcon icon={FilePenLine} size={20} />
    <span>Drafts</span>
    {#if draftCount}<AesirBadge variant="secondary">{draftCount}</AesirBadge>{/if}
  </AesirButton>
  <AesirButton variant="ghost" class="mobile-shortcut" width="full" onclick={() => onconversation?.('saved')}>
    <AesirIcon icon={Bookmark} size={20} />
    <span>Saved messages</span>
    <AesirBadge variant="secondary">{messages.filter((message) => message.saved).length}</AesirBadge>
  </AesirButton>
  <AesirButton variant="ghost" class="mobile-shortcut" width="full" onclick={() => onconversation?.('scheduled')}>
    <AesirIcon icon={Clock} size={20} />
    <span>Scheduled messages</span>
    {#if scheduledCount}<AesirBadge variant="secondary">{scheduledCount}</AesirBadge>{/if}
  </AesirButton>
{/snippet}

<div class="mobile-navigation" data-layout={layout} {@attach mountRoot}>
  {#if layout === 'sidebar'}
    <TeamChatSidebarHeader title={tabs.find((entry) => entry.id === tab)?.label} {onnewmessage} />
  {/if}
  <section class="mobile-screen" {hidden} aria-label={`${tabs.find((entry) => entry.id === tab)?.label} view`}>
    {#if layout === 'mobile'}<h2 class="sr-only" tabindex="-1" data-mobile-heading>{tabs.find((entry) => entry.id === tab)?.label}</h2>{/if}
    {#if tab === 'home'}
      <AesirScrollArea class="mobile-scroll" label="Home conversations">
        <div class="home-shortcuts">
          {@render shortcuts()}
        </div>
        <section class="mobile-section" aria-label="Channels">
          <h3>
            Channels <span>{channels.length}</span>
          </h3>
          {#each channels as room (room.id)}<AesirButton
              variant="ghost"
              class="mobile-row mobile-row--compact"
              width="full"
              aria-label={`Open #${room.name}`}
              data-mobile-channel={room.id}
              onclick={() => onconversation?.(room.id)}
              oncontextmenu={(event) => {
                event.preventDefault();
                onchannelmenu?.(room.id, event.currentTarget);
              }}
              onkeydown={(event) => {
                if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
                  event.preventDefault();
                  onchannelmenu?.(room.id, event.currentTarget);
                }
              }}
            >
              {@render roomLeading(room)}
              <span class="row-name row-name--conversation" data-unread={room.unread ? true : undefined}>{room.name}</span>
              {#if drafts[room.id]?.trim()}<span class="draft-label">Draft</span>{/if}{#if showUnread && room.unread}<AesirBadge class="mobile-unread">{room.unread}</AesirBadge>{/if}
            </AesirButton>{/each}
        </section>
        <section class="mobile-section" aria-label="Direct messages">
          <div class="section-heading">
            <h3>Direct messages</h3>
            <AesirButton variant="ghost" size="icon" aria-label="Open a direct message" onclick={onnewmessage}><AesirIcon icon={Plus} size={20} /></AesirButton>
          </div>
          {#each rooms.filter((room) => room.type !== 'channel') as room (room.id)}<AesirButton
              variant="ghost"
              class="mobile-row mobile-row--compact"
              width="full"
              onclick={() => onconversation?.(room.id)}
            >
              {@render roomLeading(room)}
              <span class="row-name row-name--conversation" data-unread={room.unread ? true : undefined}>{room.name}</span>
              {#if showUnread && room.unread}<AesirBadge class="mobile-unread">{room.unread}</AesirBadge>{/if}
            </AesirButton>{/each}
        </section>
      </AesirScrollArea>
    {:else if tab === 'dms'}
      {#if layout === 'sidebar'}<div class="dm-search-field">
          <AesirInput
            size="sm"
            bind:value={dmQuery}
            aria-label="Search direct messages"
            placeholder="Search direct messages…"
            autocomplete="off"
            onkeydown={dmSearchKeydown}
            trailingVisible={Boolean(dmQuery)}
          >
            {#snippet leading()}<AesirIcon icon={Search} size={16} />{/snippet}
            {#snippet trailing()}{#if dmQuery}<AesirButton
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Clear direct message search"
                  onclick={() => {
                    dmQuery = '';
                    root?.querySelector('.dm-search-field input')?.focus();
                  }}
                >
                  <AesirIcon icon={X} size={14} />
                </AesirButton>{/if}{/snippet}
          </AesirInput>
          <span class="sr-only" role="status">{dmQuery.trim() ? `${visibleDirectRooms.length} conversations found` : ''}</span>
        </div>{/if}
      <AesirScrollArea class="mobile-scroll" label="Direct messages">
        {#if layout === 'mobile' && quickPeople.length}<section class="dm-people" aria-label="Quick direct messages">
            <div class="dm-people-heading">
              <h3>Recent</h3>
            </div>
            <ul class="dm-people-strip" aria-label="Recent people">
              {#each quickPeople as contact (contact.id)}<li>
                  <AesirButton class="dm-person" variant="ghost" aria-label={`Message ${contact.person.name}`} onclick={() => onperson?.(contact.person)}>
                    <TeamChatAvatar person={contact.person} size="default" />
                    <span class="dm-person-name" data-unread={rooms.some((room) => room.type === 'direct' && room.unread && room.members.includes(contact.id)) ? true : undefined}>
                      {contact.person.name}
                    </span>
                  </AesirButton>
                </li>{/each}
            </ul>
          </section>{/if}
        {#each visibleDirectRooms as room (room.id)}
          {@const latest = latestChatMessage(messages, room.id)}
          <AesirButton
            variant="ghost"
            class="mobile-row mobile-row--preview"
            width="full"
            aria-label={`Open ${room.name}`}
            aria-current={layout === 'sidebar' && selected === room.id ? 'page' : undefined}
            onclick={() => onconversation?.(room.id)}
          >
            {@render roomLeading(room, 'sm')}
            <span class="row-copy">
              <span class="row-heading row-heading--dm">
                <span class="row-name row-name--conversation" data-unread={room.unread ? true : undefined}>{room.name}</span>
                <span class="row-meta">
                  {#if latest}<span class="row-time">{latest.time}</span>{/if}
                  {#if showUnread && room.unread}<AesirBadge class="mobile-unread" size="sm">{room.unread}</AesirBadge>{/if}
                </span>
              </span>
              <span class="row-preview">
                {#if drafts[room.id]?.trim()}<span class="draft-label">Draft:</span>
                  {plainChatText(drafts[room.id])}{:else if latest}{latest.author === 'you' ? 'You: ' : room.type === 'group' ? `${people[latest.author].name}: ` : ''}{plainChatText(
                    latest.text
                  )}{:else}No messages yet{/if}
              </span>
            </span>
          </AesirButton>
        {:else}<div class="mobile-empty">
            <AesirIcon icon={dmQuery.trim() && layout === 'sidebar' ? Search : MessagesSquare} size={28} />
            <h3>{dmQuery.trim() && layout === 'sidebar' ? 'No conversations found' : 'No conversations yet'}</h3>
            <p>{dmQuery.trim() && layout === 'sidebar' ? 'Try a different name.' : 'Start a new message to someone.'}</p>
            {#if !dmQuery.trim() || layout !== 'sidebar'}<AesirButton variant="outline" onclick={onnewmessage}>New message</AesirButton>{/if}
          </div>{/each}
      </AesirScrollArea>
    {:else if tab === 'activity'}
      <div class="activity-tools">
        {#if activities.length}<AesirButton class="activity-clear" variant="outline" width="full" onclick={clearActivity}>Clear all</AesirButton>{/if}
        <AesirScrollArea class="activity-filters" orientation="horizontal" scrollbarSize={4} label="Activity filters">
          <div class="activity-filter-list">
            <AesirToggleGroup bind:value={activityFilter} type="single" size="sm" spacing={1} required label="Filter activity">
              {#each activityFilters as filter (filter.value)}<AesirToggleGroupItem
                  class="activity-filter"
                  value={filter.value}
                  aria-label={filter.label}
                  aria-describedby={filter.value === 'unread' && showUnreadActivity ? `${id}-unread-activity` : undefined}
                >
                  <AesirIcon icon={filter.icon} size={14} />
                  <span>{filter.label}</span>
                  {#if filter.value === 'unread' && showUnreadActivity}<span class="activity-filter-dot" aria-hidden="true"></span>{/if}
                </AesirToggleGroupItem>{/each}
            </AesirToggleGroup>
          </div>
        </AesirScrollArea>
        {#if showUnreadActivity}<span id={`${id}-unread-activity`} class="sr-only">{unreadActivity} unread {unreadActivity === 1 ? 'notification' : 'notifications'}</span>{/if}
      </div>
      <AesirScrollArea class="mobile-scroll" label="Activity feed">
        {#each visibleActivities as entry (entry.message.id)}
          {@const message = entry.message}
          {@const room = rooms.find((room) => room.id === message.conversation)}
          <AesirButton
            variant="ghost"
            class="mobile-row mobile-row--activity"
            width="full"
            aria-label={`Open activity from ${people[message.author].name} at ${message.time}`}
            onclick={() => onmessage?.(message)}
          >
            <TeamChatAvatar person={people[message.author]} size="sm" />
            <span class="row-copy">
              <span class="activity-context">
                {entry.types.includes('mentions') ? 'Mentioned you' : entry.types.includes('replies') ? 'Reply' : entry.types.includes('unread') ? 'New message' : 'Reactions'} · {room?.type ===
                'channel'
                  ? '# '
                  : ''}{room?.name}
              </span>
              <span class="row-heading">
                <span class="row-name">{people[message.author].name}</span>
                <span class="row-time">{message.time}</span>
              </span>
              <span class="row-preview row-preview--multiline">{plainChatText(message.text)}</span>
              {#if entry.types.includes('reactions')}<span class="activity-reactions">{message.reactions.map((reaction) => `${reaction.emoji} ${reaction.count}`).join('   ')}</span>{/if}
            </span>
            {#if showUnread && entry.unread}<span class="unread-dot" aria-label="Unread"></span>{/if}
          </AesirButton>
        {:else}<div class="mobile-empty">
            <AesirIcon icon={Bell} size={28} />
            <h3>You're all caught up</h3>
            <p>{activityFilter === 'all' ? 'New activity will appear here.' : 'Nothing in this filter right now.'}</p>
          </div>{/each}
      </AesirScrollArea>
    {:else if tab === 'more'}
      <AesirScrollArea class="mobile-scroll" label="More options">
        <div class="more-shortcuts">
          {@render shortcuts()}
          <AesirButton variant="ghost" class="mobile-shortcut" width="full" onclick={onpreferences}>
            <AesirIcon icon={Settings} size={20} />
            <span>Preferences</span>
          </AesirButton>
        </div>
      </AesirScrollArea>
    {:else}
      <div class="mobile-search-field">
        <AesirInput bind:value={query} aria-label="Search messages, people, and channels" placeholder="Search" autocomplete="off" onkeydown={searchKeydown} trailingVisible={Boolean(query)}>
          {#snippet leading()}<AesirIcon icon={Search} size={18} />{/snippet}{#snippet trailing()}{#if query}<AesirButton
                variant="ghost"
                size="icon"
                aria-label="Clear mobile search"
                onclick={() => {
                  query = '';
                  root?.querySelector('input')?.focus();
                }}
              >
                <AesirIcon icon={X} size={16} />
              </AesirButton>{/if}{/snippet}
        </AesirInput>
      </div>
      <span class="sr-only" role="status">{query.trim() ? `${searchGroups.reduce((count, group) => count + group.items.length, 0)} results found` : ''}</span>
      <AesirScrollArea class="mobile-scroll" label="Search results">
        {#each searchGroups as group (group.label)}<section class="mobile-section" aria-label={group.label}>
            <h3>{group.label}</h3>
            {#each group.items as result (`${result.kind}:${result.id}`)}
              <AesirButton
                variant="ghost"
                class={`mobile-row ${result.kind === 'message' ? 'mobile-row--preview' : 'mobile-row--compact'}`}
                width="full"
                data-mobile-search-result={`${result.kind}:${result.id}`}
                onclick={() => chooseResult(result)}
                onkeydown={resultKeydown}
              >
                {#if result.person}<TeamChatAvatar person={result.person} size={result.kind === 'message' ? 'sm' : 'xs'} />{:else}{@render roomLeading(result.room)}{/if}
                {#if result.kind === 'message'}<span class="row-copy">
                    <span class="row-heading">
                      <span class="row-name"><TeamChatSearchHighlight text={result.label} {query} /></span>
                      <span class="row-time">{result.message.time}</span>
                    </span>
                    <span class="activity-context">{result.room?.type === 'channel' ? '# ' : ''}{result.room?.name}</span>
                    <span class="row-preview row-preview--multiline"><TeamChatSearchHighlight text={result.preview} {query} /></span>
                  </span>
                {:else}<span class="row-name"><TeamChatSearchHighlight text={result.label} {query} /></span>
                  <span class="row-details">{result.kind === 'person' ? presenceLabels[result.person.presence] : `${result.room.members.length} members`}</span>{/if}
              </AesirButton>
            {/each}
          </section>{:else}<div class="mobile-empty">
            <AesirIcon icon={Search} size={28} />
            <h3>No results found</h3>
            <p>Try a different name, channel, or phrase.</p>
          </div>{/each}
      </AesirScrollArea>
    {/if}
  </section>
  {@render children?.()}
  {#if layout === 'mobile'}<nav class="mobile-tabbar" aria-label="Mobile navigation">
      <div class="mobile-tab-pill">
        {#each tabs.filter((entry) => entry.id !== 'search') as entry (entry.id)}<AesirButton
            variant="ghost"
            radius="full"
            class="mobile-tab"
            aria-label={hasUnread(entry.id) ? `${entry.label}, unread` : entry.label}
            aria-current={tab === entry.id ? 'page' : undefined}
            onclick={() => selectTab(entry.id)}
          >
            <span class="tab-icon">
              <AesirIcon icon={entry.icon} size={16} />{#if hasUnread(entry.id)}<span class="tab-dot" aria-hidden="true"></span>{/if}
            </span>
            <span>{entry.label}</span>
          </AesirButton>{/each}
      </div>
      <AesirButton variant="ghost" radius="full" class="mobile-tab mobile-search-tab" aria-label="Search" aria-current={tab === 'search' ? 'page' : undefined} onclick={() => selectTab('search')}>
        <AesirIcon icon={Search} size={16} />
        <span class="sr-only">Search</span>
      </AesirButton>
    </nav>{/if}
</div>

<style>
  .mobile-navigation {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
  .mobile-navigation[data-layout='sidebar'] :global(.mobile-row[aria-current='page']) {
    background: var(--ds-accent-surface);
  }
  .mobile-navigation[data-layout='sidebar'] :global(.mobile-row[aria-current='page'] .row-name) {
    color: var(--ds-accent-text-muted);
    font-weight: var(--ds-font-weight-medium);
  }
  .mobile-screen[hidden] {
    display: none;
  }
  .mobile-screen {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    min-width: 0;
  }
  .mobile-navigation :global(.mobile-scroll) {
    flex: 1;
    min-height: 0;
  }
  .mobile-section {
    padding: var(--ds-spacing-2) var(--ds-spacing-2) var(--ds-spacing-3);
  }
  .mobile-section h3 {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
    margin: 0;
    padding: var(--ds-spacing-1) var(--ds-spacing-3);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
  }
  .mobile-section h3 > span {
    margin-left: auto;
  }
  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: var(--ds-spacing-2);
  }
  .home-shortcuts {
    padding: var(--ds-spacing-2);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  .more-shortcuts {
    padding: var(--ds-spacing-2);
  }
  .mobile-navigation :global(.mobile-row),
  .mobile-navigation :global(.mobile-shortcut) {
    width: 100%;
    min-width: 0;
    height: auto;
    min-height: var(--ds-spacing-12);
    justify-content: flex-start;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-2) var(--ds-spacing-3);
    font-weight: var(--ds-font-weight-normal);
    text-align: left;
  }
  .mobile-navigation :global(.mobile-row--preview),
  .mobile-navigation :global(.mobile-row--activity) {
    align-items: flex-start;
    min-height: var(--ds-spacing-20);
    padding-block: var(--ds-spacing-3);
    border-radius: 0;
    border-bottom-color: var(--ds-border);
  }
  .mobile-navigation :global(.mobile-row--compact),
  .mobile-navigation :global(.mobile-shortcut) {
    height: var(--ds-spacing-10);
    min-height: var(--ds-spacing-10);
    padding-block: var(--ds-spacing-1);
    gap: var(--ds-spacing-2);
  }
  :global(.mobile-row--compact) .room-icon {
    width: var(--ds-spacing-5);
    height: var(--ds-spacing-5);
  }
  .room-icon {
    display: grid;
    width: var(--ds-spacing-6);
    height: var(--ds-spacing-6);
    flex: none;
    place-items: center;
    color: var(--ds-foreground-muted);
  }
  .row-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .row-heading:not(.row-heading--dm) .row-name {
    font-weight: var(--ds-font-weight-semibold);
  }
  .row-name--conversation,
  .dm-person-name {
    color: var(--ds-foreground-muted);
    font-weight: var(--ds-font-weight-normal);
  }
  .row-name--conversation[data-unread],
  .dm-person-name[data-unread] {
    color: var(--ds-foreground);
    font-weight: var(--ds-font-weight-medium);
  }
  .row-copy {
    display: flex;
    flex-direction: column;
    gap: var(--ds-spacing-1);
    min-width: 0;
    flex: 1;
  }
  .row-heading {
    display: flex;
    min-width: 0;
    align-items: baseline;
    gap: var(--ds-spacing-2);
  }
  .row-time {
    margin-inline-start: auto;
    flex: none;
  }
  .row-heading--dm {
    align-items: center;
    height: var(--ds-spacing-5);
    line-height: var(--ds-font-line-height-sm);
  }
  .row-meta {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--ds-spacing-2);
    margin-inline-start: auto;
  }
  .row-meta .row-time,
  .mobile-navigation .row-meta :global(.mobile-unread) {
    box-sizing: border-box;
    margin-inline-start: 0;
  }
  .mobile-navigation .row-meta :global(.mobile-unread) {
    height: var(--ds-spacing-4);
    min-width: var(--ds-spacing-4);
    justify-content: center;
    padding-inline: var(--ds-spacing-1);
    border-width: 0;
    line-height: var(--ds-font-line-height-xs);
  }
  .row-time,
  .row-details,
  .activity-context {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    line-height: var(--ds-font-line-height-xs);
  }
  .row-details {
    margin-left: auto;
    flex: none;
    white-space: nowrap;
  }
  .row-preview {
    display: block;
    overflow: hidden;
    color: var(--ds-foreground-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: var(--ds-font-line-height-sm);
  }
  .row-preview--multiline {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .activity-context {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .draft-label {
    color: var(--ds-accent-text);
    font-size: var(--ds-font-size-xs);
  }
  .mobile-navigation :global(.mobile-unread) {
    margin-inline-start: auto;
    flex: none;
    border-color: transparent;
    background: var(--ds-accent-surface-hover);
    color: var(--ds-accent-text);
  }
  .mobile-navigation :global(.mobile-shortcut > .aesir-badge) {
    margin-left: auto;
  }
  .mobile-search-field {
    padding: var(--ds-spacing-3);
  }
  .dm-search-field {
    padding: var(--ds-spacing-2) var(--ds-spacing-3);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  .dm-people {
    padding: var(--ds-spacing-2);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  .dm-people-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-spacing-2);
    padding-inline: var(--ds-spacing-2);
  }
  .dm-people-heading h3 {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
  }
  .dm-people-strip {
    display: flex;
    min-width: 0;
    gap: var(--ds-spacing-1);
    margin: 0;
    padding: var(--ds-spacing-2) var(--ds-spacing-0-5) var(--ds-spacing-0-5);
    overflow-x: auto;
    scrollbar-width: thin;
    list-style: none;
  }
  .dm-people-strip li {
    flex: none;
  }
  .dm-people :global(.dm-person) {
    display: flex;
    flex-direction: column;
    width: var(--ds-spacing-20);
    height: auto;
    min-height: var(--ds-spacing-20);
    gap: var(--ds-spacing-2);
    padding: var(--ds-spacing-2) var(--ds-spacing-1);
    font-size: var(--ds-font-size-xs);
  }
  .dm-person-name {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mobile-search-field :global(.aesir-input__control) {
    min-height: var(--ds-spacing-12);
  }
  .mobile-search-field :global(input) {
    font-size: var(--ds-font-size-base);
  }
  .activity-tools {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    min-width: 0;
    padding: var(--ds-spacing-2);
    gap: var(--ds-spacing-2);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  .activity-tools :global(.activity-filters) {
    width: 100%;
    height: var(--ds-spacing-12);
    flex: none;
    min-width: 0;
  }
  .activity-filter-list {
    width: max-content;
    padding: var(--ds-spacing-1) var(--ds-spacing-1) var(--ds-spacing-3);
  }
  .activity-tools :global(.activity-filter) {
    gap: var(--ds-spacing-1);
    border-radius: var(--ds-radius-full);
    font-size: var(--ds-font-size-xs);
  }
  .activity-tools :global(.activity-filter > svg) {
    width: var(--ds-spacing-3-5);
    height: var(--ds-spacing-3-5);
  }
  .activity-filter-dot {
    flex: none;
    width: var(--ds-spacing-1-5);
    height: var(--ds-spacing-1-5);
    border-radius: var(--ds-radius-full);
    background: var(--ds-accent);
  }
  .activity-tools :global(.activity-filter[data-state='on']) {
    border-color: var(--ds-border);
    background: var(--ds-surface);
    color: var(--ds-foreground);
  }
  .activity-tools :global(.activity-filter[data-state='on']:hover) {
    background: var(--ds-surface-hover);
  }
  .activity-tools :global(.activity-clear) {
    flex: none;
    height: var(--ds-spacing-10);
  }
  .activity-reactions {
    line-height: var(--ds-font-line-height-sm);
    font-size: var(--ds-font-size-xs);
  }
  .unread-dot {
    width: var(--ds-spacing-2);
    height: var(--ds-spacing-2);
    margin-top: var(--ds-spacing-1);
    border-radius: var(--ds-radius-full);
    background: var(--ds-accent);
    flex: none;
  }
  .mobile-empty {
    display: grid;
    place-items: center;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-12) var(--ds-spacing-5);
    text-align: center;
    color: var(--ds-foreground-muted);
  }
  .mobile-empty h3,
  .mobile-empty p {
    margin: 0;
  }
  .mobile-empty h3 {
    color: var(--ds-foreground);
    font-size: var(--ds-font-size-base);
  }
  .mobile-empty p {
    font-size: var(--ds-font-size-sm);
  }
  .mobile-tabbar {
    display: grid;
    flex: none;
    grid-template-columns: minmax(0, 1fr) var(--ds-spacing-12);
    align-items: center;
    gap: var(--ds-spacing-2);
    padding: var(--ds-spacing-1) var(--ds-spacing-2) max(var(--ds-spacing-2), env(safe-area-inset-bottom, 0px));
    background: var(--ds-background);
  }
  .mobile-tab-pill {
    box-sizing: border-box;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    min-width: 0;
    height: var(--ds-spacing-12);
    gap: var(--ds-spacing-0-5);
    padding: var(--ds-spacing-px);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-full);
    background: var(--ds-surface);
    box-shadow: var(--ds-filter-drop-shadow-sm);
  }
  .mobile-tabbar :global(.mobile-tab) {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
    height: 100%;
    min-height: calc(var(--ds-spacing-12) - var(--ds-spacing-1));
    gap: var(--ds-spacing-0-5);
    padding: var(--ds-spacing-0-5);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
  }
  .mobile-tabbar :global(.mobile-tab[aria-current='page']) {
    color: var(--ds-foreground);
    background: var(--ds-surface-active);
  }
  .mobile-tabbar :global(.mobile-search-tab) {
    height: var(--ds-spacing-12);
    border-color: var(--ds-border);
    background: var(--ds-surface);
    box-shadow: var(--ds-filter-drop-shadow-sm);
    color: var(--ds-foreground);
  }
  .mobile-tabbar :global(.mobile-tab svg) {
    width: var(--ds-spacing-4);
    height: var(--ds-spacing-4);
  }
  .mobile-tabbar :global(.mobile-search-tab:hover) {
    background: var(--ds-surface-hover);
  }
  .mobile-tabbar :global(.mobile-search-tab[aria-current='page']) {
    background: var(--ds-surface-active);
  }
  .tab-icon {
    position: relative;
    display: grid;
    place-items: center;
  }
  .tab-dot {
    position: absolute;
    top: 0;
    right: calc(-1 * var(--ds-spacing-1));
    width: var(--ds-spacing-1-5);
    height: var(--ds-spacing-1-5);
    border-radius: var(--ds-radius-full);
    background: var(--ds-accent);
    box-shadow: 0 0 0 var(--ds-spacing-0-5) var(--ds-surface);
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
