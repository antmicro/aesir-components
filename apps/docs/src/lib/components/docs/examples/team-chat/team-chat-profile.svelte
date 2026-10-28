<script>
  import { tick } from 'svelte';
  import { AesirButton, AesirDropdown, AesirIcon, AesirInput, AesirScrollArea } from '@aesir/svelte';
  import MessageSquare from '@lucide/svelte/icons/message-square';
  import Clock from '@lucide/svelte/icons/clock';
  import Mail from '@lucide/svelte/icons/mail';
  import Phone from '@lucide/svelte/icons/phone';
  import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import X from '@lucide/svelte/icons/x';
  import TeamChatAvatar from './team-chat-avatar.svelte';
  import { presenceLabels } from './team-chat-demo.js';

  let { person, self = false, initialEdit = '', onclose, onmessage, onupdate } = $props();
  let publicView = $state(false);
  let editing = $state('');
  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let status = $state('');
  let error = $state('');
  let now = $state(Date.now());
  let editTrigger;
  let panel;
  const canEdit = $derived(self && !publicView);
  const localTime = $derived(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: person?.timezone ?? 'UTC' }).format(now));
  const presence = $derived(person?.presence === 'online' ? 'Active' : presenceLabels[person?.presence]);
  const viewOptions = $derived([
    { value: 'self', label: 'Your view', role: 'menuitemradio', checked: !publicView },
    { value: 'public', label: 'Other members', role: 'menuitemradio', checked: publicView }
  ]);
  const moreOptions = $derived([
    { value: 'online', label: 'Set yourself as active', role: 'menuitemradio', checked: person?.presence === 'online' },
    { value: 'away', label: 'Set yourself as away', role: 'menuitemradio', checked: person?.presence === 'away' },
    ...(person?.status ? [{ type: 'separator' }, { value: 'clear-status', label: 'Clear status' }] : [])
  ]);

  function observeProfile(node) {
    panel = node;
    now = Date.now();
    let cancelled = false;
    void tick().then(() => {
      if (cancelled) return;
      const statusTrigger = node.querySelector('[aria-label="Set a status"]');
      if (initialEdit === 'status' && statusTrigger) void startEdit('status', { currentTarget: statusTrigger });
      else node.querySelector('[aria-label="Close profile"]')?.focus({ preventScroll: true });
    });
    const timer = setInterval(() => (now = Date.now()), 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
      panel = undefined;
    };
  }
  function handlePanelKey(event) {
    if (event.defaultPrevented || event.isComposing || event.key !== 'Escape' || !panel?.contains(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    onclose?.();
  }
  async function startEdit(section, event) {
    editTrigger = event.currentTarget;
    name = person.name;
    email = person.email ?? '';
    phone = person.phone ?? '';
    status = person.status ?? '';
    error = '';
    editing = section;
    await tick();
    editTrigger.closest('.chat-profile')?.querySelector('.profile-edit input')?.focus();
  }
  async function finishEdit() {
    editing = '';
    await tick();
    editTrigger?.focus();
  }
  function saveEdit(event) {
    event.preventDefault();
    if (!canEdit || !event.currentTarget.reportValidity()) return;
    if (editing === 'profile' && !name.trim()) {
      error = 'Enter your name.';
      return;
    }
    const changes = editing === 'profile' ? { name: name.trim() } : editing === 'contact' ? { email: email.trim(), phone: phone.trim() } : { status: status.trim() };
    onupdate?.(changes);
    void finishEdit();
  }
  function handleEditKey(event) {
    if (event.key !== 'Escape' || event.isComposing) return;
    event.preventDefault();
    event.stopPropagation();
    void finishEdit();
  }
</script>

<svelte:document onkeydown={handlePanelKey} />

{#snippet editForm(section)}
  {#if editing === section && canEdit}
    <form class="profile-edit" aria-label={section === 'profile' ? 'Edit profile' : section === 'contact' ? 'Edit contact information' : 'Set a status'} onsubmit={saveEdit}>
      {#if section === 'profile'}
        <AesirInput label="Full name" bind:value={name} required maxlength={80} {error} onkeydown={handleEditKey} />
      {:else if section === 'contact'}
        <AesirInput label="Email Address" type="email" bind:value={email} required maxlength={254} onkeydown={handleEditKey} />
        <AesirInput label="Phone" type="tel" bind:value={phone} maxlength={40} onkeydown={handleEditKey} />
      {:else}
        <AesirInput label="Status" placeholder="What’s your status?" bind:value={status} maxlength={100} onkeydown={handleEditKey} />
      {/if}
      <div class="profile-edit__actions">
        <AesirButton variant="ghost" size="sm" onclick={finishEdit} onkeydown={handleEditKey}>Cancel</AesirButton>
        <AesirButton type="submit" size="sm" onkeydown={handleEditKey}>Save</AesirButton>
      </div>
    </form>
  {/if}
{/snippet}

<aside class="chat-profile-panel" aria-label={`${person.name}'s profile`} {@attach observeProfile}>
  <header class="chat-profile-panel__header">
    <span class="profile-heading">Profile</span>
    <AesirButton variant="ghost" size="icon-sm" aria-label="Close profile" onclick={() => onclose?.()}><AesirIcon icon={X} size={18} /></AesirButton>
  </header>
  <AesirScrollArea class="profile-scroll" label={`${person.name}'s profile details`}>
    <div class="chat-profile">
      <section class="chat-profile__summary" aria-label="Profile details">
        <div class="chat-profile__avatar"><TeamChatAvatar {person} size="lg" /></div>
        <div class="profile-section-heading">
          <h2>{person.name}</h2>
          {#if canEdit}<AesirButton class="profile-edit-link" variant="ghost" size="sm" aria-label="Edit profile" onclick={(event) => startEdit('profile', event)}>Edit</AesirButton>{/if}
        </div>
        {#if person.role}<p class="profile-job">{person.role}</p>{/if}
        {@render editForm('profile')}
        <p class="profile-detail">
          <span class="profile-presence" data-presence={person.presence} aria-hidden="true"></span>
          {presence}
        </p>
        {#if person.status}<p class="profile-status">{person.status}</p>{/if}
        <p class="profile-detail">
          <AesirIcon icon={Clock} size={18} />
          <span>
            <time>{localTime}</time>
            local time
          </span>
        </p>
        {#if publicView}<p class="profile-view-note" role="status">This is how other members see your profile.</p>{/if}
        <div class="profile-actions">
          {#if canEdit}<AesirButton variant="outline" class="profile-primary-action" aria-label="Set a status" onclick={(event) => startEdit('status', event)}>Set a status</AesirButton>{/if}
          {#if onmessage}<AesirButton variant="outline" class="profile-primary-action" onclick={onmessage}><AesirIcon icon={MessageSquare} size={16} />Message</AesirButton>{/if}
          {#if self}
            <AesirDropdown
              class="profile-view"
              items={viewOptions}
              label="View profile as"
              align="end"
              matchTriggerWidth
              onselect={(item) => {
                publicView = item.value === 'public';
                editing = '';
              }}
            >
              {#snippet trigger(props)}<AesirButton {...props} variant="outline" width="full" aria-label="View profile as">View as<AesirIcon icon={ChevronDown} size={15} /></AesirButton>{/snippet}
            </AesirDropdown>
          {/if}
          {#if canEdit}
            <AesirDropdown items={moreOptions} label="More profile options" align="end" onselect={(item) => onupdate?.(item.value === 'clear-status' ? { status: '' } : { presence: item.value })}>
              {#snippet trigger(props)}<AesirButton {...props} variant="outline" size="icon" aria-label="More profile options"><AesirIcon icon={EllipsisVertical} size={18} /></AesirButton>{/snippet}
            </AesirDropdown>
          {/if}
        </div>
        {@render editForm('status')}
      </section>
      <section class="chat-profile__contact" aria-label="Contact information">
        <div class="profile-section-heading">
          <h3>Contact information</h3>
          {#if canEdit}<AesirButton class="profile-edit-link" variant="ghost" size="sm" aria-label="Edit contact information" onclick={(event) => startEdit('contact', event)}>Edit</AesirButton>{/if}
        </div>
        {#if editing === 'contact' && canEdit}
          {@render editForm('contact')}
        {:else}
          <dl class="profile-contact-list">
            <div class="profile-contact-row">
              <span class="profile-contact-icon"><AesirIcon icon={Mail} size={20} /></span>
              <div>
                <dt>Email Address</dt>
                <dd>
                  {#if person.email}<a href={`mailto:${person.email}`}>{person.email}</a>{:else}Not provided{/if}
                </dd>
              </div>
            </div>
            <div class="profile-contact-row">
              <span class="profile-contact-icon"><AesirIcon icon={Phone} size={20} /></span>
              <div>
                <dt>Phone</dt>
                <dd>
                  {#if person.phone}<a href={`tel:${person.phone.replace(/[^+\d]/g, '')}`}>{person.phone}</a>{:else}Not provided{/if}
                </dd>
              </div>
            </div>
          </dl>
        {/if}
      </section>
    </div>
  </AesirScrollArea>
</aside>

<style>
  .chat-profile-panel {
    display: flex;
    flex: none;
    flex-direction: column;
    width: var(--ds-sizing-sm);
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border-left: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background);
  }
  .chat-profile-panel__header {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    min-height: var(--ds-spacing-16);
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-2) var(--ds-spacing-4);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  .chat-profile-panel :global(.profile-scroll) {
    flex: 1;
    min-height: 0;
  }
  @container chat-panels (max-width: 44rem) {
    .chat-profile-panel {
      flex: 1;
      width: 100%;
      border-left: 0;
    }
  }
  .profile-heading {
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
  }
  .chat-profile {
    overflow-wrap: anywhere;
    font-size: var(--ds-font-size-sm);
  }
  .chat-profile__summary,
  .chat-profile__contact {
    display: grid;
    gap: var(--ds-spacing-4);
    padding: var(--ds-spacing-6);
  }
  .chat-profile__contact {
    border-top: var(--ds-spacing-px) solid var(--ds-border);
  }
  .chat-profile__avatar :global(.aesir-avatar) {
    width: var(--ds-spacing-32);
    height: var(--ds-spacing-32);
  }
  .chat-profile__avatar {
    justify-self: center;
  }
  .chat-profile__avatar :global(.chat-avatar__presence) {
    right: var(--ds-spacing-2);
    bottom: var(--ds-spacing-2);
    width: var(--ds-spacing-4);
    height: var(--ds-spacing-4);
  }
  .profile-section-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--ds-spacing-3);
    min-width: 0;
  }
  .profile-section-heading h2 {
    margin: 0;
    font-size: var(--ds-font-size-xl);
    font-weight: var(--ds-font-weight-semibold);
    line-height: var(--ds-font-line-height-sm);
  }
  .profile-section-heading h3 {
    margin: 0;
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-semibold);
  }
  .profile-section-heading :global(.profile-edit-link) {
    flex: none;
    color: var(--ds-accent-text);
  }
  .profile-detail {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-3);
    margin: 0;
    color: var(--ds-foreground-muted);
  }
  .profile-presence {
    flex: none;
    width: var(--ds-spacing-2);
    height: var(--ds-spacing-2);
    margin-inline: var(--ds-spacing-1);
    border-radius: var(--ds-radius-full);
    background: var(--ds-foreground-muted);
  }
  .profile-presence[data-presence='online'] {
    background: var(--ds-emphasis-green);
  }
  .profile-presence[data-presence='away'] {
    background: var(--ds-emphasis-yellow);
  }
  .profile-status,
  .profile-job,
  .profile-view-note {
    margin: 0;
    color: var(--ds-foreground-muted);
  }
  .profile-view-note {
    font-size: var(--ds-font-size-xs);
  }
  .profile-actions {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
    min-width: 0;
  }
  .profile-actions :global(.profile-primary-action),
  .profile-actions :global(.profile-view) {
    flex: 1;
    min-width: 0;
  }
  .profile-contact-list {
    display: grid;
    gap: var(--ds-spacing-5);
    margin: 0;
  }
  .profile-contact-row {
    display: flex;
    align-items: flex-start;
    gap: var(--ds-spacing-3);
    min-width: 0;
  }
  .profile-contact-row > div {
    display: grid;
    min-width: 0;
  }
  .profile-contact-icon {
    display: grid;
    flex: none;
    width: var(--ds-spacing-10);
    height: var(--ds-spacing-10);
    place-items: center;
    border-radius: var(--ds-radius-md);
    background: var(--ds-surface);
  }
  .profile-contact-row dt {
    color: var(--ds-foreground-muted);
    font-weight: var(--ds-font-weight-medium);
  }
  .profile-contact-row dd {
    margin: 0;
  }
  .profile-contact-row a {
    color: var(--ds-foreground);
    text-decoration: none;
  }
  .profile-contact-row a:hover {
    text-decoration: underline;
  }
  .profile-contact-row a:focus-visible {
    outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    outline-offset: var(--ds-spacing-0-5);
    border-radius: var(--ds-radius-sm);
  }
  .profile-edit {
    display: grid;
    gap: var(--ds-spacing-3);
  }
  .profile-edit__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--ds-spacing-2);
  }
</style>
