<script>
  import { AesirCheckbox } from '@aesir/svelte';
  import TeamChatAvatar from './team-chat-avatar.svelte';
  let { person, checked = false, onchange, showRole = true, compact = false } = $props();
  const id = $props.id();
</script>

<div class="member-picker__row" data-selected={checked || undefined} data-density={compact ? 'compact' : undefined}>
  <AesirCheckbox class="person-option-checkbox" id={`${id}-checkbox`} aria-labelledby={`${id}-name`} aria-describedby={showRole && person.role ? `${id}-role` : undefined} {checked} {onchange} />
  <label class="person-option-label" for={`${id}-checkbox`}>
    <span class="person-option-avatar"><TeamChatAvatar {person} size={compact ? 'xs' : 'sm'} /></span>
    <span class="person-option-copy">
      <span id={`${id}-name`}>{person.name}</span>
      {#if showRole && person.role}<span class="person-option-role" id={`${id}-role`}>{person.role}</span>{/if}
    </span>
  </label>
</div>

<style>
  .member-picker__row {
    position: relative;
    min-width: 0;
    border-radius: var(--ds-radius-md);
  }
  .person-option-label {
    display: grid;
    grid-template-columns: var(--ds-spacing-4) var(--ds-spacing-8) minmax(0, 1fr);
    align-items: center;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-3);
    cursor: pointer;
  }
  .person-option-avatar {
    grid-column: 2;
  }
  .person-option-copy {
    display: grid;
    gap: var(--ds-spacing-1);
    min-width: 0;
    font-size: var(--ds-font-size-sm);
    overflow-wrap: anywhere;
  }
  .person-option-role {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .member-picker__row[data-density='compact'] .person-option-label {
    grid-template-columns: var(--ds-spacing-4) var(--ds-spacing-6) minmax(0, 1fr);
    min-height: var(--ds-spacing-9);
    box-sizing: border-box;
    gap: var(--ds-spacing-2);
    padding: var(--ds-spacing-1) var(--ds-spacing-2);
  }
  .member-picker__row[data-density='compact'] :global(.person-option-checkbox) {
    left: var(--ds-spacing-2);
  }
  .member-picker__row :global(.person-option-checkbox) {
    position: absolute;
    left: var(--ds-spacing-3);
    top: 50%;
    transform: translateY(-50%);
    z-index: 1;
    gap: 0;
    grid-template-columns: auto;
  }
  .member-picker__row :global(.aesir-checkbox__control) {
    margin-top: 0;
  }
  .member-picker__row[data-selected] {
    background: var(--ds-accent-surface);
  }
  .member-picker__row:has(:global(input:focus-visible)) {
    outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    outline-offset: var(--ds-spacing-0-5);
  }
  @media (hover: hover) and (pointer: fine) {
    .member-picker__row:hover {
      background: var(--ds-surface);
    }
    .member-picker__row[data-selected]:hover {
      background: var(--ds-accent-surface-hover);
    }
  }
  @media (pointer: coarse) {
    .member-picker__row[data-density='compact'] .person-option-label {
      min-height: var(--ds-spacing-12);
    }
  }
</style>
