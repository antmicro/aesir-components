<script>
  import { resolveInternalHref } from '$lib/utils.js';
  import DocsExample from './docs-example.svelte';
  import source from './examples/collaborative-editor/collaborative-editor-example.svelte?example';

  const frameHeight = 640;
  const src = resolveInternalHref('/examples/collaborative-editor/');
</script>

<DocsExample title="Collaborative editor" {source} height={frameHeight} openHref={src} contentless>
  <div class="sandbox__viewport">
    <iframe title="Collaborative editor" {src} loading="lazy" height={frameHeight}></iframe>
  </div>
</DocsExample>

<style>
  .sandbox__viewport {
    background: var(--ds-background);
  }
  iframe {
    display: block;
    width: 100%;
    border: 0;
    background: var(--ds-background);
  }
</style>
