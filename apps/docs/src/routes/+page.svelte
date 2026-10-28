<script>
  import Logo from '$lib/assets/common/logo.svelte';
  import InternalLink from '$lib/components/internal-link.svelte';
  import { AesirButton, AesirIcon } from '@aesir/svelte';
  import { resolveInternalHref } from '$lib/utils.js';

  let { data } = $props();

  const quickAccessHrefs = [
    '/docs/colors/',
    '/docs/icons/',
    '/docs/typography/',
    '/docs/breakpoints/',
    '/docs/grid/',
    '/docs/motion/',
    '/docs/button/',
    '/docs/installation/',
    '/docs/component-styling/',
    '/docs/theming/'
  ];

  const quickAccessLinks = $derived(quickAccessHrefs.map((href) => data.docsLinks.find((link) => link.href === href)).filter(Boolean));
</script>

<svelte:head>
  <title>Aesir Design System</title>
  <meta name="description" content="A design system and component library built by the Antmicro design team." />
</svelte:head>

<main id="main-content" class="landing" tabindex="-1">
  <aside class="landing__rail landing__rail--left" aria-hidden="true">
    <div class="side-hatch landing__hatch"></div>
  </aside>

  <section class="landing__center">
    <div class="landing__primary">
      <div class="landing__hero">
        <div class="landing__badge-row">
          <div class="landing__badge">
            <span class="landing__shine"></span>
            <span class="landing__status-dot">
              <span class="landing__status-pulse"></span>
              <span class="landing__status-core"></span>
            </span>
            <p>Design System</p>
          </div>
        </div>

        <h1 class="landing__sr-only">Aesir Design System</h1>
        <Logo class="landing__logo" />
        <p class="landing__description">A design system and component library built by Antmicro design team</p>

        <div class="landing__actions">
          <AesirButton href={resolveInternalHref('/docs/')}>Browse docs</AesirButton>
        </div>
      </div>

      <!-- Quick access -->
      <section class="quick-access" aria-labelledby="quick-access-title">
        <header class="quick-access__header">
          <h2 id="quick-access-title">Quick access</h2>
          <span>{quickAccessLinks.length} pages</span>
        </header>

        <div class="quick-access__grid">
          {#each quickAccessLinks as link, i (link.href)}
            <InternalLink href={link.href} class="quick-access__link" style={`animation-delay: ${i * 45}ms`}>
              <AesirIcon name="arrow-up-right" class="quick-access__arrow" />
              <AesirIcon name={link.icon} class="quick-access__icon" strokeWidth={1.5} />
              <div>
                <span>{link.title}</span>
                <small>{link.group}</small>
              </div>
            </InternalLink>
          {/each}
        </div>
      </section>
    </div>
  </section>

  <aside class="landing__rail landing__rail--right" aria-hidden="true">
    <div class="side-hatch landing__hatch"></div>
  </aside>
</main>

<style>
  .landing {
    display: flex;
    width: 100%;
    min-height: calc(100dvh - var(--header-height) - var(--ds-spacing-px));
    flex: 1;
  }

  .landing__rail {
    display: none;
    pointer-events: none;
  }

  .landing__hatch {
    width: 100%;
    height: 100%;
    --side-row: 120px;
  }

  .landing__rail--left {
    padding-right: 20%;
  }

  .landing__rail--left .landing__hatch {
    border-right: var(--ds-spacing-px) solid var(--ds-border);
  }

  .landing__rail--right {
    padding-left: 20%;
  }

  .landing__rail--right .landing__hatch {
    border-left: var(--ds-spacing-px) solid var(--ds-border);
  }

  .landing__center {
    display: flex;
    width: 100%;
    max-width: 90rem;
    height: 100%;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    margin-inline: auto;
    border-inline: var(--ds-spacing-px) solid var(--ds-border);
  }

  .landing__primary,
  .landing__hero {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
  }

  .landing__hero {
    align-items: flex-start;
    justify-content: center;
    padding: var(--ds-spacing-12) var(--ds-spacing-5);
  }

  .landing__badge-row,
  .landing__badge,
  .landing__status-dot,
  .landing__actions {
    display: flex;
    align-items: center;
  }

  .landing__badge-row {
    gap: var(--ds-spacing-2);
    margin-bottom: var(--ds-spacing-4);
  }

  .landing__badge {
    position: relative;
    width: fit-content;
    gap: var(--ds-spacing-2);
    overflow: hidden;
    padding: calc(var(--ds-spacing-1) / 2) var(--ds-spacing-2);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-full);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-light);
  }

  .landing__badge p {
    margin: 0;
  }

  .landing__shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, transparent, color-mix(in oklch, var(--ds-white) 60%, transparent), transparent);
    animation: shine 3s ease-in-out infinite;
  }

  .landing__status-dot,
  .landing__status-pulse,
  .landing__status-core {
    width: var(--ds-spacing-1-5);
    height: var(--ds-spacing-1-5);
  }

  .landing__status-dot {
    position: relative;
  }

  .landing__status-pulse,
  .landing__status-core {
    display: inline-flex;
    background: var(--ds-foreground);
  }

  .landing__status-pulse {
    position: absolute;
    opacity: var(--ds-opacity-70);
    animation: landing-ping 1s var(--ds-motion-easing-out) infinite;
  }

  .landing__status-core {
    position: relative;
  }

  .landing__sr-only {
    position: absolute;
    width: var(--ds-spacing-px);
    height: var(--ds-spacing-px);
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  :global(.landing__logo) {
    color: var(--ds-foreground);
  }

  .landing__description {
    max-width: 36rem;
    margin: var(--ds-spacing-3) 0 0;
    color: var(--ds-foreground-muted);
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-lg);
    letter-spacing: var(--ds-font-letter-spacing-tight);
    text-wrap: balance;
  }

  .landing__actions {
    flex-wrap: wrap;
    gap: var(--ds-spacing-3);
    margin-top: var(--ds-spacing-6);
  }

  .quick-access {
    flex: 1;
    border-top: var(--ds-spacing-px) solid var(--ds-border);
  }

  .quick-access__header {
    display: flex;
    min-height: var(--ds-spacing-12);
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-spacing-4);
    padding: var(--ds-spacing-3) var(--ds-spacing-5);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }

  .quick-access__header h2 {
    margin: 0;
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
    line-height: var(--ds-font-line-height-sm);
  }

  .quick-access__header span {
    color: var(--ds-foreground-muted);
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-xs);
    line-height: var(--ds-font-line-height-xs);
    text-transform: uppercase;
    letter-spacing: var(--ds-font-letter-spacing-wide);
  }

  .quick-access__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }

  :global(.quick-access__link) {
    position: relative;
    display: flex;
    min-width: 0;
    min-height: var(--ds-spacing-32);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-4) var(--ds-spacing-3);
    border-right: var(--ds-spacing-px) solid var(--ds-border);
    color: var(--ds-foreground-muted);
    text-align: center;
    text-decoration: none;
    opacity: 0;
    transform: translateY(var(--ds-spacing-2));
    animation: quick-access-enter var(--ds-motion-duration-moderate) var(--ds-motion-easing-out) forwards;
    transition:
      background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
  }

  :global(.quick-access__link:nth-child(2n)) {
    border-right: 0;
  }

  :global(.quick-access__link:nth-child(n + 3)) {
    border-top: var(--ds-spacing-px) solid var(--ds-border);
  }

  :global(.quick-access__link > div) {
    display: grid;
    justify-items: center;
    gap: var(--ds-spacing-1);
  }

  :global(.quick-access__link > div > span) {
    font-size: var(--ds-font-size-xs);
    line-height: var(--ds-font-line-height-xs);
    text-transform: uppercase;
    letter-spacing: var(--ds-font-letter-spacing-wide);
  }

  :global(.quick-access__link small) {
    color: color-mix(in oklch, var(--ds-foreground-muted) 50%, transparent);
    font-size: var(--ds-font-size-xxs);
    line-height: var(--ds-font-line-height-xs);
  }

  :global(.quick-access__icon) {
    width: var(--ds-spacing-4);
    height: var(--ds-spacing-4);
    transition:
      color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
  }

  :global(.quick-access__arrow) {
    position: absolute;
    top: var(--ds-spacing-3);
    right: var(--ds-spacing-3);
    width: var(--ds-spacing-3);
    height: var(--ds-spacing-3);
    opacity: 0;
    transform: translate(-2px, 2px);
    transition:
      opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
  }

  @media (min-width: 1024px) {
    .quick-access__grid {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }

    :global(.quick-access__link:nth-child(n)) {
      border-right: var(--ds-spacing-px) solid var(--ds-border);
      border-top: 0;
    }

    :global(.quick-access__link:nth-child(5n)) {
      border-right: 0;
    }

    :global(.quick-access__link:nth-child(n + 6)) {
      border-top: var(--ds-spacing-px) solid var(--ds-border);
    }
  }

  @media (min-width: 40rem) {
    .landing__hero {
      padding: var(--ds-spacing-16) var(--ds-spacing-8);
    }

    .landing__description {
      font-size: var(--ds-font-size-base);
    }

    .landing__actions {
      gap: var(--ds-spacing-4);
    }
  }

  @media (min-width: 48rem) {
    .landing__center {
      min-height: 0;
      flex-direction: row;
    }
  }

  @media (min-width: 64rem) {
    .landing__hero {
      padding-inline: var(--ds-spacing-10);
    }
  }

  @media (min-width: 80rem) {
    .landing {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 80rem) minmax(0, 1fr);
    }

    .landing__rail {
      display: flex;
    }

    .landing__hero {
      padding-inline: var(--ds-spacing-12);
    }
  }

  @media (hover: hover) and (pointer: fine) {
    :global(.quick-access__link:hover) {
      background: var(--ds-surface-hover);
      color: var(--ds-foreground);
    }

    :global(.quick-access__link:hover .quick-access__icon) {
      transform: scale(1.08);
    }

    :global(.quick-access__link:hover .quick-access__arrow) {
      opacity: 1;
      transform: translate(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.quick-access__link) {
      opacity: 1;
      transform: none;
      animation: none;
    }

    .landing__shine,
    .landing__status-pulse {
      animation: none;
    }
  }

  @keyframes quick-access-enter {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes shine {
    0% {
      transform: translateX(-100%) skewX(-20deg);
    }
    30% {
      transform: translateX(200%) skewX(-20deg);
    }
    100% {
      transform: translateX(200%) skewX(-20deg);
    }
  }

  @keyframes landing-ping {
    75%,
    100% {
      opacity: 0;
      transform: scale(2);
    }
  }
</style>
