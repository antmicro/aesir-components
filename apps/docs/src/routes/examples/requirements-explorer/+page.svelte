<script>
  import RequirementsExplorer from '$lib/components/docs/examples/requirements-explorer/requirements-explorer-pattern-example.svelte';
</script>

<svelte:head><title>Aesir requirements explorer</title></svelte:head>

<main id="main-content" class="requirements-preview-page" tabindex="-1">
  <RequirementsExplorer />
</main>

<style>
  .requirements-preview-page {
    box-sizing: border-box;
    height: calc(100dvh - var(--header-height));
    min-height: 0;
    overflow: hidden;
    background: var(--ds-background-secondary);
  }

  :global(.requirements-preview-page .explorer) {
    height: 100%;
    max-height: 100%;
  }

  :global(html:has(.requirements-preview-page)) {
    scrollbar-gutter: auto;
  }
</style>
