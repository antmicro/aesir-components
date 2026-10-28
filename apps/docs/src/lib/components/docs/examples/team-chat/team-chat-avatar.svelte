<script>
  import { AesirAvatar, AesirButton, AesirHoverCard, AesirIcon } from '@aesir/svelte';
  import Clock from '@lucide/svelte/icons/clock';
  import MessageCircle from '@lucide/svelte/icons/message-circle';
  import { presenceLabels } from './team-chat-demo.js';

  let { person, size = 'sm', onclick, preview = false, onmessage } = $props();
  let open = $state(false);
  let now = $state(Date.now());
  const presenceLabel = $derived(presenceLabels[person.presence]);
  const localTime = $derived(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: person.timezone ?? 'UTC' }).format(now));

  function observePreview() {
    now = Date.now();
    const timer = setInterval(() => (now = Date.now()), 60_000);
    return () => clearInterval(timer);
  }
</script>

{#snippet avatar()}
  <span class="chat-avatar" title={preview ? undefined : presenceLabel}>
    <AesirAvatar gradient {size} aria-label={`${person.name}${presenceLabel ? ` · ${presenceLabel}` : ''}`} />
    {#if presenceLabel}<span class="chat-avatar__presence" data-presence={person.presence} aria-hidden="true"></span>{/if}
  </span>
{/snippet}

{#snippet triggerButton(props = {})}
  <AesirButton
    {...props}
    class="chat-avatar-trigger"
    variant="ghost"
    aria-label={`View ${person.name}'s profile`}
    onclick={(event) => {
      props.onclick?.();
      open = false;
      onclick?.(event);
    }}
  >
    {@render avatar()}
  </AesirButton>
{/snippet}

{#if onclick && preview}
  <AesirHoverCard
    bind:open
    style="align-self: start; flex: none; width: fit-content; height: fit-content;"
    openDelay={350}
    closeDelay={250}
    label={`${person.name}'s preview`}
    contentClass="chat-person-preview"
  >
    {#snippet trigger(props)}{@render triggerButton(props)}{/snippet}
    {#snippet content()}
      <div class="person-preview__identity" {@attach observePreview}>
        <AesirAvatar gradient size="lg" aria-label={`${person.name}${presenceLabel ? ` · ${presenceLabel}` : ''}`} />
        <div>
          <strong>{person.name}</strong>
          {#if person.role}<span>{person.role}</span>{/if}
          <span class="person-preview__availability">
            <i data-presence={person.presence} aria-hidden="true"></i>
            {presenceLabel}
          </span>
          {#if person.status}<span>{person.status}</span>{/if}
        </div>
      </div>
      <div class="person-preview__details">
        <span class="person-preview__time"><AesirIcon icon={Clock} size={16} />{localTime} local time</span>
        {#if onmessage}
          <AesirButton
            variant="outline"
            size="sm"
            width="full"
            onclick={() => {
              open = false;
              onmessage();
            }}
          >
            <AesirIcon icon={MessageCircle} size={16} />Message
          </AesirButton>
        {/if}
      </div>
    {/snippet}
  </AesirHoverCard>
{:else if onclick}
  {@render triggerButton()}
{:else}
  {@render avatar()}
{/if}

<style>
  :global(.chat-person-preview.aesir-hover-card) {
    box-sizing: border-box;
    width: min(20rem, calc(100vw - var(--ds-spacing-8)));
    padding: 0;
    z-index: var(--aesir-overlay-z-popover);
  }
  .person-preview__identity {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-4);
  }
  .person-preview__identity > div {
    display: grid;
    min-width: 0;
    gap: var(--ds-spacing-1);
    overflow-wrap: anywhere;
  }
  .person-preview__identity strong {
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-semibold);
  }
  .person-preview__identity span,
  .person-preview__time {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }
  .person-preview__details {
    display: grid;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-4);
    border-top: var(--ds-spacing-px) solid var(--ds-border);
  }
  .person-preview__availability,
  .person-preview__time {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
  .person-preview__availability i {
    width: var(--ds-spacing-2);
    height: var(--ds-spacing-2);
    flex: none;
    border-radius: var(--ds-radius-full);
    background: var(--ds-foreground-muted);
  }
  .person-preview__availability i[data-presence='online'] {
    background: var(--ds-emphasis-green);
  }
  .person-preview__availability i[data-presence='away'] {
    background: var(--ds-emphasis-yellow);
  }
  :global(.chat-avatar-trigger.aesir-button) {
    width: fit-content;
    height: fit-content;
    align-self: start;
    flex: none;
    padding: 0;
    border-radius: var(--ds-radius-full);
  }
  .chat-avatar {
    position: relative;
    display: inline-flex;
    width: fit-content;
    height: fit-content;
    flex: none;
  }
  .chat-avatar__presence {
    position: absolute;
    right: 0;
    bottom: 0;
    width: var(--ds-spacing-2);
    height: var(--ds-spacing-2);
    border: var(--ds-spacing-0-5) solid var(--ds-background);
    border-radius: var(--ds-radius-full);
    background: var(--ds-foreground-muted);
  }
  .chat-avatar__presence[data-presence='online'] {
    background: var(--ds-emphasis-green);
  }
  .chat-avatar__presence[data-presence='away'] {
    background: var(--ds-emphasis-yellow);
  }
</style>
