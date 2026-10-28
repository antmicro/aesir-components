<script lang="ts">
  import { createClipboard } from '../../utils/clipboard.svelte.js';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { AesirButton } from '../aesir-button/index.js';
  import { AesirIconSwap } from '../aesir-icon-swap/index.js';
  import { mergeProps } from '../../utils/merge-props.js';
  type CodeWindowProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
    label?: string;
    filename?: string;
    fileIcon?: Snippet;
    code?: string;
    lineNumbers?: boolean;
    highlightedLinesNumbers?: number[];
    addedLinesNumbers?: number[];
    removedLinesNumbers?: number[];
    renderLine?: Snippet<[string, number]>;
    oncopied?: (code: string) => void;
    oncopyerror?: () => void;
    embedded?: boolean;
    controls?: Snippet;
    children?: Snippet;
    class?: string;
  };
  let {
    label = 'Code',
    filename,
    fileIcon,
    code,
    lineNumbers = true,
    highlightedLinesNumbers = [],
    addedLinesNumbers = [],
    removedLinesNumbers = [],
    renderLine,
    oncopied,
    oncopyerror,
    embedded = false,
    controls,
    children,
    class: className = '',
    ...restProps
  }: CodeWindowProps = $props();
  const clipboard = createClipboard<string>();
  const copied = $derived(code !== undefined && clipboard.copied === code);
  const lines = $derived(code?.replace(/\r\n?/g, '\n').split('\n') ?? []);
  const lineNumberWidth = $derived.by(() => {
    const digits = String(lines.length).length;
    return digits <= 3 ? '3ch' : `calc(${digits}ch + var(--ds-spacing-2))`;
  });

  const copyCode = async () => {
    if (code === undefined) return;
    const source = code;
    const result = await clipboard.copy(source, source);
    if (result === true) oncopied?.(source);
    else if (result === false) oncopyerror?.();
  };

  const resolvedProps = $derived(
    mergeProps(
      {
        class: ['aesir-code-window', className],
        'data-embedded': embedded || undefined,
        'data-floating-copy': (code !== undefined && !filename && !controls) || undefined,
        'aria-label': label
      },
      restProps
    )
  );
</script>

<div {...resolvedProps}>
  {#if controls || filename}
    <div class="aesir-code-window__toolbar">
      {#if filename}<span class="aesir-code-window__file">
          {#if fileIcon}<span class="aesir-code-window__file-icon" aria-hidden="true">{@render fileIcon()}</span>{/if}
          <span class="aesir-code-window__filename">{filename}</span>
        </span>{/if}
      {#if controls}<div class="aesir-code-window__controls">{@render controls()}</div>{/if}
      {#if code !== undefined}
        <AesirButton variant="ghost" size="icon-sm" aria-label={copied ? 'Copied' : 'Copy code'} title={copied ? 'Copied' : 'Copy code'} onclick={copyCode}>
          <AesirIconSwap name="copy" activeName="check" active={copied} size={16} />
        </AesirButton>
      {/if}
    </div>
  {/if}
  <div class="aesir-code-window__viewport" role="region" aria-label={label}>
    {#if children}
      {@render children()}
    {:else if code !== undefined}
      <pre class="aesir-code-window__code" data-line-numbers={lineNumbers} style:--aesir-code-window-line-number-width={lineNumberWidth}><code>{#each lines as line, index (`${index}:${line}`)}<span
              class="aesir-code-window__line"
              data-highlighted={highlightedLinesNumbers.includes(index + 1) || undefined}
              data-added={addedLinesNumbers.includes(index + 1) || undefined}
              data-removed={removedLinesNumbers.includes(index + 1) || undefined}><span class="aesir-code-window__line-number" aria-hidden="true">{index + 1}</span><span
                class="aesir-code-window__line-content">{#if renderLine}{@render renderLine(line, index + 1)}{:else}{line || ' '}{/if}</span></span>{/each}</code></pre>
    {/if}
  </div>
  {#if code !== undefined && !filename && !controls}
    <div class="aesir-code-window__floating-copy">
      <AesirButton variant="ghost" size="icon-sm" aria-label={copied ? 'Copied' : 'Copy code'} title={copied ? 'Copied' : 'Copy code'} onclick={copyCode}>
        <AesirIconSwap name="copy" activeName="check" active={copied} size={16} />
      </AesirButton>
    </div>
  {/if}
  <span class="aesir-code-window__announcement" aria-live="polite">{copied ? 'Copied' : ''}</span>
</div>

<style>
  :global {
    .aesir-code-window {
      position: relative;
      display: flex;
      min-width: 0;
      max-height: var(--aesir-code-window-max-height, min(var(--ds-sizing-xl), 70dvh));
      overflow: hidden;
      flex-direction: column;
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-xl);
      background: var(--ds-background-secondary);
    }
    .aesir-code-window[data-embedded] {
      height: var(--aesir-code-window-height, auto);
      max-height: var(--aesir-code-window-max-height, min(var(--ds-sizing-xl), 70dvh));
      border: 0;
      border-radius: 0;
    }
    .aesir-code-window__toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: var(--ds-spacing-10);
      gap: var(--ds-spacing-2);
      padding-inline: var(--ds-spacing-3);
      border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    }
    .aesir-code-window__filename {
      min-width: 0;
      overflow: hidden;
      color: var(--ds-foreground-muted);
      font-family: var(--ds-font-family-sans);
      font-size: var(--ds-font-size-xs);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .aesir-code-window__file {
      display: inline-flex;
      min-width: 0;
      align-items: center;
      gap: var(--ds-spacing-2);
    }
    .aesir-code-window__file-icon {
      display: inline-flex;
      flex: none;
      color: var(--ds-foreground-muted);
    }
    .aesir-code-window__controls {
      display: flex;
      min-width: 0;
      flex: 0 1 auto;
      align-items: center;
      gap: var(--ds-spacing-1);
      margin-inline-start: auto;
      overflow-x: auto;
    }
    .aesir-code-window__viewport {
      min-height: 0;
      flex: 1 1 auto;
      overflow: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--ds-border-hover) transparent;
    }
    .aesir-code-window__viewport pre {
      box-sizing: border-box;
      min-width: 100%;
      margin: 0;
      padding-inline-end: var(--ds-spacing-5);
      border: 0;
      border-radius: 0;
      background: transparent;
    }
    .aesir-code-window__code {
      width: max-content;
      padding: var(--ds-spacing-4) var(--ds-spacing-2);
      color: var(--ds-foreground);
      font-family: var(--ds-font-family-mono);
      font-size: var(--ds-font-size-sm);
      line-height: 1.5;
    }
    .aesir-code-window[data-floating-copy] .aesir-code-window__code {
      padding-inline-end: var(--ds-spacing-12);
    }
    .aesir-code-window__line {
      display: flex;
      min-height: 1.5em;
      padding-inline: var(--ds-spacing-1);
      white-space: pre;
    }
    .aesir-code-window__line[data-highlighted] {
      background: var(--ds-accent-surface);
    }
    .aesir-code-window__line[data-added] {
      background: var(--ds-surface-green);
    }
    .aesir-code-window__line[data-removed] {
      background: var(--ds-surface-red);
    }
    .aesir-code-window__line-number {
      width: var(--aesir-code-window-line-number-width, 3ch);
      flex: none;
      margin-inline-end: var(--ds-spacing-3);
      color: var(--ds-foreground-muted);
      font-variant-numeric: tabular-nums;
      text-align: end;
      user-select: none;
    }
    .aesir-code-window__code[data-line-numbers='false'] .aesir-code-window__line-number {
      display: none;
    }
    .aesir-code-window__line-content {
      flex: 1;
    }
    .aesir-code-window__floating-copy {
      position: absolute;
      top: var(--ds-spacing-2);
      right: var(--ds-spacing-2);
      opacity: 0;
      transition: opacity var(--ds-motion-duration-subtle, 120ms);
    }
    .aesir-code-window:hover .aesir-code-window__floating-copy,
    .aesir-code-window:focus-within .aesir-code-window__floating-copy {
      opacity: 1;
    }
    .aesir-code-window__floating-copy :is(.aesir-button) {
      background: var(--ds-background-secondary);
    }
    .aesir-code-window__announcement {
      position: absolute;
      width: var(--ds-spacing-px);
      height: var(--ds-spacing-px);
      overflow: hidden;
      clip-path: inset(50%);
    }
    @media (hover: none) {
      .aesir-code-window__floating-copy {
        opacity: 1;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .aesir-code-window__floating-copy {
        transition: none;
      }
    }
  }
</style>
