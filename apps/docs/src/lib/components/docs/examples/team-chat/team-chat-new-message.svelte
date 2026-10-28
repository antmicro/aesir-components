<script>
  import { tick } from 'svelte';
  import { AesirButton, AesirIcon, AesirInput, AesirPopover, AesirScrollArea } from '@aesir/svelte';
  import Hash from '@lucide/svelte/icons/hash';
  import X from '@lucide/svelte/icons/x';
  import TeamChatAvatar from './team-chat-avatar.svelte';
  import TeamChatComposer from './team-chat-composer.svelte';
  import TeamChatPersonOption from './team-chat-person-option.svelte';
  let { people, rooms, recipients = $bindable([]), value = $bindable(''), sendWith = 'enter', mobile = false, onchannel, onsend } = $props();
  let query = $state('');
  let pickerOpen = $state(false);
  let optionsRef = $state();
  let root;
  const terms = $derived(query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean));
  const matches = (text) => terms.every((term) => text.toLocaleLowerCase().includes(term));
  const matchingPeople = $derived(Object.keys(people).filter((id) => id !== 'you' && matches(people[id].name)));
  const channels = $derived(rooms.filter((room) => room.type === 'channel' && matches(`#${room.name}`)));

  function attachRoot(node) {
    root = node;
    return () => {
      root = undefined;
    };
  }
  async function toggleRecipient(id, checked) {
    recipients = checked ? [...new Set([...recipients, id])] : recipients.filter((entry) => entry !== id);
    query = '';
    await tick();
    root?.querySelector('[aria-label="Choose people or a channel"]')?.focus();
  }
  function dismissPicker(event) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    query = '';
    root?.querySelector('[aria-label="Choose people or a channel"]')?.focus();
    pickerOpen = false;
  }
  function leavePicker(event) {
    const next = event.relatedTarget;
    if (root?.querySelector('.recipient-controls')?.contains(next) || optionsRef?.contains(next)) return;
    pickerOpen = false;
  }
  async function searchKeydown(event) {
    if (event.isComposing) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!pickerOpen) {
        pickerOpen = true;
        await tick();
      }
      optionsRef?.querySelector('input, button')?.focus();
    } else if (event.key === 'Enter' && query.trim()) {
      event.preventDefault();
      const personId = matchingPeople.find((id) => !recipients.includes(id));
      if (personId) void toggleRecipient(personId, true);
      else if (channels.length) onchannel?.(channels[0].id);
    } else if (event.key === 'Backspace' && !query && recipients.length) {
      event.preventDefault();
      recipients = recipients.slice(0, -1);
    } else if (event.key === 'Escape') dismissPicker(event);
  }
</script>

<svelte:document
  onkeydowncapture={(event) => {
    if (pickerOpen && optionsRef?.contains(event.target)) dismissPicker(event);
  }}
/>

<div class="new-message" data-mobile={mobile || undefined} {@attach attachRoot}>
  <div class="new-message-recipients">
    <span class="recipient-label">To</span>
    <div class="recipient-controls">
      {#if recipients.length}
        <div class="recipient-chips" aria-label="Selected recipients">
          {#each recipients as id (id)}
            <AesirButton class="recipient-chip" variant="secondary" size="sm" aria-label={`Remove ${people[id].name} from recipients`} onclick={() => toggleRecipient(id, false)}>
              <TeamChatAvatar person={people[id]} size="2xs" />
              <span class="recipient-chip-name">{people[id].name}</span>
              <AesirIcon icon={X} size={13} />
            </AesirButton>
          {/each}
        </div>
      {/if}
      <AesirPopover class="recipient-picker" bind:open={pickerOpen} placement="bottom" align="start" contentClass="new-message-recipient-popover">
        {#snippet trigger()}
          <AesirInput
            aria-label="Choose people or a channel"
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
            placeholder={recipients.length ? 'Add another person or find a channel…' : 'Find people or a channel…'}
            bind:value={query}
            onfocus={() => (pickerOpen = true)}
            onclick={() => (pickerOpen = true)}
            oninput={() => (pickerOpen = true)}
            onblur={leavePicker}
            onkeydown={searchKeydown}
            autocomplete="off"
          />
        {/snippet}
        {#snippet content()}
          <AesirScrollArea class="new-message-options" bind:ref={optionsRef} label="People and channels">
            <div class="recipient-results" onfocusout={leavePicker}>
              <fieldset>
                <legend>People</legend>
                {#each matchingPeople as id (id)}
                  <TeamChatPersonOption person={people[id]} compact showRole={false} checked={recipients.includes(id)} onchange={(event) => toggleRecipient(id, event.currentTarget.checked)} />
                {:else}<p>No people match your search.</p>{/each}
              </fieldset>
              <section aria-label="Channels">
                <h3>Channels</h3>
                {#each channels as channel (channel.id)}
                  <AesirButton class="new-message-channel" variant="ghost" size="sm" width="full" aria-label={`Open #${channel.name}`} onclick={() => onchannel?.(channel.id)}>
                    <AesirIcon icon={Hash} size={16} />
                    <span class="recipient-channel-name">{channel.name}</span>
                  </AesirButton>
                {:else}<p>No channels match your search.</p>{/each}
              </section>
            </div>
          </AesirScrollArea>
        {/snippet}
      </AesirPopover>
    </div>
  </div>
  <div class="conversation-composer">
    <TeamChatComposer
      {mobile}
      bind:value
      {sendWith}
      sendDisabled={!recipients.length}
      label="New message"
      placeholder="Write a message…"
      people={Object.values(people).filter((person) => person !== people.you)}
      {onsend}
    />
  </div>
</div>

<style>
  .new-message[data-mobile] :global(.aesir-input__control) {
    min-height: var(--ds-spacing-12);
  }
  .new-message[data-mobile] :global(.aesir-input input) {
    font-size: var(--ds-font-size-base);
  }
  .new-message {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
  }
  .new-message-recipients {
    display: flex;
    align-items: flex-start;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-4) var(--ds-spacing-5);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  .recipient-label {
    padding-top: var(--ds-spacing-2);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }
  .recipient-controls {
    display: grid;
    gap: var(--ds-spacing-2);
    flex: 1;
    min-width: 0;
  }
  .recipient-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ds-spacing-2);
  }
  .recipient-chips :global(.recipient-chip) {
    height: auto;
    min-height: var(--ds-spacing-8);
    max-width: 100%;
    padding: var(--ds-spacing-1) var(--ds-spacing-2);
  }
  .recipient-chip-name {
    overflow-wrap: anywhere;
    white-space: normal;
    text-align: left;
  }
  .recipient-controls :global(.recipient-picker) {
    display: block;
    min-width: 0;
  }
  :global(.new-message-recipient-popover) {
    display: flex;
    flex-direction: column;
    width: min(calc(100vw - var(--ds-spacing-8)), var(--ds-sizing-md));
    padding: 0;
    overflow: hidden;
  }
  :global(.new-message-recipient-popover .new-message-options) {
    flex: 0 1 auto;
    height: auto;
    max-height: min(var(--ds-sizing-xs), 40dvh);
    min-height: 0;
  }
  :global(.new-message-options > .aesir-scroll-area__viewport) {
    height: auto;
  }
  .recipient-results {
    box-sizing: border-box;
    padding: var(--ds-spacing-2);
  }
  fieldset {
    min-width: 0;
    margin: 0 0 var(--ds-spacing-2);
    padding: 0;
    border: 0;
  }
  legend,
  h3 {
    padding: var(--ds-spacing-1) var(--ds-spacing-2);
    margin: 0;
    font-size: var(--ds-font-size-xs);
    color: var(--ds-foreground-muted);
    font-weight: var(--ds-font-weight-medium);
  }
  p {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }
  .recipient-results :global(.new-message-channel) {
    justify-content: flex-start;
    min-height: var(--ds-spacing-9);
    gap: var(--ds-spacing-2);
    padding-inline: var(--ds-spacing-2);
    font-size: var(--ds-font-size-sm);
  }
  .recipient-channel-name {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .conversation-composer {
    margin-top: auto;
    padding: var(--ds-spacing-3) var(--ds-spacing-5) var(--ds-spacing-4);
  }
  @media (max-width: 480px) {
    .new-message-recipients {
      padding-inline: var(--ds-spacing-3);
    }
    .conversation-composer {
      padding-inline: var(--ds-spacing-3);
    }
  }
  @media (pointer: coarse) {
    .recipient-results :global(.new-message-channel) {
      min-height: var(--ds-spacing-12);
    }
  }
</style>
