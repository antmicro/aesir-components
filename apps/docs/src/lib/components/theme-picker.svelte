<script>
  import { onMount } from 'svelte';
  import { AesirButton, AesirDropdown, AesirIcon } from '@aesir/svelte';

  const STORAGE_KEY = 'aesir-theme';
  const themes = [
    { value: 'default', label: 'Default' },
    { value: 'mist', label: 'Mist' },
    { value: 'protan-deutan', label: 'Protanopia / deuteranopia' },
    { value: 'tritan', label: 'Tritanopia' }
  ];
  const themeValues = new Set(themes.map(({ value }) => value));

  let theme = $state('mist');
  const currentTheme = $derived(themes.find(({ value }) => value === theme) ?? themes[0]);
  const items = $derived(themes.map((item) => ({ ...item, role: 'menuitemradio', checked: item.value === theme })));

  const setTheme = (value) => {
    if (!themeValues.has(value)) return;
    theme = value;
    if (value === 'default') delete document.documentElement.dataset.aesirTheme;
    else document.documentElement.dataset.aesirTheme = value;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
  };

  onMount(() => {
    const activeTheme = document.documentElement.dataset.aesirTheme;
    if (activeTheme && themeValues.has(activeTheme)) theme = activeTheme;
    else theme = 'default';
  });
</script>

<AesirDropdown {items} onselect={(item) => setTheme(item.value)} label="Interface theme" align="end" contentClass="theme-picker__menu">
  {#snippet trigger(triggerProps)}
    <AesirButton {...triggerProps} variant="outline" aria-label={`Interface theme: ${currentTheme.label}`} class="theme-picker__trigger">
      <AesirIcon name="swatch-book" />
      <span class="theme-picker__label">{currentTheme.label}</span>
    </AesirButton>
  {/snippet}

  {#snippet itemContent({ item })}
    <span class="theme-picker__option">
      <span class="theme-picker__preview" data-theme-preview={item.value} aria-hidden="true">
        <span></span>
      </span>
      <span>{item.label}</span>
    </span>
  {/snippet}
</AesirDropdown>

<style>
  :global(.theme-picker__trigger) {
    height: var(--ds-spacing-9);
    max-width: min(var(--ds-spacing-48), 32vw);
  }

  .theme-picker__label {
    overflow: hidden;
    font-size: var(--ds-font-size-xs);
    line-height: var(--ds-font-line-height-xs);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(.theme-picker__menu) {
    width: min(calc(100vw - var(--ds-spacing-8)), var(--ds-spacing-48));
    background: var(--ds-background);
  }

  .theme-picker__option {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-2);
  }

  .theme-picker__preview {
    display: grid;
    width: var(--ds-spacing-5);
    height: var(--ds-spacing-5);
    flex-shrink: 0;
    place-items: center;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-sm);
    background: var(--ds-background-secondary);
  }

  .theme-picker__preview span {
    width: var(--ds-spacing-2);
    height: var(--ds-spacing-2);
    border-radius: var(--ds-radius-xs);
    background: var(--ds-surface-active);
  }

  .theme-picker__preview[data-theme-preview='mist'] {
    border-color: oklch(0.18 0 0 / 0.08);
    background: oklch(0.985 0 0);
  }

  .theme-picker__preview[data-theme-preview='mist'] span {
    background: oklch(0.915 0 0);
  }

  .theme-picker__preview[data-theme-preview='protan-deutan'] span {
    width: var(--ds-spacing-3);
    background: linear-gradient(90deg, var(--ds-orange-700) 50%, var(--ds-blue-700) 50%);
  }

  .theme-picker__preview[data-theme-preview='tritan'] span {
    width: var(--ds-spacing-3);
    background: linear-gradient(90deg, var(--ds-purple-700) 50%, var(--ds-pink-700) 50%);
  }

  :global(.dark) .theme-picker__preview[data-theme-preview='mist'] {
    border-color: oklch(0.94 0 0 / 0.08);
    background: oklch(0.16 0 0);
  }

  :global(.dark) .theme-picker__preview[data-theme-preview='mist'] span {
    background: oklch(0.27 0 0);
  }
</style>
