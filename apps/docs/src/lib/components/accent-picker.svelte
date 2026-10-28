<script>
  import { onMount } from 'svelte';
  import { AesirButton, AesirDropdown, AesirIcon } from '@aesir/svelte';

  const STORAGE_KEY = 'aesir-accent';
  const accents = [
    { value: 'blue', label: 'Blue' },
    { value: 'purple', label: 'Purple' },
    { value: 'pink', label: 'Pink' },
    { value: 'orange', label: 'Orange' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'lime', label: 'Lime' },
    { value: 'green', label: 'Green' },
    { value: 'teal', label: 'Teal' },
    { value: 'cyan', label: 'Cyan' }
  ];
  const accentValues = new Set(accents.map(({ value }) => value));

  let accent = $state('blue');
  const currentAccent = $derived(accents.find(({ value }) => value === accent) ?? accents[0]);
  const items = $derived(accents.map((item) => ({ ...item, role: 'menuitemradio', checked: item.value === accent })));

  const setAccent = (value) => {
    if (!accentValues.has(value)) return;
    accent = value;
    document.documentElement.dataset.aesirAccent = value;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // The selected accent still applies when storage is unavailable.
    }
  };

  onMount(() => {
    const activeAccent = document.documentElement.dataset.aesirAccent;
    if (activeAccent && accentValues.has(activeAccent)) accent = activeAccent;
    else setAccent('blue');
  });
</script>

<AesirDropdown {items} onselect={(item) => setAccent(item.value)} label="Accent color" contentClass="accent-picker__menu">
  {#snippet trigger(triggerProps)}
    <AesirButton {...triggerProps} variant="outline" size="icon" class="accent-picker__trigger" aria-label={`Accent color: ${currentAccent.label}`}>
      <AesirIcon name="palette" />
      <span class="accent-picker__indicator" aria-hidden="true"></span>
    </AesirButton>
  {/snippet}

  {#snippet itemContent({ item })}
    <span class="accent-picker__option">
      <span class="accent-picker__swatch" style={`--accent-picker-color: var(--ds-emphasis-${item.value})`} aria-hidden="true"></span>
      <span>{item.label}</span>
    </span>
    {#if item.checked}<AesirIcon name="check" class="accent-picker__check" />{/if}
  {/snippet}
</AesirDropdown>

<style>
  :global(.accent-picker__trigger) {
    position: relative;
  }

  .accent-picker__indicator {
    position: absolute;
    right: var(--ds-spacing-1);
    bottom: var(--ds-spacing-1);
    width: var(--ds-spacing-2);
    height: var(--ds-spacing-2);
    border: var(--ds-spacing-px) solid var(--ds-background);
    border-radius: var(--ds-radius-full);
    background: var(--ds-accent);
  }

  :global(.accent-picker__menu) {
    width: min(calc(100vw - var(--ds-spacing-8)), var(--ds-sizing-3xs));
    background: var(--ds-background-secondary);
  }

  :global(.accent-picker__menu [data-slot='scroll-area-viewport']) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  :global(.accent-picker__menu > :where(button, a)) {
    gap: var(--ds-spacing-2);
  }

  .accent-picker__option {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-2);
  }

  .accent-picker__swatch {
    width: var(--ds-spacing-3);
    height: var(--ds-spacing-3);
    flex-shrink: 0;
    border-radius: var(--ds-radius-full);
    background: var(--accent-picker-color);
    box-shadow: inset 0 0 0 var(--ds-spacing-px) color-mix(in oklch, var(--ds-foreground) 12%, transparent);
  }

  :global(.accent-picker__check) {
    width: var(--ds-spacing-3-5);
    height: var(--ds-spacing-3-5);
    flex-shrink: 0;
  }
</style>
