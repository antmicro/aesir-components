<script>
  import Pagination from '../../src/components/aesir-pagination/aesir-pagination.svelte';

  let page = $state(10);
  let totalPages = $state(10);
</script>

<Pagination bind:page {totalPages} />
<button type="button" onclick={() => (totalPages = 5)}>Shrink to five pages</button>
<button type="button" onclick={() => (totalPages = 10)}>Grow to ten pages</button>
<output aria-label="Bound page">{page}</output>
