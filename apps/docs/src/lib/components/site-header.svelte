<script>
  import { page } from '$app/state';
  import { AesirButton, AesirIcon, AesirIconSwap, AesirKbd } from '@aesir/svelte';
  import InternalLink from '$lib/components/internal-link.svelte';
  import { normalizePathname } from '$lib/utils.js';
  import { mode, toggleMode } from 'mode-watcher';
  import Search from '@lucide/svelte/icons/search';
  import LogoLight from '$lib/assets/common/antmicro-white--color.svelte';
  import LogoDark from '$lib/assets/common/antmicro-white--logo.svelte';
  import AccentPicker from '$lib/components/accent-picker.svelte';
  import ThemePicker from '$lib/components/theme-picker.svelte';
  import MobileMenu from '$lib/components/nav/mobile-menu.svelte';

  const isDocsRoute = $derived(normalizePathname(page.url.pathname).startsWith('/docs'));

  const openDocsSearch = () => {
    window.dispatchEvent(new Event('docs-command-open'));
  };
</script>

<header class="site-header">
  <div class="site-header__inner">
    <InternalLink href="/" class="site-header__brand" aria-label="Go to homepage">
      <span class="site-header__logo site-header__logo--light">
        <LogoLight />
      </span>
      <span class="site-header__logo site-header__logo--dark">
        <LogoDark />
      </span>
    </InternalLink>

    <div class="site-header__actions">
      {#if isDocsRoute}
        <AesirButton variant="outline" class="docs-search-trigger" onclick={openDocsSearch} aria-label="Search documentation">
          <span class="docs-search-trigger__label">
            <AesirIcon icon={Search} class="docs-search-trigger__icon" />
            <span class="docs-search-trigger__text">Search</span>
          </span>
          <AesirKbd class="docs-search-trigger__shortcut" meta small>K</AesirKbd>
        </AesirButton>
      {/if}
      <div class="site-header__preferences">
        <ThemePicker />
        <AccentPicker />
        <AesirButton variant="outline" size="icon" onclick={toggleMode}>
          <AesirIconSwap name="sun" activeName="moon" active={mode.current === 'dark'} />
          <span class="site-header__sr-only">Toggle theme</span>
        </AesirButton>
      </div>
      <div class="site-header__mobile-menu">
        <MobileMenu />
      </div>
    </div>
  </div>
</header>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 50;
    height: var(--header-height);
    border-bottom: var(--ds-spacing-px) solid color-mix(in oklch, var(--ds-border) 70%, transparent);
    background: color-mix(in oklch, var(--ds-background) 70%, transparent);
    backdrop-filter: blur(40px);
  }

  .site-header__inner {
    display: flex;
    width: 100%;
    max-width: var(--ds-sizing-7xl);
    height: 100%;
    align-items: center;
    justify-content: space-between;
    margin-inline: auto;
    padding-inline: var(--ds-spacing-4);
  }

  :global(.site-header__brand),
  .site-header__logo,
  .site-header__actions {
    display: inline-flex;
    align-items: center;
  }

  :global(.site-header__brand) {
    height: 100%;
  }

  .site-header__logo {
    height: var(--ds-spacing-8);
  }

  .site-header__logo--dark {
    display: none;
  }

  :global(.site-header__logo svg) {
    display: block;
    width: auto;
    height: var(--ds-spacing-8);
  }

  :global(html.dark) .site-header__logo--light {
    display: none;
  }

  :global(html.dark) .site-header__logo--dark {
    display: inline-flex;
  }

  .site-header__actions {
    gap: var(--ds-spacing-3);
  }

  .site-header__sr-only {
    position: absolute;
    width: var(--ds-spacing-px);
    height: var(--ds-spacing-px);
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .site-header__mobile-menu {
    display: block;
  }

  .site-header__preferences {
    display: none;
    align-items: center;
    gap: var(--ds-spacing-3);
  }

  :global(.docs-search-trigger) {
    width: var(--ds-spacing-9);
    height: var(--ds-spacing-9);
    padding: 0;
    justify-content: center;
  }

  .docs-search-trigger__label {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    gap: var(--ds-spacing-2);
    font-size: var(--ds-font-size-xs);
  }

  :global(.docs-search-trigger__icon) {
    width: var(--ds-spacing-4);
    height: var(--ds-spacing-4);
    flex: 0 0 var(--ds-spacing-4);
  }

  .docs-search-trigger__text,
  :global(.docs-search-trigger__shortcut) {
    display: none;
  }

  @media (min-width: 48rem) {
    .site-header__inner {
      padding-inline: var(--ds-spacing-6);
    }

    :global(.docs-search-trigger) {
      width: 12.5rem;
      padding: var(--ds-spacing-2) var(--ds-spacing-4);
      justify-content: space-between;
    }

    .docs-search-trigger__text {
      display: inline;
    }

    :global(.docs-search-trigger__shortcut) {
      display: flex;
    }
  }

  @media (min-width: 64rem) {
    .site-header__preferences {
      display: inline-flex;
    }

    .site-header__mobile-menu {
      display: none;
    }
  }
</style>
