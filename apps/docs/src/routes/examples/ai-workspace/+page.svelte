<script>
  import AiWorkspaceExample from '$lib/components/docs/examples/ai-workspace/sidebar-llm-example.svelte';
</script>

<svelte:head><title>Aesir AI workspace</title></svelte:head>

<main id="main-content" class="ai-workspace-preview-page" tabindex="-1">
  <AiWorkspaceExample autofocus typeToFocus />
</main>

<style>
  .ai-workspace-preview-page {
    height: calc(100dvh - var(--ds-spacing-16));
    min-height: 0;
    overflow: hidden;
  }

  :global(html:has(.ai-workspace-preview-page)) {
    scrollbar-gutter: auto;
  }
  :global(.ai-workspace-preview-page .llm-example),
  :global(.ai-workspace-preview-page .llm-sidebar) {
    height: 100%;
  }
</style>
