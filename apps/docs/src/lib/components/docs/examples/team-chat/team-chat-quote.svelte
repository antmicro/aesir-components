<script>
  import { AesirButton } from '@aesir/svelte';
  import TeamChatAvatar from './team-chat-avatar.svelte';
  import { plainChatText } from './team-chat-formatting.js';
  let { message, person, label = 'Replying to', showText = true, expanded = false, onprofile, onmessage, onclick } = $props();
</script>

<div class="chat-quote" class:chat-quote--expanded={expanded}>
  <span class="chat-quote__author"><TeamChatAvatar {person} size="xs" preview onclick={onprofile} {onmessage} /></span>
  <AesirButton variant="ghost" width="full" class="chat-quote__button" aria-label={`Go to message from ${person.name}: ${plainChatText(message.text)}`} {onclick} />
  <div class="chat-quote__content">
    <span class="chat-quote__heading">
      {label}
      {#if onprofile}<AesirButton class="chat-quote__name" variant="ghost" aria-label={`View ${person.name}'s profile`} onclick={onprofile}><strong>{person.name}</strong></AesirButton>{:else}<strong>
          {person.name}
        </strong>{/if}
      <time>{message.time}</time>
    </span>
    {#if showText}<span class="chat-quote__text">{plainChatText(message.text)}</span>{/if}
  </div>
</div>

<style>
  .chat-quote {
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    min-width: 0;
    gap: var(--ds-spacing-2);
    margin-block: var(--ds-spacing-2);
    padding: var(--ds-spacing-2) var(--ds-spacing-3);
    border-left: var(--ds-spacing-1) solid var(--ds-border-active);
    border-radius: var(--ds-radius-sm);
    background: var(--ds-background-secondary);
  }
  .chat-quote:hover,
  .chat-quote:has(:focus-visible) {
    background: var(--ds-surface-hover);
  }
  .chat-quote :global(.chat-quote__button:hover),
  .chat-quote :global(.chat-quote__button:active),
  .chat-quote :global(.chat-avatar-trigger:hover),
  .chat-quote :global(.chat-avatar-trigger:active) {
    background: transparent;
  }
  .chat-quote :global(.chat-quote__button) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    padding: 0;
  }
  .chat-quote__content {
    position: relative;
    pointer-events: none;
    display: flex;
    height: auto;
    min-width: 0;
    align-items: stretch;
    flex-direction: column;
    gap: var(--ds-spacing-1);
    padding: 0;
    border-radius: var(--ds-radius-sm);
    font-weight: var(--ds-font-weight-normal);
    line-height: var(--ds-font-line-height-sm);
    text-align: start;
    white-space: normal;
  }
  .chat-quote__heading {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--ds-spacing-1);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .chat-quote__author {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
  }
  .chat-quote__heading strong,
  .chat-quote :global(.chat-quote__name.aesir-button) {
    color: var(--ds-foreground);
    font-weight: var(--ds-font-weight-medium);
  }
  .chat-quote :global(.chat-quote__name.aesir-button) {
    pointer-events: auto;
    height: auto;
    min-width: 0;
    padding: 0;
    font-size: inherit;
    line-height: inherit;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  @media (hover: hover) {
    .chat-quote :global(.chat-quote__name:hover) {
      background: transparent;
      text-decoration: underline;
      text-underline-offset: var(--ds-spacing-0-5);
    }
  }
  .chat-quote__heading time {
    margin-inline-start: var(--ds-spacing-1);
  }
  .chat-quote__text {
    display: -webkit-box;
    color: var(--ds-foreground-muted);
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
    font-size: var(--ds-font-size-sm);
  }
  .chat-quote--expanded .chat-quote__text {
    display: block;
    -webkit-line-clamp: unset;
    line-clamp: unset;
  }
</style>
