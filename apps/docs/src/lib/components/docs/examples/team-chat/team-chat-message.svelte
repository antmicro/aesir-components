<script>
  import { tick } from 'svelte';
  import { AesirButton, AesirDropdown, AesirIcon, AesirTooltip } from '@aesir/svelte';
  import TeamChatComposer from './team-chat-composer.svelte';
  import TeamChatAvatar from './team-chat-avatar.svelte';
  import TeamChatEmojiPicker from './team-chat-emoji-picker.svelte';
  import TeamChatQuote from './team-chat-quote.svelte';
  import TeamChatText from './team-chat-text.svelte';
  import Pin from '@lucide/svelte/icons/pin';
  import PinOff from '@lucide/svelte/icons/pin-off';
  import Bookmark from '@lucide/svelte/icons/bookmark';
  import BookmarkCheck from '@lucide/svelte/icons/bookmark-check';
  import MessageCircle from '@lucide/svelte/icons/message-circle';
  import Forward from '@lucide/svelte/icons/forward';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  let {
    message,
    person,
    quotedMessage,
    quotedPerson,
    highlighted = false,
    editing = false,
    editValue = $bindable(''),
    people = [],
    showTimestamps = true,
    sendWith = 'enter',
    mobile = false,
    onprofile,
    onquotedprofile,
    onmessage,
    onquotedmessage,
    onreply,
    onforward,
    onquote,
    onreaction,
    onsave,
    onpin,
    onedit,
    ondelete,
    oncancelEdit,
    onupdate
  } = $props();
  const ownActions = [{ value: 'edit', label: 'Edit message' }, { type: 'separator' }, { value: 'delete', label: 'Delete message', variant: 'destructive' }];
  const pinActions = $derived(onpin ? [{ value: 'pin', label: message.pinned ? 'Unpin message' : 'Pin message' }] : []);
  const desktopActions = $derived([...pinActions, ...(message.author === 'you' ? [...(pinActions.length ? [{ type: 'separator' }] : []), ...ownActions] : [])]);
  const mobileActions = $derived([
    { value: 'reply', label: 'Reply' },
    { value: 'forward', label: 'Forward' },
    { value: 'save', label: message.saved ? 'Remove from saved messages' : 'Save message' },
    ...pinActions,
    ...(message.author === 'you' ? [{ type: 'separator' }, ...ownActions] : [])
  ]);
  const actionIcons = $derived({ reply: MessageCircle, forward: Forward, save: Bookmark, pin: message.pinned ? PinOff : Pin, edit: Pencil, delete: Trash2 });
  async function selectAction(item) {
    await tick();
    if (item.value === 'edit') onedit?.();
    else if (item.value === 'delete') ondelete?.();
    else if (item.value === 'reply') onreply?.();
    else if (item.value === 'forward') onforward?.();
    else if (item.value === 'save') onsave?.();
    else if (item.value === 'pin') onpin?.();
  }
</script>

<article class="chat-message" class:is-highlighted={highlighted} data-mobile={mobile || undefined} aria-label={`Message from ${person.name} at ${message.time}`}>
  <TeamChatAvatar {person} size="default" preview onclick={onprofile} {onmessage} />
  <div class="chat-message__body">
    <header>
      {#if onprofile}<AesirButton class="chat-message__author" variant="ghost" aria-label={`View ${person.name}'s profile`} onclick={onprofile}>{person.name}</AesirButton>{:else}<span
          class="chat-message__author"
        >
          {person.name}
        </span>{/if}
      {#if showTimestamps}<time>{message.time}</time>{/if}
      {#if message.editedAt}<span class="chat-message__edited">(edited)</span>{/if}
      {#if message.pinned}<span class="chat-message__pinned"><AesirIcon icon={Pin} size={11} /> Pinned</span>{/if}
      {#if mobile && !editing}<div class="mobile-message-actions">
          <TeamChatEmojiPicker label={`React to message from ${person.name}`} align="end" onselect={(emoji) => onreaction?.(emoji)} />
          <AesirDropdown items={mobileActions} label="Message options" align="end" onselect={selectAction}>
            {#snippet trigger(props)}<AesirButton {...props} variant="ghost" size="icon" aria-label="More message options"><AesirIcon icon={Ellipsis} size={19} /></AesirButton>{/snippet}
            {#snippet itemContent({ item })}<AesirIcon icon={actionIcons[item.value]} size={17} />
              <span>{item.label}</span>{/snippet}
          </AesirDropdown>
        </div>{/if}
    </header>
    {#if quotedMessage && quotedPerson}
      <TeamChatQuote
        message={quotedMessage}
        person={quotedPerson}
        label={message.forwardOfId ? 'Forwarded from' : 'Replying to'}
        showText={!message.forwardOfId}
        onprofile={onquotedprofile}
        onmessage={onquotedmessage}
        onclick={onquote}
      />
    {:else if message.forwardOfId || message.replyToId}
      <span class="chat-message__unavailable">Original message unavailable</span>
    {/if}
    {#if editing}
      <div class="chat-message__editor">
        <TeamChatComposer bind:value={editValue} label="Edit your message" {people} {sendWith} {mobile} sendLabel="Save changes" onsend={onupdate} oncancel={oncancelEdit} />
      </div>
    {:else}<TeamChatText text={message.text} />{/if}
    {#if message.code}<pre><code>{message.code}</code></pre>{/if}
    {#if message.reactions?.length}
      <div class="chat-message__reactions" aria-label="Reactions">
        {#each message.reactions as reaction (reaction.emoji)}
          <AesirButton
            class="chat-reaction"
            size="sm"
            variant="outline"
            aria-pressed={reaction.active}
            aria-label={`${reaction.emoji}, ${reaction.count} reactions${reaction.active ? ', including you' : ''}`}
            onclick={() => onreaction?.(reaction.emoji)}
          >
            {reaction.emoji}
            <span>{reaction.count}</span>
          </AesirButton>
        {/each}
        <TeamChatEmojiPicker reaction label={`Add reaction to message from ${person.name}`} onselect={(emoji) => onreaction?.(emoji)} />
      </div>
    {/if}
  </div>
  {#if !editing && !mobile}<div class="chat-message__actions">
      <TeamChatEmojiPicker label={`React to message from ${person.name}`} align="end" onselect={(emoji) => onreaction?.(emoji)} />
      <AesirTooltip content="Reply" contentStyle="width: max-content; max-width: calc(100vw - var(--ds-spacing-4)); white-space: nowrap;">
        {#snippet trigger(props)}
          <AesirButton
            {...props}
            variant="ghost"
            size="icon-sm"
            aria-label={`Reply to ${person.name}`}
            onclick={(event) => {
              props.onclick();
              onreply?.(event);
            }}
          >
            <AesirIcon icon={MessageCircle} size={16} />
          </AesirButton>
        {/snippet}
      </AesirTooltip>
      <AesirTooltip content="Forward" contentStyle="width: max-content; max-width: calc(100vw - var(--ds-spacing-4)); white-space: nowrap;">
        {#snippet trigger(props)}
          <AesirButton
            {...props}
            variant="ghost"
            size="icon-sm"
            aria-label={`Forward message from ${person.name}`}
            onclick={(event) => {
              props.onclick();
              onforward?.(event);
            }}
          >
            <AesirIcon icon={Forward} size={16} />
          </AesirButton>
        {/snippet}
      </AesirTooltip>
      <AesirButton variant="ghost" size="icon-sm" aria-label={message.saved ? 'Remove from saved messages' : 'Save message'} aria-pressed={Boolean(message.saved)} onclick={onsave}>
        <AesirIcon icon={message.saved ? BookmarkCheck : Bookmark} size={15} />
      </AesirButton>
      {#if desktopActions.length}
        <AesirDropdown items={desktopActions} label={message.author === 'you' ? 'Your message options' : 'Message options'} align="end" onselect={selectAction}>
          {#snippet trigger(props)}<AesirButton {...props} variant="ghost" size="icon-sm" aria-label="More message options"><AesirIcon icon={Ellipsis} size={16} /></AesirButton>{/snippet}
          {#snippet itemContent({ item })}<AesirIcon icon={actionIcons[item.value]} size={15} />
            <span>{item.label}</span>{/snippet}
        </AesirDropdown>
      {/if}
    </div>{/if}
</article>

<style>
  .mobile-message-actions {
    display: flex;
    align-items: center;
    margin-left: auto;
  }
  .chat-message[data-mobile] header {
    gap: var(--ds-spacing-1-5);
  }
  .mobile-message-actions :global(button) {
    min-width: var(--ds-spacing-12);
    min-height: var(--ds-spacing-12);
  }
  .chat-message__editor {
    margin-top: var(--ds-spacing-2);
  }
  .chat-message {
    position: relative;
    display: grid;
    grid-template-columns: var(--ds-spacing-10) minmax(0, 1fr);
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-3) var(--ds-spacing-5);
    background: var(--ds-background);
    transition: background-color var(--ds-motion-duration-instant) var(--ds-motion-easing-subtle);
  }
  .chat-message:focus-within:where(:not(:has(:global(.chat-quote:hover), :global(.chat-quote:focus-within)))) {
    background: var(--ds-surface);
  }
  @media (hover: hover) and (pointer: fine) {
    .chat-message:hover:where(:not(:has(:global(.chat-quote:hover)))) {
      background: var(--ds-surface);
    }
  }
  .chat-message.is-highlighted {
    background: var(--ds-accent-surface);
  }
  .chat-message__body {
    min-width: 0;
  }
  .chat-message header {
    display: flex;
    min-height: var(--ds-spacing-5);
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
  .chat-message :global(.chat-message__author) {
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
  }
  .chat-message :global(button.chat-message__author) {
    height: auto;
    min-width: 0;
    flex-shrink: 1;
    padding: 0;
    border-radius: var(--ds-radius-sm);
    color: var(--ds-foreground);
    background: transparent;
    line-height: var(--ds-font-line-height-sm);
    text-align: left;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .chat-message :global(button.chat-message__author:hover) {
    text-decoration: underline;
    text-underline-offset: var(--ds-spacing-0-5);
  }
  .chat-message time,
  .chat-message__edited,
  .chat-message__pinned {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .chat-message__pinned {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-spacing-1);
  }
  .chat-message pre {
    max-width: 100%;
    overflow: auto;
    margin: var(--ds-spacing-2) 0 0;
    padding: var(--ds-spacing-3);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    background: var(--ds-background-secondary);
    font-size: var(--ds-font-size-xs);
  }
  .chat-message__reactions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--ds-spacing-1);
    margin-top: var(--ds-spacing-2);
  }
  .chat-message :global(.chat-reaction) {
    height: var(--ds-spacing-6);
    border-radius: var(--ds-radius-full);
    padding-inline: var(--ds-spacing-2);
    gap: var(--ds-spacing-1-5);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-normal);
  }
  .chat-message :global(.chat-reaction[aria-pressed='true']) {
    border-color: var(--ds-accent-border);
    background: var(--ds-accent-surface);
    color: var(--ds-accent-text);
  }
  .chat-message__unavailable {
    display: block;
    margin-top: var(--ds-spacing-2);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .chat-message__actions {
    position: absolute;
    top: 0;
    right: var(--ds-spacing-3);
    z-index: 1;
    display: flex;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    background: var(--ds-background);
    opacity: 0;
    pointer-events: none;
    transform: translateY(-50%);
  }
  .chat-message:hover .chat-message__actions,
  .chat-message:has(:global([aria-expanded='true'])) .chat-message__actions,
  .chat-message:focus-within .chat-message__actions {
    opacity: 1;
    pointer-events: auto;
  }
  @media (hover: none) {
    .chat-message__actions {
      opacity: 1;
      pointer-events: auto;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .chat-message {
      transition: none;
    }
  }
  @container (max-width: 28rem) {
    .chat-message {
      padding-inline: var(--ds-spacing-3);
      gap: var(--ds-spacing-2);
    }
    .chat-message__actions {
      position: static;
      grid-column: 2;
      width: fit-content;
      opacity: 1;
      pointer-events: auto;
      transform: none;
    }
  }
</style>
