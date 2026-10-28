<script>
  import { copyToClipboard } from './copy.js';

  let {
    items = [],
    layout = 'grid',
    columns = 'three',
    direction = 'column',
    class: className = '',
    getCopyValue = (item, mode) => item?.copyValue?.[mode] ?? item?.copyValue ?? item?.token ?? '',
    copyLabel = 'Copied',
    renderPreview = null,
    renderContent = null
  } = $props();

  const resolveCopyValue = (item) => getCopyValue(item, 'css');
</script>

<div class={`docs-copy-cards ${className}`.trim()} data-layout={layout} data-columns={columns}>
  {#each items as item, index (item.id ?? item.token ?? index)}
    <button type="button" aria-label={`Copy ${resolveCopyValue(item)}`} onclick={() => copyToClipboard(resolveCopyValue(item), { successLabel: copyLabel })} title={`Copy ${resolveCopyValue(item)}`}>
      <div class="docs-copy-cards__body" data-direction={direction}>
        {#if renderPreview}
          {@render renderPreview(item)}
        {/if}
        {#if renderContent}
          {@render renderContent(item)}
        {/if}
      </div>
    </button>
  {/each}
</div>

<style>
  .docs-copy-cards {
    display: grid;
    gap: var(--ds-spacing-4);
  }

  .docs-copy-cards[data-layout='stack'] {
    grid-template-columns: 1fr;
    gap: var(--ds-spacing-3);
  }

  .docs-copy-cards[data-columns='two'] {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .docs-copy-cards[data-columns='three'] {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  button {
    padding: var(--ds-spacing-4);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background-secondary);
    color: var(--ds-foreground);
    font: inherit;
    text-align: left;
    cursor: copy;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
      border-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
  }

  button:hover {
    border-color: var(--ds-border-hover);
    background: var(--ds-surface);
  }

  button:focus-visible {
    outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    outline-offset: var(--ds-spacing-0-5);
  }

  .docs-copy-cards__body {
    display: grid;
    gap: var(--ds-spacing-3);
  }

  .docs-copy-cards__body[data-direction='row'] {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: var(--ds-spacing-4);
  }

  @media (max-width: 48rem) {
    .docs-copy-cards[data-columns='three'] {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 40rem) {
    .docs-copy-cards[data-columns='two'],
    .docs-copy-cards[data-columns='three'] {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    button {
      transition-duration: var(--ds-motion-duration-instant);
    }
  }
</style>
