<script>
  import { AesirPagination } from '@aesir/svelte';
  let page = $state(6);
</script>

<div class="example">
  <AesirPagination bind:page totalPages={18} />
  <p>Page {page} of 18</p>
</div>

<style>
  .example {
    display: grid;
    justify-items: center;
    gap: var(--ds-spacing-3);
  }
  p {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }
</style>
