<script>
  import { AesirIcon } from '@aesir/svelte';
  import InternalLink from '$lib/components/internal-link.svelte';

  let { previous = null, next = null } = $props();
</script>

{#if previous || next}
  <nav class="page-nav" aria-label="Page navigation">
    <div class="page-nav__inner">
      {#if previous}
        <InternalLink href={previous.href} class="page-nav__link">
          <span class="page-nav__icon">
            <AesirIcon name="chevron-left" />
          </span>
          <span class="page-nav__copy">
            <span class="page-nav__eyebrow">Previous</span>
            <span class="page-nav__title">{previous.title}</span>
          </span>
        </InternalLink>
      {:else}
        <div class="page-nav__spacer" aria-hidden="true"></div>
      {/if}

      {#if next}
        <InternalLink href={next.href} class="page-nav__link page-nav__link--next">
          <span class="page-nav__copy">
            <span class="page-nav__eyebrow">Next</span>
            <span class="page-nav__title">{next.title}</span>
          </span>
          <span class="page-nav__icon">
            <AesirIcon name="chevron-right" />
          </span>
        </InternalLink>
      {:else}
        <div class="page-nav__spacer" aria-hidden="true"></div>
      {/if}
    </div>
  </nav>
{/if}

<style>
  .page-nav__inner {
    display: flex;
    justify-content: space-between;
    gap: var(--ds-spacing-3);
  }

  :global(.page-nav__link) {
    display: flex;
    width: max-content;
    min-height: var(--ds-spacing-24);
    align-items: center;
    gap: var(--ds-spacing-3);
    border-radius: var(--ds-radius-lg);
    text-decoration: none;
  }

  :global(.page-nav__link--next) {
    justify-content: flex-end;
    margin-left: auto;
    text-align: right;
  }

  .page-nav__copy {
    display: grid;
    gap: var(--ds-spacing-1);
  }

  .page-nav__eyebrow,
  .page-nav__title,
  .page-nav__icon {
    display: block;
    transition: color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
  }

  .page-nav__eyebrow,
  .page-nav__icon {
    color: var(--ds-foreground-muted);
  }

  .page-nav__eyebrow {
    font-size: var(--ds-font-size-xs);
  }

  .page-nav__title {
    color: var(--ds-foreground);
    font-size: var(--ds-font-size-lg);
  }

  :global(.page-nav__link:hover) .page-nav__eyebrow,
  :global(.page-nav__link:hover) .page-nav__icon {
    color: var(--ds-foreground);
  }

  .page-nav__spacer {
    display: none;
    min-height: var(--ds-spacing-24);
  }

  @media (min-width: 40rem) {
    .page-nav__spacer {
      display: block;
    }
  }
</style>
