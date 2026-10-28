<svelte:options
  customElement={{
    tag: 'aesir-code-window',
    props: {
      embedded: { type: 'Boolean', reflect: true },
      hideLineNumbers: { type: 'Boolean' }
    }
  }}
/>

<script>
  import { createClipboard } from '@aesir/svelte/utilities/clipboard';

  let { label = 'Code', filename, code, highlightedLines = '', addedLines = '', removedLines = '', hideLineNumbers = false, embedded = false } = $props();
  let hasControls = $state(false);
  let hasFileIcon = $state(false);
  const clipboard = createClipboard();
  const copied = $derived(clipboard.copied);
  const lines = $derived(code?.replaceAll('\r\n', '\n').split('\n') ?? []);
  const marked = (list, number) =>
    String(list)
      .split(',')
      .some((entry) => Number(entry.trim()) === number);

  const copyCode = async () => {
    if (code === undefined) return;
    await clipboard.copy(code, true);
  };
</script>

<div class="window" data-embedded={embedded || undefined} data-floating-copy={(code !== undefined && !filename && !hasControls) || undefined} aria-label={label}>
  <div class="toolbar" class:toolbar-hidden={!filename && !hasControls}>
    {#if filename}<span class="file">
        <span class="file-icon" class:empty={!hasFileIcon}><slot name="file-icon" onslotchange={(event) => (hasFileIcon = event.currentTarget.assignedElements().length > 0)}></slot></span>
        <span class="filename">{filename}</span>
      </span>{/if}
    <div class="controls"><slot name="controls" onslotchange={(event) => (hasControls = event.currentTarget.assignedElements().length > 0)}></slot></div>
    {#if code !== undefined && (filename || hasControls)}<button type="button" class="copy" aria-label={copied ? 'Copied' : 'Copy code'} title={copied ? 'Copied' : 'Copy code'} onclick={copyCode}>
        {copied ? '✓' : 'Copy'}
      </button>{/if}
  </div>
  <div class="viewport" role="region" aria-label={label}>
    {#if code !== undefined}
      <pre class="code" data-hide-line-numbers={hideLineNumbers}><code>{#each lines as line, index (`${index}:${line}`)}<span
              class="line"
              data-highlighted={marked(highlightedLines, index + 1) || undefined}
              data-added={marked(addedLines, index + 1) || undefined}
              data-removed={marked(removedLines, index + 1) || undefined}><span class="line-number" aria-hidden="true">{index + 1}</span><span class="line-content">{line ||
                  ' '}</span></span>{/each}</code></pre>
    {:else}
      <slot></slot>
    {/if}
  </div>
  {#if code !== undefined && !filename && !hasControls}<button
      type="button"
      class="copy floating-copy"
      aria-label={copied ? 'Copied' : 'Copy code'}
      title={copied ? 'Copied' : 'Copy code'}
      onclick={copyCode}
    >
      {copied ? '✓' : 'Copy'}
    </button>{/if}
  <span class="announcement" aria-live="polite">{copied ? 'Copied' : ''}</span>
</div>

<style>
  .window {
    position: relative;
    display: flex;
    box-sizing: border-box;
    min-width: 0;
    max-height: var(--aesir-code-window-max-height, min(var(--ds-sizing-xl), 70dvh));
    overflow: hidden;
    flex-direction: column;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-xl);
    background: var(--ds-background-secondary);
  }
  .window[data-embedded] {
    height: var(--aesir-code-window-height, auto);
    max-height: var(--aesir-code-window-max-height, min(var(--ds-sizing-xl), 70dvh));
    border: 0;
    border-radius: 0;
  }
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: var(--ds-spacing-10);
    gap: var(--ds-spacing-2);
    padding-inline: var(--ds-spacing-3);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  .toolbar-hidden {
    display: none;
  }
  .filename {
    min-width: 0;
    overflow: hidden;
    color: var(--ds-foreground-muted);
    font-family: var(--ds-font-family-sans);
    font-size: var(--ds-font-size-xs);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .file {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
  .file-icon {
    display: inline-flex;
    flex: none;
    color: var(--ds-foreground-muted);
  }
  .file-icon.empty {
    display: none;
  }
  .controls {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--ds-spacing-1);
    margin-inline-start: auto;
  }
  .viewport {
    min-height: 0;
    flex: 1 1 auto;
    overflow: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--ds-border-hover) transparent;
  }
  ::slotted(pre) {
    box-sizing: border-box;
    min-width: 100%;
    margin: 0;
    padding-inline-end: var(--ds-spacing-5);
    border: 0;
    border-radius: 0;
    background: transparent;
  }
  .code {
    width: max-content;
    padding: var(--ds-spacing-4) var(--ds-spacing-2);
    color: var(--ds-foreground);
    font-family: var(--ds-font-family-sans);
    font-size: var(--ds-font-size-sm);
    line-height: 1.5;
  }
  .window[data-floating-copy] .code {
    padding-inline-end: var(--ds-spacing-12);
  }
  .line {
    display: flex;
    min-height: 1.5em;
    padding-inline: var(--ds-spacing-1);
    white-space: pre;
  }
  .line[data-highlighted] {
    background: var(--ds-accent-surface);
  }
  .line[data-added] {
    background: var(--ds-surface-green);
  }
  .line[data-removed] {
    background: var(--ds-surface-red);
  }
  .line-number {
    width: 3ch;
    flex: none;
    margin-inline-end: var(--ds-spacing-3);
    color: var(--ds-foreground-muted);
    text-align: end;
    user-select: none;
  }
  .code[data-hide-line-numbers='true'] .line-number {
    display: none;
  }
  .line-content {
    flex: 1;
  }
  .copy {
    flex: none;
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
  .copy:hover {
    background: var(--ds-surface-hover);
    color: var(--ds-foreground);
  }
  .copy:focus-visible {
    outline: var(--ds-spacing-px) solid var(--ds-accent-ring);
  }
  .floating-copy {
    position: absolute;
    top: var(--ds-spacing-2);
    right: var(--ds-spacing-2);
    background: var(--ds-background-secondary);
    opacity: 0;
  }
  .window:hover .floating-copy,
  .window:focus-within .floating-copy {
    opacity: 1;
  }
  .announcement {
    position: absolute;
    width: var(--ds-spacing-px);
    height: var(--ds-spacing-px);
    overflow: hidden;
    clip-path: inset(50%);
  }
  @media (hover: none) {
    .floating-copy {
      opacity: 1;
    }
  }
</style>
