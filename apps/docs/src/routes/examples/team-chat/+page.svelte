<script>
  import TeamChat from '$lib/components/docs/examples/team-chat/team-chat-pattern-example.svelte';
</script>

<svelte:head><title>Aesir team chat</title></svelte:head>
<main id="main-content" class="team-chat-preview" tabindex="-1"><TeamChat focusOnMount /></main>

<style>
  .team-chat-preview {
    height: calc(100dvh - var(--header-height));
    min-height: 0;
    overflow: hidden;
  }
  :global(html:has(.team-chat-preview)) {
    scrollbar-gutter: auto;
  }
</style>
