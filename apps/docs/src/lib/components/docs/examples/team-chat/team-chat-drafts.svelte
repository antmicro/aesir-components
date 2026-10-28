<script>
  import { AesirBadge, AesirButton, AesirIcon, AesirScrollArea } from '@aesir/svelte';
  import FilePenLine from '@lucide/svelte/icons/file-pen-line';
  import Hash from '@lucide/svelte/icons/hash';
  import SquarePen from '@lucide/svelte/icons/square-pen';
  import TeamChatAvatar from './team-chat-avatar.svelte';
  import { plainChatText } from './team-chat-formatting.js';

  let { entries, people, mobile = false, onresume, onnewmessage } = $props();
  function destination(entry) {
    if (entry.room) return `${entry.room.type === 'channel' ? '# ' : ''}${entry.room.name}`;
    return entry.recipients.length ? entry.recipients.map((id) => people[id].name).join(', ') : 'New message';
  }
</script>

<div class="drafts-view" data-mobile={mobile || undefined}>
  <div class="drafts-toolbar">
    <span>{entries.length} {entries.length === 1 ? 'draft' : 'drafts'}</span>
    <AesirButton class="drafts-new-message" variant="outline" size={mobile ? 'default' : 'sm'} onclick={onnewmessage}><AesirIcon icon={SquarePen} size={16} />New message</AesirButton>
  </div>
  <AesirScrollArea class="drafts-scroll" label="Draft messages">
    <div class="drafts-list">
      {#each entries as entry (entry.id)}
        {@const label = destination(entry)}
        {@const recipients = entry.recipients ?? entry.room.members.filter((id) => id !== 'you')}
        <AesirButton class="draft-row" variant="ghost" width="full" aria-label={`Resume draft to ${label}`} data-draft-id={entry.id} onclick={() => onresume?.(entry.id)}>
          <span class="draft-leading" aria-hidden="true">
            {#if entry.room?.type === 'channel'}<AesirIcon icon={Hash} size={22} />
            {:else if recipients.length}<span class="draft-avatar-stack">
                {#each recipients.slice(0, 3) as id (id)}<TeamChatAvatar person={people[id]} size="xs" />{/each}
              </span>
            {:else}<AesirIcon icon={SquarePen} size={22} />{/if}
          </span>
          <span class="draft-copy">
            <span class="draft-heading">
              <strong>{label}</strong>
              <AesirBadge variant="secondary">Draft</AesirBadge>
            </span>
            {#if entry.reply}<span class="draft-reply">
                <TeamChatAvatar person={people[entry.reply.author]} size="2xs" />
                <span>Replying to {people[entry.reply.author].name}: {plainChatText(entry.reply.text)}</span>
              </span>{/if}
            <span class="draft-preview">{entry.text.trim() ? plainChatText(entry.text) : entry.reply ? 'Write your reply…' : 'Start your message…'}</span>
            {#if !entry.room}<span class="draft-context">New conversation</span>{/if}
          </span>
        </AesirButton>
      {:else}
        <div class="drafts-empty">
          <AesirIcon icon={FilePenLine} size={28} />
          <h3>No drafts yet</h3>
          <p>Messages you leave unfinished will appear here.</p>
        </div>
      {/each}
    </div>
  </AesirScrollArea>
</div>

<style>
  .drafts-view {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
  .drafts-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-3) var(--ds-spacing-4);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }
  .drafts-view :global(.drafts-scroll) {
    flex: 1;
    min-height: 0;
  }
  .drafts-list {
    padding: var(--ds-spacing-2);
  }
  .drafts-list :global(.draft-row) {
    height: auto;
    min-height: var(--ds-spacing-16);
    align-items: start;
    justify-content: start;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-3);
    text-align: left;
    white-space: normal;
  }
  .draft-leading {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    min-width: var(--ds-spacing-6);
    min-height: var(--ds-spacing-6);
    color: var(--ds-foreground-muted);
  }
  .draft-avatar-stack {
    display: inline-flex;
    padding-left: var(--ds-spacing-2);
  }
  .draft-avatar-stack :global(.chat-avatar) {
    margin-left: calc(-1 * var(--ds-spacing-2));
    box-shadow: 0 0 0 var(--ds-spacing-px) var(--ds-background);
    border-radius: var(--ds-radius-full);
  }
  .draft-copy {
    display: grid;
    flex: 1;
    min-width: 0;
    gap: var(--ds-spacing-2);
    line-height: var(--ds-font-line-height-sm);
  }
  .draft-heading {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
    min-width: 0;
  }
  .draft-heading strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: var(--ds-font-weight-semibold);
  }
  .draft-preview {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    overflow-wrap: anywhere;
    white-space: pre-line;
  }
  .draft-reply {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
    padding-left: var(--ds-spacing-2);
    border-left: var(--ds-spacing-0-5) solid var(--ds-border);
    color: var(--ds-foreground-muted);
  }
  .draft-reply > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .draft-context {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .drafts-empty {
    display: grid;
    justify-items: center;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-12) var(--ds-spacing-4);
    text-align: center;
    color: var(--ds-foreground-muted);
  }
  .drafts-empty h3 {
    margin: 0;
    color: var(--ds-foreground);
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-semibold);
  }
  .drafts-empty p {
    margin: 0;
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
  }
  .drafts-view[data-mobile] :global(.drafts-new-message) {
    min-height: var(--ds-spacing-12);
  }
</style>
