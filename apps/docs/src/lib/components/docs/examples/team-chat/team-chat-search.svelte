<script>
  import { tick } from 'svelte';
  import { AesirCommandMenu, AesirIcon } from '@aesir/svelte';
  import Hash from '@lucide/svelte/icons/hash';
  import Users from '@lucide/svelte/icons/users';
  import TeamChatAvatar from './team-chat-avatar.svelte';
  import TeamChatSearchHighlight from './team-chat-search-highlight.svelte';
  import { chatSearchPreview } from './team-chat-search-model.js';
  import { presenceLabels } from './team-chat-demo.js';
  import { plainChatText } from './team-chat-formatting.js';

  let { open = $bindable(false), rooms, messages, people, accent, onconversation, onperson, onmessage } = $props();
  let query = $state('');

  function readQuery(event) {
    if (event.target instanceof HTMLInputElement && event.target.getAttribute('role') === 'combobox') query = event.target.value;
  }

  const results = $derived([
    ...rooms.map((room) => {
      const person = room.type === 'direct' ? people[room.members.find((id) => id !== 'you')] : undefined;
      return {
        id: `conversation:${room.id}`,
        kind: person ? 'person' : room.type === 'group' ? 'group' : 'channel',
        room,
        person,
        label: person ? person.name : room.type === 'channel' ? `# ${room.name}` : room.name,
        description: person ? presenceLabels[person.presence] : `${room.members.length} members`
      };
    }),
    ...Object.entries(people)
      .filter(([id]) => id !== 'you' && !rooms.some((room) => room.type === 'direct' && room.members.includes(id)))
      .map(([id, person]) => ({ id: `person:${id}`, kind: 'person', person, label: person.name, description: presenceLabels[person.presence] })),
    ...messages.map((message) => {
      const room = rooms.find((entry) => entry.id === message.conversation);
      const person = people[message.author];
      return {
        id: `message:${message.id}`,
        kind: 'message',
        room,
        person,
        message,
        label: plainChatText(message.text),
        description: `${person.name} · ${room?.type === 'channel' ? '# ' : ''}${room?.name ?? 'Conversation'} · ${message.time}`,
        keywords: message.code ? [message.code] : []
      };
    })
  ]);
  const resultById = $derived(new Map(results.map((result) => [result.id, result])));
  const groups = $derived(
    [
      ['People', 'person'],
      ['Channels', 'channel'],
      ['Group messages', 'group'],
      ['Messages', 'message']
    ].map(([label, kind]) => ({
      label,
      items: results
        .filter((result) => result.kind === kind)
        .map((result) => ({
          id: result.id,
          label: result.label,
          description: result.description,
          keywords: result.keywords,
          action: () => choose(result)
        }))
    }))
  );

  async function choose(result) {
    // Let the menu close and restore its trigger before moving focus into the conversation.
    await tick();
    if (result.message) onmessage?.(result.message);
    else if (!result.room && result.person) onperson?.(result.person);
    else onconversation?.(result.room.id);
  }
</script>

<AesirCommandMenu
  class="chat-search"
  data-aesir-accent={accent}
  bind:open={
    () => open,
    (next) => {
      open = next;
      if (!next) query = '';
    }
  }
  {groups}
  shortcut={false}
  title="Search"
  label="Search conversations and messages"
  placeholder="Search messages, people, and channels"
  emptyText="No results found."
  showFooter
  oninput={readQuery}
  onfocusin={readQuery}
>
  {#snippet headerMeta({ query })}
    <span class="search-context">{query.trim() ? 'Search results' : 'Messages, people, and channels'}</span>
  {/snippet}
  {#snippet itemContent(item)}
    {@const result = resultById.get(item.id)}
    {#if result}
      <span class="search-result" data-search-kind={result.kind} data-search-result={result.id}>
        {#if result.person}
          <TeamChatAvatar person={result.person} size={result.message ? 'sm' : 'xs'} />
        {:else}
          <span class="search-result__channel"><AesirIcon icon={result.kind === 'group' ? Users : Hash} size={16} /></span>
        {/if}
        <span class="search-result__copy">
          {#if result.message}
            <span class="search-result__heading">
              <span class="search-result__name"><TeamChatSearchHighlight text={result.person.name} {query} /></span>
              {#if result.room?.type === 'channel' || result.message.author === 'you'}
                <span class="search-result__conversation"><TeamChatSearchHighlight text={`${result.room?.type === 'channel' ? '# ' : 'To '}${result.room?.name ?? 'Conversation'}`} {query} /></span>
              {/if}
              <span class="search-result__time"><TeamChatSearchHighlight text={result.message.time} {query} /></span>
            </span>
            <span class="search-result__preview"><TeamChatSearchHighlight text={chatSearchPreview(`${result.label}${result.message.code ? `\n${result.message.code}` : ''}`, query)} {query} /></span>
          {:else}
            <span class="search-result__name"><TeamChatSearchHighlight text={result.label} {query} /></span>
            <span class="search-result__details"><TeamChatSearchHighlight text={result.description} {query} /></span>
          {/if}
        </span>
      </span>
    {/if}
  {/snippet}
</AesirCommandMenu>

<style>
  :global(.chat-search.aesir-command-menu) {
    width: min(100%, 44rem);
  }
  .search-context {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    text-align: right;
  }
  .search-result {
    display: flex;
    grid-column: 1 / -1;
    align-items: center;
    min-width: 0;
    gap: var(--ds-spacing-3);
    padding-block: var(--ds-spacing-1);
  }
  .search-result[data-search-kind='message'] {
    align-items: flex-start;
  }
  .search-result:not([data-search-kind='message']) {
    gap: var(--ds-spacing-2);
    padding-block: 0;
  }
  :global(.chat-search .aesir-command-menu__group > [role='option']:has(.search-result:not([data-search-kind='message']))) {
    box-sizing: border-box;
    height: var(--ds-spacing-9);
    min-height: var(--ds-spacing-9);
    padding: var(--ds-spacing-1) var(--ds-spacing-2);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
  }
  .search-result__channel {
    display: grid;
    flex: none;
    width: var(--ds-spacing-6);
    height: var(--ds-spacing-6);
    place-items: center;
    color: var(--ds-foreground-muted);
  }
  .search-result__copy {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    gap: var(--ds-spacing-0-5);
  }
  .search-result:not([data-search-kind='message']) .search-result__copy {
    flex-direction: row;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
  .search-result__heading {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--ds-spacing-1) var(--ds-spacing-2);
    min-width: 0;
  }
  .search-result__name {
    min-width: 0;
    overflow: hidden;
    font-weight: var(--ds-font-weight-medium);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .search-result__conversation {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .search-result__details,
  .search-result__conversation,
  .search-result__time {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .search-result__time {
    flex: none;
    margin-left: auto;
  }
  .search-result__details {
    flex: none;
    margin-left: auto;
    white-space: nowrap;
  }
  .search-result__preview {
    display: -webkit-box;
    overflow: hidden;
    overflow-wrap: anywhere;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    line-height: var(--ds-font-line-height-sm);
  }
  @media (pointer: coarse) {
    :global(.chat-search .aesir-command-menu__group > [role='option']:has(.search-result:not([data-search-kind='message']))) {
      height: var(--ds-spacing-12);
      min-height: var(--ds-spacing-12);
    }
  }
</style>
