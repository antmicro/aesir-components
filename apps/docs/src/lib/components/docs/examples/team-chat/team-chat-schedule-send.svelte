<script>
  import { tick } from 'svelte';
  import { AesirButton, AesirButtonGroup, AesirDatePicker, AesirDialog, AesirDropdown, AesirIcon, AesirInput } from '@aesir/svelte';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import { defaultScheduleFields, parseScheduleTime, schedulePreset, scheduleNow, scheduleTimezone } from './team-chat-scheduling.js';

  let { disabled = false, label = 'Message', onschedule } = $props();
  let open = $state(false);
  let date = $state('');
  let time = $state('');
  let minDate = $state('');
  let error = $state('');
  let controls;
  function attachControls(node) {
    controls = node;
    return () => (controls = undefined);
  }
  const timezone = scheduleTimezone();
  const errorId = $props.id();
  const items = [{ value: 'hour', label: 'In 1 hour' }, { value: 'tomorrow', label: 'Tomorrow at 9:00' }, { type: 'separator' }, { value: 'custom', label: 'Choose date and time…' }];

  async function choose(item) {
    if (disabled) return;
    if (item.value !== 'custom') {
      if (onschedule?.(schedulePreset(item.value))) await focusComposer();
      return;
    }
    ({ date, time, minDate } = defaultScheduleFields());
    error = '';
    // Let the menu restore focus before the modal takes ownership of it.
    await tick();
    open = true;
  }
  async function focusComposer() {
    await tick();
    controls?.closest('form')?.querySelector('textarea')?.focus();
  }
  async function schedule(event) {
    event.preventDefault();
    const sendAt = parseScheduleTime(date, time);
    if (!sendAt || sendAt <= scheduleNow()) {
      error = 'Choose a date and time in the future.';
      return;
    }
    if (onschedule?.(sendAt)) {
      open = false;
      await focusComposer();
    } else {
      error = 'The message could not be scheduled. Check the draft and delivery time.';
    }
  }
</script>

<div class="chat-send-controls" {@attach attachControls}>
  <AesirButtonGroup size="sm" aria-label="Send options">
    <AesirButton class="chat-send-now" type="submit" variant="accent" size="icon-sm" {disabled} aria-label="Send message"><AesirIcon name="arrow-up" size={16} /></AesirButton>
    <AesirDropdown {items} label="Schedule message" placement="top" align="end" onselect={choose}>
      {#snippet trigger(props)}<AesirButton {...props} class="chat-send-later" variant="accent" size="icon-sm" {disabled} aria-label="Schedule message">
          <AesirIcon icon={ChevronDown} size={14} />
        </AesirButton>{/snippet}
    </AesirDropdown>
  </AesirButtonGroup>
</div>

<AesirDialog bind:open title="Schedule message" description={label}>
  <form class="schedule-form" onsubmit={schedule}>
    <div class="schedule-fields">
      <AesirDatePicker bind:value={date} label="Send date" min={minDate} aria-describedby={error ? errorId : undefined} />
      <AesirInput bind:value={time} type="time" label="Send time" required aria-invalid={error ? 'true' : undefined} aria-describedby={error ? errorId : undefined} />
    </div>
    <p>Times use your local timezone: {timezone}.</p>
    {#if error}<p id={errorId} role="alert">{error}</p>{/if}
    <div class="schedule-actions">
      <AesirButton variant="outline" onclick={() => (open = false)}>Cancel</AesirButton>
      <AesirButton type="submit" variant="accent">Schedule message</AesirButton>
    </div>
  </form>
</AesirDialog>

<style>
  .chat-send-controls {
    margin-left: auto;
    flex: none;
  }
  .chat-send-controls :global(.chat-send-now) {
    border-start-end-radius: 0;
    border-end-end-radius: 0;
  }
  .chat-send-controls :global(.chat-send-later) {
    border-start-start-radius: 0;
    border-end-start-radius: 0;
    border-inline-start-color: var(--ds-border);
  }
  .schedule-form {
    display: grid;
    gap: var(--ds-spacing-4);
  }
  .schedule-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
    gap: var(--ds-spacing-3);
  }
  .schedule-form p {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }
  .schedule-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--ds-spacing-2);
  }
</style>
