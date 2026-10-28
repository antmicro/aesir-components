<script lang="ts">
  import { AesirButton, AesirIcon } from '@aesir/svelte';

  let open = $state(false);
</script>

<div class="motion-example">
  <AesirButton variant="outline" aria-expanded={open} onclick={() => (open = !open)}>
    {open ? 'Hide details' : 'Show details'}
    <AesirIcon name="chevron-down" class={open ? 'motion-example__icon--open' : ''} />
  </AesirButton>

  <div class="motion-example__panel" data-open={open} aria-hidden={!open}>
    <strong>Build completed</strong>
    <span>All checks passed in 42 seconds.</span>
  </div>
</div>

<style>
  .motion-example {
    display: grid;
    width: min(100%, var(--ds-sizing-xs));
    gap: var(--ds-spacing-3);
  }

  .motion-example > :global(.aesir-button) {
    justify-self: start;
  }

  .motion-example :global(svg) {
    transition: transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
  }

  .motion-example :global(.motion-example__icon--open) {
    transform: rotate(180deg);
  }

  .motion-example__panel {
    display: grid;
    gap: var(--ds-spacing-1);
    padding: var(--ds-spacing-4);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background);
    opacity: 0;
    transform: translateY(calc(var(--ds-spacing-2) * -1));
    transition:
      opacity var(--ds-motion-duration-moderate) var(--ds-motion-easing-out),
      transform var(--ds-motion-duration-moderate) var(--ds-motion-easing-out);
    visibility: hidden;
  }

  .motion-example__panel[data-open='true'] {
    opacity: 1;
    transform: translateY(0);
    visibility: visible;
  }

  .motion-example__panel span {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }

  @media (prefers-reduced-motion: reduce) {
    .motion-example :global(svg),
    .motion-example__panel {
      transition-duration: var(--ds-motion-duration-instant);
    }

    .motion-example__panel {
      transform: none;
    }
  }
</style>
