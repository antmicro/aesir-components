<script>
  import { AesirScrollArea, AesirIcon, AesirBadge, AesirButton, AesirDialog } from '@aesir/svelte';
  import { saveReviewDiff, saveReviewChangedLines } from './requirements-demo.js';
  let { open = $bindable(false) } = $props();
</script>

{#snippet diffPreview()}
  <AesirScrollArea class="markdown-diff__scroll" orientation="both">
    {#if saveReviewDiff.length}
      <div class="markdown-diff__lines">
        {#each saveReviewDiff as line, index (`${line.type}-${line.oldLine ?? ''}-${line.newLine ?? ''}-${index}`)}
          {#if line.type === 'separator'}
            <div class="markdown-diff__separator" aria-hidden="true">···</div>
          {:else}
            <div class="markdown-diff__line" data-type={line.type}>
              <span>{line.oldLine ?? ''}</span>
              <span>{line.newLine ?? ''}</span>
              <strong aria-hidden="true">{line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}</strong>
              <code>{line.text || ' '}</code>
            </div>
          {/if}
        {/each}
      </div>
    {:else}
      <div class="markdown-diff__empty"><AesirIcon name="check" size={16} /> No changes yet</div>
    {/if}
  </AesirScrollArea>
{/snippet}

<AesirDialog bind:open class="save-changes-dialog" title="Review requirements changes">
  <div class="save-changes-dialog__summary">
    <AesirBadge variant="outline" size="sm">{saveReviewChangedLines} lines changed</AesirBadge>
  </div>
  <div class="save-changes-dialog__diff">{@render diffPreview()}</div>

  {#snippet footer({ close })}
    <AesirButton variant="ghost" onclick={close}>Cancel</AesirButton>
    <AesirButton>Save</AesirButton>
  {/snippet}
</AesirDialog>

<style>
  :global(.markdown-diff__scroll) {
    min-width: 0;
    min-height: 0;
  }
  .markdown-diff__lines {
    min-width: max-content;
    padding-block: var(--ds-spacing-2);
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-xs);
    line-height: 1.5rem;
  }
  .markdown-diff__line {
    display: grid;
    min-width: 100%;
    grid-template-columns: 4ch 4ch 2ch minmax(24rem, 1fr);
  }
  .markdown-diff__line > span {
    color: var(--ds-foreground-muted);
    text-align: right;
    user-select: none;
  }
  .markdown-diff__line > strong {
    color: var(--ds-foreground-muted);
    font-weight: var(--ds-font-weight-regular);
    text-align: center;
    user-select: none;
  }
  .markdown-diff__line > code {
    padding-right: var(--ds-spacing-3);
    color: var(--ds-foreground-muted);
    font: inherit;
    white-space: pre;
  }
  .markdown-diff__line[data-type='added'] {
    background: var(--ds-surface-hover-green);
  }
  .markdown-diff__line[data-type='added'] > strong,
  .markdown-diff__line[data-type='added'] > code {
    color: var(--ds-foreground-muted-green);
  }
  .markdown-diff__line[data-type='removed'] {
    background: var(--ds-surface-hover-red);
  }
  .markdown-diff__line[data-type='removed'] > strong,
  .markdown-diff__line[data-type='removed'] > code {
    color: var(--ds-foreground-muted-red);
  }
  .markdown-diff__separator {
    padding-left: var(--ds-spacing-3);
    color: var(--ds-foreground-muted);
    user-select: none;
  }
  .markdown-diff__empty {
    display: grid;
    height: 100%;
    place-content: center;
    justify-items: center;
    gap: var(--ds-spacing-2);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  :global(.aesir-dialog.save-changes-dialog) {
    width: min(calc(100vw - var(--ds-spacing-8)), 64rem);
    height: min(calc(100dvh - var(--ds-spacing-8)), 44rem);
    grid-template-rows: auto minmax(0, 1fr) auto;
    overflow: hidden;
  }
  :global(.save-changes-dialog .aesir-dialog__body) {
    display: grid;
    min-height: 0;
    grid-template-rows: auto minmax(0, 1fr);
    padding: 0;
  }
  .save-changes-dialog__summary {
    display: flex;
    min-height: var(--ds-spacing-10);
    align-items: center;
    padding-inline: var(--ds-spacing-3);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  .save-changes-dialog__diff {
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    background: var(--ds-background-secondary);
  }
  .save-changes-dialog__diff :global(.markdown-diff__scroll) {
    height: 100%;
  }
</style>
