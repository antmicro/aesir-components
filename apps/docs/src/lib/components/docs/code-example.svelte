<script>
  import { AesirCodeWindow } from '@aesir/svelte';
  import { toast } from '@aesir/svelte/components/aesir-toast';

  let { source, label = 'Code example', class: className = '', embedded = false } = $props();
</script>

{#if source}
  <AesirCodeWindow
    class={`code-example ${className}`.trim()}
    data-docs-toc-ignore
    {embedded}
    {label}
    code={source.code}
    oncopied={() => toast.success('Code copied')}
    oncopyerror={() => toast.error('Copy failed', 'Clipboard is not available in this context.')}
    style="--aesir-code-window-height:var(--docs-example-height, auto)"
  >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <div class="code-example__light">{@html source.lightHtml}</div>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <div class="code-example__dark">{@html source.darkHtml}</div>
  </AesirCodeWindow>
{/if}

<style>
  .code-example__light,
  .code-example__dark {
    min-width: max-content;
  }

  .code-example__light :global(pre),
  .code-example__dark :global(pre) {
    width: max-content;
    min-width: 100%;
    margin: 0;
    border: 0;
    border-radius: 0;
    overflow: visible;
  }

  .code-example__dark {
    display: none;
  }

  :global(html.dark) .code-example__light {
    display: none;
  }

  :global(html.dark) .code-example__dark {
    display: block;
  }
</style>
