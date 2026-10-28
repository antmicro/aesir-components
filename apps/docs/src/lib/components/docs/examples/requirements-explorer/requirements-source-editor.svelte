<script>
  import { onMount } from 'svelte';
  import { AesirButton, AesirIcon } from '@aesir/svelte';
  let { value = $bindable(''), requirementId = '', onclose, onsave, dirty = false } = $props();
  let textarea, gutter;
  let scrollTop = $state(0);
  const lines = $derived(value.split('\n'));
  const selectedLine = $derived(requirementId ? lines.findIndex((line) => line.match(/^\s*\|([^|]+)\|/)?.[1]?.trim() === requirementId) : -1);
  const lineNumbers = $derived(Array.from({ length: lines.length }, (_, i) => i + 1));
  onMount(() => {
    // Let the opening control finish its focus handling before focusing the editor.
    const frame = requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      const line = selectedLine;
      if (line < 0) return;
      const start = lines.slice(0, line).reduce((offset, line) => offset + line.length + 1, 0);
      textarea.setSelectionRange(start, start + lines[line].length);
      textarea.scrollTop = line * Number.parseFloat(getComputedStyle(textarea).lineHeight);
      gutter.scrollTop = textarea.scrollTop;
      scrollTop = textarea.scrollTop;
    });
    return () => cancelAnimationFrame(frame);
  });
</script>

<section class="source-editor" data-inline={Boolean(requirementId)} aria-label={requirementId ? `Edit ${requirementId}` : 'Requirements Markdown editor'}>
  <header>
    <span><AesirIcon name="edit" size={13} />{requirementId ? `Editing ${requirementId}` : 'Requirements source'}</span>
    <div class="source-editor__actions">
      {#if onsave}
        <AesirButton size="sm" variant={dirty ? 'accent' : 'outline'} disabled={!dirty} onclick={onsave}><AesirIcon name="check" size={14} />Save</AesirButton>
      {/if}
      <AesirButton variant="ghost" size="icon-sm" aria-label="Close editor" onclick={onclose}><AesirIcon name="x" size={14} /></AesirButton>
    </div>
  </header>
  <div class="source-editor__surface">
    <div class="source-editor__lines" bind:this={gutter} aria-hidden="true">
      {#each lineNumbers as line (line)}<span class:highlighted={line === selectedLine + 1}>{line}</span>{/each}
    </div>
    <textarea
      bind:this={textarea}
      bind:value
      data-highlighted={selectedLine >= 0 || undefined}
      style:--highlight-top={`calc(var(--ds-spacing-3) + var(--ds-spacing-6) * ${selectedLine} - ${scrollTop}px)`}
      spellcheck="false"
      aria-label="Requirements Markdown source"
      onscroll={() => {
        scrollTop = textarea.scrollTop;
        gutter.scrollTop = scrollTop;
      }}
      onkeydown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onclose(event);
        }
      }}
    ></textarea>
  </div>
</section>

<style>
  .source-editor {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    box-sizing: border-box;
    height: 100%;
    border: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background-secondary);
  }
  .source-editor[data-inline='true'] {
    height: 20rem;
    margin: var(--ds-spacing-2) var(--ds-spacing-3);
    border-radius: var(--ds-radius-md);
    overflow: hidden;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--ds-spacing-2) var(--ds-spacing-3);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  header span {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
  .source-editor__actions {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
  .source-editor__surface {
    display: grid;
    grid-template-columns: 4ch minmax(0, 1fr);
    flex: 1;
    min-height: 0;
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-xs);
    line-height: var(--ds-spacing-6);
  }
  .source-editor__lines {
    overflow: hidden;
    padding: var(--ds-spacing-3) var(--ds-spacing-1);
    text-align: right;
    color: var(--ds-foreground-muted);
  }
  .source-editor__lines span {
    display: block;
  }
  .source-editor__lines .highlighted {
    background: var(--ds-accent-surface);
    color: var(--ds-accent-text);
  }
  textarea[data-highlighted] {
    background-image: linear-gradient(var(--ds-accent-surface), var(--ds-accent-surface));
    background-size: 100% var(--ds-spacing-6);
    background-position: 0 var(--highlight-top);
    background-repeat: no-repeat;
  }
  textarea {
    min-width: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    resize: none;
    border: 0;
    outline: 0;
    padding: var(--ds-spacing-3);
    background: transparent;
    color: var(--ds-foreground);
    font: inherit;
    line-height: inherit;
    white-space: pre;
    overflow: auto;
  }
  textarea::selection {
    background: var(--ds-accent-surface);
    color: var(--ds-accent-text);
  }
</style>
