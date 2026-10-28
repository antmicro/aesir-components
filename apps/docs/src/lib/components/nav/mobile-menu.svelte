<script>
  import { page } from '$app/state';
  import { AesirButton, AesirIconSwap } from '@aesir/svelte';
  import { mode, toggleMode } from 'mode-watcher';
  import InternalLink from '$lib/components/internal-link.svelte';
  import AccentPicker from '$lib/components/accent-picker.svelte';
  import ThemePicker from '$lib/components/theme-picker.svelte';
  import { isCurrentPath } from '$lib/docs/path-state.js';
  import { portal } from '$lib/actions/portal.js';
  import { lockDocumentOverlay, trapFocus } from '@aesir/svelte/utilities/overlay';

  let open = $state(false);
  let trigger = $state(null);
  const docsSidebar = $derived(page.data?.docsSidebar ?? []);

  const isActive = (href) => isCurrentPath(page.url.pathname, href);

  const onKeydown = (event) => {
    if (event.key === 'Escape' && open) {
      open = false;
    }
  };

  $effect(() => {
    if (!open || typeof document === 'undefined') return;
    const unlockOverlay = lockDocumentOverlay(document);
    return () => {
      unlockOverlay();
      trigger?.focus?.();
    };
  });
</script>

<svelte:window onkeydown={onKeydown} />

<div class="mobile-menu">
  <AesirButton bind:ref={trigger} variant="ghost" size="icon" aria-expanded={open ? 'true' : 'false'} aria-controls="mobile-menu-panel" onclick={() => (open = !open)}>
    <AesirIconSwap name="menu" activeName="x" active={open} />
    <span class="mobile-menu__sr-only">{open ? 'Close navigation menu' : 'Open navigation menu'}</span>
  </AesirButton>
  {#if open}
    <div use:portal>
      <button type="button" class="mobile-menu__backdrop" onclick={() => (open = false)} aria-label="Close menu"></button>
      <div use:trapFocus id="mobile-menu-panel" class="mobile-menu__panel" data-state={open ? 'open' : 'closed'} role="dialog" aria-modal="true" aria-label="Navigation menu" tabindex="-1">
        <nav class="mobile-menu__nav">
          {#each docsSidebar as section (section.title)}
            <div class="mobile-menu__section">
              <p class="mobile-menu__heading">
                {section.title}
              </p>
              {#each section.items as item (item.href)}
                <InternalLink href={item.href} onclick={() => (open = false)} class="mobile-menu__link" data-active={isActive(item.href)}>
                  {item.title}
                </InternalLink>
              {/each}
            </div>
          {/each}
        </nav>
        <section class="mobile-menu__settings" aria-labelledby="mobile-menu-settings">
          <p id="mobile-menu-settings" class="mobile-menu__heading">Settings</p>
          <div class="mobile-menu__setting">
            <span>Theme</span>
            <ThemePicker />
          </div>
          <div class="mobile-menu__setting">
            <span>Accent</span>
            <AccentPicker />
          </div>
          <div class="mobile-menu__setting">
            <span>Appearance</span>
            <AesirButton variant="outline" size="icon" onclick={toggleMode} aria-label={`Use ${mode.current === 'dark' ? 'light' : 'dark'} mode`}>
              <AesirIconSwap name="sun" activeName="moon" active={mode.current === 'dark'} />
            </AesirButton>
          </div>
        </section>
      </div>
    </div>
  {/if}
</div>

<style>
  .mobile-menu {
    position: relative;
  }

  .mobile-menu__sr-only {
    position: absolute;
    width: var(--ds-spacing-px);
    height: var(--ds-spacing-px);
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .mobile-menu__backdrop,
  .mobile-menu__panel {
    position: fixed;
    left: 0;
  }

  .mobile-menu__backdrop {
    inset: 0;
    z-index: 40;
    border: 0;
    background: color-mix(in oklch, var(--ds-black) 20%, transparent);
  }

  .mobile-menu__panel {
    top: var(--header-height);
    z-index: 50;
    width: 100vw;
    height: calc(100dvh - var(--header-height));
    overflow-y: auto;
    padding: var(--ds-spacing-10) var(--ds-spacing-4) var(--ds-spacing-4);
    border-top: var(--ds-spacing-px) solid var(--ds-border);
    background: color-mix(in oklch, var(--ds-background) 70%, transparent);
    backdrop-filter: blur(40px);
    transition:
      opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
  }

  @starting-style {
    .mobile-menu__panel {
      opacity: 0;
      transform: translateY(calc(var(--ds-spacing-2) * -1));
    }
  }

  .mobile-menu__nav,
  .mobile-menu__section {
    display: grid;
  }

  .mobile-menu__nav {
    gap: var(--ds-spacing-4);
  }

  .mobile-menu__settings {
    display: grid;
    gap: var(--ds-spacing-2);
    margin-top: var(--ds-spacing-8);
    padding-top: var(--ds-spacing-4);
    border-top: var(--ds-spacing-px) solid var(--ds-border);
  }

  .mobile-menu__setting {
    display: flex;
    min-height: var(--ds-spacing-10);
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-spacing-4);
    padding-inline: var(--ds-spacing-2);
    color: var(--ds-foreground);
    font-size: var(--ds-font-size-sm);
  }

  .mobile-menu__section {
    gap: var(--ds-spacing-1);
  }

  .mobile-menu__heading {
    margin: 0;
    padding-inline: var(--ds-spacing-2);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    text-transform: uppercase;
  }

  :global(.mobile-menu__link) {
    display: block;
    padding: var(--ds-spacing-2);
    border-radius: var(--ds-radius-md);
    color: var(--ds-foreground);
    font-size: 1.05rem;
    text-decoration: none;
    transition: background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
  }

  :global(.mobile-menu__link:hover) {
    background: var(--ds-surface-hover);
  }

  :global(html[data-overlay-open='true']) {
    overflow: hidden;
  }

  :global(.mobile-menu__link[data-active='true']) {
    background: var(--ds-accent-surface);
    color: var(--ds-accent-text-muted);
    font-weight: var(--ds-font-weight-medium);
  }

  @media (min-width: 64rem) {
    .mobile-menu {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .mobile-menu__panel {
      transition: none;
    }
  }
</style>
