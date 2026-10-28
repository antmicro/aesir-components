<script>
  import { chatSearchParts } from './team-chat-search-model.js';
  let { text, query = '' } = $props();
  const parts = $derived(chatSearchParts(text, query));
</script>

{#each parts as part (part.start)}{#if part.matched}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}

<style>
  mark {
    padding: 0;
    border-radius: var(--ds-radius-sm);
    background: var(--ds-accent-surface);
    color: var(--ds-accent-text-muted);
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }
</style>
