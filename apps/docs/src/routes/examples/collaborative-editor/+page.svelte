<script>
  import CollaborativeEditorExample from '$lib/components/docs/examples/collaborative-editor/collaborative-editor-example.svelte';
</script>

<svelte:head><title>MyST</title></svelte:head>

<main id="main-content" class="editor-preview-page" tabindex="-1">
  <CollaborativeEditorExample />
</main>

<style>
  .editor-preview-page {
    height: calc(100dvh - var(--ds-spacing-16));
    min-height: 0;
    overflow: hidden;
  }
  :global(html:has(.editor-preview-page)) {
    scrollbar-gutter: auto;
  }
  :global(.editor-preview-page .editor) {
    height: 100%;
    min-height: 0;
    border: 0;
    border-radius: 0;
  }
</style>
