<script>
  import { parseChatText } from './team-chat-formatting.js';
  let { text } = $props();
  const blocks = $derived(parseChatText(text));
</script>

{#snippet inline(nodes)}
  {#each nodes as node (node)}
    {#if node.type === 'bold'}<strong>{@render inline(node.children)}</strong>
    {:else if node.type === 'italic'}<em>{@render inline(node.children)}</em>
    {:else if node.type === 'underline'}<u>{@render inline(node.children)}</u>
    {:else if node.type === 'strike'}<s>{@render inline(node.children)}</s>
    {:else if node.type === 'code'}<code>{node.text}</code>
    {:else if node.type === 'link'}
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- Protocol-validated external message URL, not an application route. -->
      <a href={node.href} target="_blank" rel="noopener noreferrer">{@render inline(node.children)}</a>
    {:else}{node.text}{/if}
  {/each}
{/snippet}

<div class="chat-text">
  {#each blocks as block (block)}
    {#if block.type === 'codeblock'}<pre><code>{block.text}</code></pre>
    {:else if block.type === 'quote'}<blockquote>{@render inline(block.children)}</blockquote>
    {:else if block.type === 'list'}
      {#if block.ordered}<ol start={block.start}>
          {#each block.items as item (item)}<li>{@render inline(item)}</li>{/each}
        </ol>
      {:else}<ul>
          {#each block.items as item (item)}<li>{@render inline(item)}</li>{/each}
        </ul>{/if}
    {:else}<p>{@render inline(block.children)}</p>{/if}
  {/each}
</div>

<style>
  .chat-text {
    min-width: 0;
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-base);
    overflow-wrap: anywhere;
  }
  p,
  ul,
  ol,
  blockquote,
  pre {
    margin: var(--ds-spacing-1) 0 0;
  }
  p,
  li,
  blockquote {
    white-space: pre-wrap;
  }
  ul,
  ol {
    padding-left: var(--ds-spacing-5);
    list-style-position: outside;
  }
  ul {
    list-style-type: disc;
  }
  ol {
    list-style-type: decimal;
  }
  strong {
    font-weight: var(--ds-font-weight-semibold);
  }
  a {
    color: var(--ds-accent-text);
    text-decoration: underline;
    text-underline-offset: var(--ds-spacing-0-5);
  }
  a:focus-visible {
    outline: var(--ds-spacing-0-5) solid var(--ds-accent-ring);
    outline-offset: var(--ds-spacing-0-5);
  }
  blockquote {
    padding-left: var(--ds-spacing-3);
    border-left: var(--ds-spacing-0-5) solid var(--ds-border-active);
    color: var(--ds-foreground-muted);
  }
  code {
    padding: var(--ds-spacing-px) var(--ds-spacing-1);
    border-radius: var(--ds-radius-sm);
    background: var(--ds-surface);
    font-family: var(--ds-font-family-mono);
    font-size: var(--ds-font-size-xs);
  }
  pre {
    max-width: 100%;
    overflow: auto;
    padding: var(--ds-spacing-3);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    background: var(--ds-background-secondary);
  }
  pre code {
    padding: 0;
    background: none;
    white-space: pre;
  }
</style>
