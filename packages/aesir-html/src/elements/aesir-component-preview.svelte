<svelte:options
  customElement={{
    tag: 'aesir-component-preview',
    props: {
      contentless: { type: 'Boolean', reflect: true },
      embedded: { type: 'Boolean', reflect: true }
    }
  }}
/>

<script>
  let { contentless = false, embedded = false } = $props();
</script>

<div class="preview" data-embedded={embedded || undefined}>
  {#if contentless}<slot></slot>{:else}<div class="content"><slot></slot></div>{/if}
</div>

<style>
  .preview {
    box-sizing: border-box;
    min-width: 0;
    overflow: hidden;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-xl);
    background: var(--ds-background-secondary);
  }
  .preview[data-embedded] {
    border: 0;
    border-radius: 0;
  }
  .content {
    display: flex;
    min-height: var(--ds-sizing-3xs);
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--ds-spacing-4);
    padding: var(--ds-spacing-8) var(--ds-spacing-6);
  }
  @media (max-width: 40rem) {
    .content {
      padding: var(--ds-spacing-5) var(--ds-spacing-4);
    }
  }
</style>
