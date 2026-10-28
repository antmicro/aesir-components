<script>
  import { AesirButton, AesirCheckbox, AesirDialog, AesirIcon, AesirSelect } from '@aesir/svelte';
  import { resetMode, setMode, userPrefersMode } from 'mode-watcher';
  import Clock from '@lucide/svelte/icons/clock';
  import Bell from '@lucide/svelte/icons/bell';
  import PanelsTopLeft from '@lucide/svelte/icons/panels-top-left';
  import Palette from '@lucide/svelte/icons/palette';
  import MessageCircle from '@lucide/svelte/icons/message-circle';
  import Accessibility from '@lucide/svelte/icons/accessibility';
  import Settings from '@lucide/svelte/icons/settings';
  import { defaultChatPreferences } from './team-chat-preferences.js';

  let { open = $bindable(false), value = $bindable(defaultChatPreferences()) } = $props();
  let section = $state('availability');
  const panelId = $props.id();
  const sections = [
    { value: 'availability', label: 'Availability', icon: Clock },
    { value: 'notifications', label: 'Notifications', icon: Bell },
    { value: 'navigation', label: 'Navigation', icon: PanelsTopLeft },
    { value: 'appearance', label: 'Appearance', icon: Palette },
    { value: 'messages', label: 'Messages & media', icon: MessageCircle },
    { value: 'accessibility', label: 'Accessibility', icon: Accessibility },
    { value: 'advanced', label: 'Advanced', icon: Settings }
  ];
  const current = $derived(sections.find((item) => item.value === section));
  const days = [
    { value: 'every-day', label: 'Every day' },
    { value: 'weekdays', label: 'Monday–Friday' },
    { value: 'weekends', label: 'Saturday–Sunday' }
  ];
  const times = Array.from({ length: 48 }, (_, index) => {
    const time = `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`;
    return { value: time, label: time };
  });
  const accents = ['blue', 'purple', 'pink', 'orange', 'yellow', 'lime', 'green', 'teal', 'cyan'].map((color) => ({ value: color, label: color[0].toUpperCase() + color.slice(1) }));
</script>

<AesirDialog bind:open title="Preferences" closeLabel="Close preferences" class="chat-preferences-dialog" data-aesir-accent={value.accent}>
  <div class="chat-preferences">
    <nav class="preferences-navigation" aria-label="Preferences sections">
      {#each sections as item (item.value)}
        <AesirButton
          class="preferences-section"
          variant={section === item.value ? 'accent' : 'ghost'}
          aria-current={section === item.value ? 'page' : undefined}
          aria-controls={panelId}
          onclick={() => (section = item.value)}
        >
          <AesirIcon icon={item.icon} size={18} />
          <span>{item.label}</span>
        </AesirButton>
      {/each}
    </nav>
    <section class="preferences-content" id={panelId} aria-labelledby={`${panelId}-heading`}>
      <h3 id={`${panelId}-heading`}>{current.label}</h3>
      {#if section === 'availability'}
        <div class="preferences-group">
          <h4>Working hours</h4>
          <p>Choose when notifications are allowed. Outside these hours, notifications are paused.</p>
          <div class="working-hours">
            <AesirSelect label="Allow notifications" options={days} bind:value={value.workingDays} />
            <AesirSelect label="From" options={times} bind:value={value.workingStart} />
            <AesirSelect label="To" options={times} bind:value={value.workingEnd} />
          </div>
          <p class="preferences-note">Times use your local timezone. Delivery is a preview; this example does not send notifications.</p>
        </div>
        <div class="preferences-group">
          <h4>Automatic statuses</h4>
          <p>Let people know when responses might be delayed. A custom status takes priority.</p>
          <div class="preferences-checks">
            <AesirCheckbox label="🎧 In a huddle" description="While you are in a huddle" bind:checked={value.statusHuddle} />
            <AesirCheckbox label="🔭 In focus mode" description="While focus mode is enabled" bind:checked={value.statusFocus} />
            <AesirCheckbox label="🕰️ After hours" description="Outside your working hours" bind:checked={value.statusAfterHours} />
          </div>
          <p class="preferences-note">Automatic statuses are preview settings; calendar and call integrations are not connected.</p>
        </div>
      {:else if section === 'notifications'}
        <div class="preferences-group">
          <h4>Notify me about</h4>
          <p>Choose your default notification preference. Individual channels keep their own settings.</p>
          <AesirSelect
            label="Default notifications"
            options={[
              { value: 'all', label: 'All new messages' },
              { value: 'mentions', label: 'Direct messages and mentions' },
              { value: 'muted', label: 'Pause notifications' }
            ]}
            bind:value={value.notifications}
          />
          <p class="preferences-note">This example saves your choice but does not send browser or desktop notifications.</p>
        </div>
      {:else if section === 'navigation'}
        <div class="preferences-group">
          <h4>Sidebar</h4>
          <p>Keep conversation navigation as quiet or informative as you like.</p>
          <AesirCheckbox label="Show unread message badges" bind:checked={value.showUnread} />
        </div>
      {:else if section === 'appearance'}
        <div class="preferences-group">
          <h4>Color mode</h4>
          <p>Choose a light or dark interface, or follow your system settings.</p>
          <AesirSelect
            label="Color mode"
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' }
            ]}
            bind:value={() => userPrefersMode.current, (next) => setMode(next)}
          />
          <p class="preferences-note">Applies to the whole interface and is remembered on this device.</p>
        </div>
        <div class="preferences-group">
          <h4>Accent color</h4>
          <p>Use the same accent for selected items, buttons and unread badges.</p>
          <AesirSelect label="Accent color" options={accents} bind:value={value.accent} />
        </div>
        <div class="preferences-group">
          <h4>Message spacing</h4>
          <AesirSelect
            label="Message spacing"
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' }
            ]}
            bind:value={value.density}
          />
        </div>
      {:else if section === 'messages'}
        <div class="preferences-group">
          <h4>Writing messages</h4>
          <AesirSelect
            label="Send a message with"
            options={[
              { value: 'enter', label: 'Enter' },
              { value: 'modifier-enter', label: 'Ctrl / ⌘ + Enter' }
            ]}
            bind:value={value.sendWith}
          />
          <p>When using Ctrl / ⌘ + Enter to send, Enter inserts a new line. The Send button is always available.</p>
        </div>
        <div class="preferences-group">
          <h4>Message display</h4>
          <AesirCheckbox label="Show message timestamps" bind:checked={value.showTimestamps} />
        </div>
      {:else if section === 'accessibility'}
        <div class="preferences-group">
          <h4>Reading messages</h4>
          <div class="preferences-checks">
            <AesirCheckbox label="Use larger message text" bind:checked={value.largerText} />
            <AesirCheckbox label="Always underline links in messages" bind:checked={value.underlineLinks} />
          </div>
          <p>Keyboard focus and your system's reduced-motion preference are respected automatically.</p>
        </div>
      {:else if section === 'advanced'}
        <div class="preferences-group">
          <h4>Reset preferences</h4>
          <p>Restore the defaults without changing your messages, drafts or profile.</p>
          <AesirButton
            variant="outline"
            onclick={() => {
              value = defaultChatPreferences();
              resetMode();
            }}
          >
            Reset preferences
          </AesirButton>
        </div>
      {/if}
      <p class="preferences-note preferences-scope">Changes apply immediately. Color mode is remembered on this device; other preferences stay while this example is open.</p>
    </section>
  </div>
</AesirDialog>

<style>
  :global(.chat-preferences-dialog) {
    width: min(100%, var(--ds-sizing-5xl));
    height: min(var(--ds-sizing-3xl), calc(100dvh - var(--ds-spacing-8)));
    grid-template-rows: auto minmax(0, 1fr);
    overflow: hidden;
  }
  :global(.chat-preferences-dialog .aesir-dialog__header) {
    padding: var(--ds-spacing-6);
  }
  :global(.chat-preferences-dialog .aesir-dialog__header h2) {
    font-size: var(--ds-font-size-xl);
  }
  :global(.chat-preferences-dialog .aesir-dialog__body) {
    min-height: 0;
    padding: 0;
  }
  .chat-preferences {
    height: 100%;
    min-height: 0;
    display: grid;
    grid-template-columns: var(--ds-spacing-64) minmax(0, 1fr);
  }
  .preferences-navigation {
    display: flex;
    flex-direction: column;
    gap: var(--ds-spacing-1);
    padding: var(--ds-spacing-4);
    overflow: auto;
    background: var(--ds-background-secondary);
    border-right: var(--ds-spacing-px) solid var(--ds-border);
  }
  .preferences-navigation :global(.preferences-section) {
    width: 100%;
    justify-content: flex-start;
    flex-shrink: 0;
    text-align: left;
  }
  .preferences-content {
    min-width: 0;
    overflow: auto;
    padding: var(--ds-spacing-6) var(--ds-spacing-8);
    outline-offset: calc(-1 * var(--ds-spacing-1));
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-base);
  }
  h3,
  h4,
  p {
    margin: 0;
  }
  h3 {
    margin-bottom: var(--ds-spacing-8);
    font-size: var(--ds-font-size-xl);
  }
  h4 {
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-medium);
  }
  p {
    color: var(--ds-foreground-muted);
  }
  .preferences-group {
    display: grid;
    gap: var(--ds-spacing-3);
    padding-block: var(--ds-spacing-6);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  h3 + .preferences-group {
    padding-top: 0;
  }
  .working-hours {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) repeat(2, minmax(0, 1fr));
    gap: var(--ds-spacing-3);
  }
  .preferences-checks {
    display: grid;
    gap: var(--ds-spacing-4);
  }
  .preferences-note {
    font-size: var(--ds-font-size-xs);
  }
  .preferences-scope {
    margin-top: var(--ds-spacing-6);
  }
  .preferences-group :global(.aesir-button) {
    justify-self: start;
  }
  @media (max-width: 640px) {
    .chat-preferences {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr);
    }
    .preferences-navigation {
      flex-direction: row;
      border-right: 0;
      border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    }
    .preferences-navigation :global(.preferences-section) {
      width: auto;
    }
    .preferences-content {
      padding: var(--ds-spacing-5);
    }
    .working-hours {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .working-hours :global(.aesir-native-select:first-child) {
      grid-column: 1 / -1;
    }
  }
</style>
