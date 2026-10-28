<script>
  import { AesirButton, AesirIcon } from '@aesir/svelte';

  let open = $state(false);
</script>

<div class="icon-state-example">
  <AesirButton variant="outline" aria-expanded={open} onclick={() => (open = !open)}>
    Options
    <AesirIcon name="chevron-down" class={open ? 'icon-open' : ''} />
  </AesirButton>
</div>

<style>
  .icon-state-example :global(svg) {
    transition: transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
  }

  .icon-state-example :global(.icon-open) {
    transform: rotate(180deg);
  }

  @media (prefers-reduced-motion: reduce) {
    .icon-state-example :global(svg) {
      transition: none;
    }
  }
</style>
