<svelte:options
  customElement={{
    tag: 'aesir-snippet',
    props: { prompt: { type: 'Boolean' } }
  }}
/>

<script>
  import { createClipboard } from '@aesir/svelte/utilities/clipboard';

  let { text = '', label = 'Copy snippet', prompt = false } = $props();
  const clipboard = createClipboard();
  const copied = $derived(clipboard.copied);
  const copy = () => clipboard.copy(text, true);
</script>

<div class="snippet">
  <div class="value" role="region" aria-label="Snippet value">
    {#if prompt}<span class="prompt" aria-hidden="true">$</span>{/if}
    <code>{text}</code>
  </div>
  <button type="button" aria-label={copied ? 'Copied' : label} title={copied ? 'Copied' : label} onclick={copy}>{copied ? 'Copied' : 'Copy'}</button>
  <span class="announcement" aria-live="polite">{copied ? 'Copied' : ''}</span>
</div>

<style>
  :host {
    display: block;
  }
  .snippet {
    display: flex;
    box-sizing: border-box;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-2);
    padding: var(--ds-spacing-2);
    padding-inline-start: var(--ds-spacing-4);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background-secondary);
  }
  .value {
    display: flex;
    min-width: 0;
    flex: 1;
    align-items: center;
    gap: var(--ds-spacing-2);
    overflow-x: auto;
    scrollbar-width: none;
    white-space: nowrap;
  }
  .value::-webkit-scrollbar {
    display: none;
  }
  button:focus-visible {
    outline: var(--ds-spacing-px) solid var(--ds-accent-ring);
  }
  code,
  .prompt {
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-sm);
  }
  code {
    color: var(--ds-foreground);
  }
  .prompt {
    color: var(--ds-foreground-muted);
  }
  button {
    flex: none;
    min-width: var(--ds-spacing-12);
    min-height: var(--ds-spacing-8);
    padding-inline: var(--ds-spacing-2);
    border: 0;
    border-radius: var(--ds-radius-sm);
    background: transparent;
    color: var(--ds-foreground-muted);
    cursor: pointer;
    font: inherit;
    font-size: var(--ds-font-size-xs);
  }
  button:hover {
    background: var(--ds-surface-hover);
    color: var(--ds-foreground);
  }
  .announcement {
    position: absolute;
    width: var(--ds-spacing-px);
    height: var(--ds-spacing-px);
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
