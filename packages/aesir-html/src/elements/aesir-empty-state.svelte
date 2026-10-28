<svelte:options
  customElement={{
    tag: 'aesir-empty-state',
    props: {
      title: { attribute: 'empty-state-title' }
    }
  }}
/>

<script>
  let { title, description, size = 'default' } = $props();
</script>

<section data-size={size}>
  <div class="icon"><slot name="icon"></slot></div>
  <div class="copy">
    {#if title}<h3>{title}</h3>{/if}{#if description}<p>{description}</p>{/if}<slot></slot>
  </div>
  <div class="actions"><slot name="actions"></slot></div>
</section>

<style>
  section {
    box-sizing: border-box;
    display: grid;
    width: 100%;
    justify-items: center;
    gap: var(--ds-spacing-4);
    padding: var(--ds-spacing-10) var(--ds-spacing-6);
    color: var(--ds-foreground);
    text-align: center;
  }
  section[data-size='sm'] {
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-6) var(--ds-spacing-4);
  }
  .icon {
    display: grid;
    width: var(--ds-spacing-10);
    height: var(--ds-spacing-10);
    place-items: center;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background-secondary);
    color: var(--ds-foreground-muted);
  }
  .icon:not(:has(*)) {
    display: none;
  }
  .copy {
    display: grid;
    max-width: var(--ds-sizing-md);
    gap: var(--ds-spacing-1-5);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }
  h3,
  p {
    margin: 0;
  }
  h3 {
    color: var(--ds-foreground);
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-medium);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--ds-spacing-2);
  }
  .actions:not(:has(*)) {
    display: none;
  }
</style>
