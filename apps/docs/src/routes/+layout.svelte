<script>
  import './layout.css';
  import '@aesir/css/aesir-global.css';
  import '@aesir/css/aesir-themes.css';
  import '@aesir/css/aesir-typography.css';
  import { page } from '$app/state';
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import favicon from '$lib/assets/favicon.svg';
  import faviconDark from '$lib/assets/favicon-dark.svg';
  import SiteHeader from '$lib/components/site-header.svelte';
  import { markdownCopy } from '$lib/components/docs/markdown-copy.js';
  import { AesirToaster } from '@aesir/svelte/components/aesir-toast';
  import { normalizePathname } from '$lib/utils.js';
  import { ModeWatcher, mode } from 'mode-watcher';
  let { children } = $props();

  let fadeDuration = $state(0);
  const isHomeRoute = (pathname = '') => normalizePathname(pathname) === '/';

  beforeNavigate(({ from, to }) => {
    const fromPath = from?.url?.pathname ?? page.url.pathname;
    const toPath = to?.url?.pathname ?? fromPath;
    fadeDuration = isHomeRoute(fromPath) || isHomeRoute(toPath) ? 180 : 0;
  });

  afterNavigate(() => {
    // Reset to avoid accidental fades on same-route updates.
    fadeDuration = 0;
  });
</script>

<svelte:head>
  <link rel="icon" type="image/svg+xml" href={favicon} media="(prefers-color-scheme: light)" />
  <link rel="icon" type="image/svg+xml" href={faviconDark} media="(prefers-color-scheme: dark)" />
  <meta name="theme-color" content={mode.current === 'dark' ? '#000000' : '#ffffff'} />
</svelte:head>
<ModeWatcher />
{#if !page.url.pathname.includes('/examples/navbar/')}
  <a href="#main-content" class="skip-link">Skip to content</a>
  <SiteHeader />
{/if}
{#key isHomeRoute(page.url.pathname)}
  <div use:markdownCopy in:fade={{ duration: fadeDuration }} out:fade={{ duration: fadeDuration }}>
    {@render children()}
  </div>
{/key}
<AesirToaster />

<style>
  .skip-link {
    position: fixed;
    top: var(--ds-spacing-2);
    left: var(--ds-spacing-2);
    z-index: 100;
    width: var(--ds-spacing-px);
    height: var(--ds-spacing-px);
    overflow: hidden;
    padding: 0;
    border-radius: var(--ds-radius-md);
    background: var(--ds-background);
    color: var(--ds-foreground);
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .skip-link:focus-visible {
    width: auto;
    height: auto;
    overflow: visible;
    padding: var(--ds-spacing-1-5) var(--ds-spacing-2-5);
    border: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background-secondary);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
    line-height: var(--ds-font-line-height-sm);
    outline: var(--ds-spacing-px) solid var(--ds-accent-ring);
    outline-offset: var(--ds-spacing-px);
    clip-path: none;
  }

  :global(html) {
    color-scheme: light;
  }

  :global(html.dark) {
    color-scheme: dark;
  }

  :global(#main-content:focus) {
    outline: none;
  }
</style>
