<svelte:options customElement="aesir-button-group" />

<script>
  let { orientation = 'horizontal', size = 'default' } = $props();
</script>

<div class="aesir-button-group" data-orientation={orientation} data-size={size} role="group">
  <slot></slot>
</div>

<style>
  :host {
    display: inline-block;
    min-width: 0;
  }

  :host([orientation='vertical']) {
    display: inline-grid;
  }

  .aesir-button-group {
    display: inline-flex;
    width: var(--aesir-button-group-width, fit-content);
    max-width: 100%;
    align-items: stretch;
    isolation: isolate;
    --aesir-button-group-height: var(--ds-spacing-9);
  }

  .aesir-button-group[data-size='sm'] {
    --aesir-button-group-height: var(--ds-spacing-8);
  }

  .aesir-button-group[data-size='lg'] {
    --aesir-button-group-height: var(--ds-spacing-10);
  }

  .aesir-button-group[data-orientation='vertical'] {
    flex-direction: column;
  }

  :global(::slotted([data-slot='button-group-text'])) {
    display: inline-flex;
    min-width: 0;
    height: var(--aesir-button-group-height, var(--ds-spacing-9));
    align-items: center;
    gap: var(--ds-spacing-2);
    padding-inline: var(--ds-spacing-3);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: 0;
    background: var(--ds-background);
    color: var(--ds-foreground);
    white-space: nowrap;
  }

  :global(::slotted(aesir-button:not(:first-child))) {
    margin-inline-start: calc(var(--ds-spacing-px) * -1);
  }

  :global(::slotted([data-slot='button-group-text']:first-child)) {
    border-start-start-radius: var(--ds-radius-lg);
    border-end-start-radius: var(--ds-radius-lg);
  }

  :global(::slotted([data-slot='button-group-text']:last-child)) {
    border-start-end-radius: var(--ds-radius-lg);
    border-end-end-radius: var(--ds-radius-lg);
  }
</style>
