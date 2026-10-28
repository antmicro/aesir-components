<script>
  import { AesirSkeleton } from '@aesir/svelte';
</script>

<div class="example">
  <AesirSkeleton width="2.5rem" height="2.5rem" radius="full" />
  <div><AesirSkeleton width="11rem" /><AesirSkeleton width="16rem" height=".75rem" /></div>
</div>

<style>
  .example {
    display: flex;
    width: min(100%, var(--ds-sizing-md));
    align-items: center;
    gap: var(--ds-spacing-3);
  }
  .example div {
    display: grid;
    gap: var(--ds-spacing-2);
  }
</style>
