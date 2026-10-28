<script lang="ts">
  import { createClipboard } from '../../utils/clipboard.svelte.js';
  import { AesirButton } from '../aesir-button/index.js';
  import { AesirIconSwap } from '../aesir-icon-swap/index.js';

  type SnippetProps = {
    text: string;
    label?: string;
    prompt?: boolean;
    class?: string;
  };

  let { text, label = 'Copy snippet', prompt = false, class: className = '' }: SnippetProps = $props();
  const clipboard = createClipboard<string>();
  const copied = $derived(clipboard.copied !== undefined && clipboard.copied === text);
  const copy = () => clipboard.copy(text, text);
</script>

<div class={`aesir-snippet ${className}`.trim()}>
  <div class="aesir-snippet__value" role="region" aria-label="Snippet value">
    {#if prompt}<span class="aesir-snippet__prompt" aria-hidden="true">$</span>{/if}
    <code>{text}</code>
  </div>
  <AesirButton variant="ghost" size="icon-sm" aria-label={copied ? 'Copied' : label} title={copied ? 'Copied' : label} onclick={copy}>
    <AesirIconSwap name="copy" activeName="check" active={copied} size={16} />
  </AesirButton>
  <span class="aesir-snippet__announcement" aria-live="polite">{copied ? 'Copied' : ''}</span>
</div>

<style>
  :global {
    .aesir-snippet {
      display: flex;
      min-width: 0;
      align-items: center;
      gap: var(--ds-spacing-2);
      padding: var(--ds-spacing-2);
      padding-inline-start: var(--ds-spacing-4);
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-lg);
      background: var(--ds-background-secondary);
    }
    .aesir-snippet__value {
      display: flex;
      min-width: 0;
      flex: 1;
      align-items: center;
      gap: var(--ds-spacing-2);
      overflow-x: auto;
      scrollbar-width: none;
      white-space: nowrap;
    }
    .aesir-snippet__value::-webkit-scrollbar {
      display: none;
    }
    .aesir-snippet__value code {
      color: var(--ds-foreground);
      font-family: var(--ds-font-family-mono);
      font-size: var(--ds-font-size-sm);
      white-space: pre;
    }
    .aesir-snippet__prompt {
      color: var(--ds-foreground-muted);
      font-family: var(--ds-font-family-mono);
    }
    .aesir-snippet > .aesir-button {
      flex: none;
    }
    .aesir-snippet__announcement {
      position: absolute;
      width: var(--ds-spacing-px);
      height: var(--ds-spacing-px);
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  }
</style>
