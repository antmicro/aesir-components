<script>
  import { resolveInternalHref } from '$lib/utils.js';
  import DocsExample from './docs-example.svelte';
  import source from './examples/sidebar-app-example.svelte?example';

  let viewport = $state('desktop');
  const mobile = $derived(viewport === 'mobile');
  const frameHeight = $derived(mobile ? 560 : 520);
  const src = $derived(`${resolveInternalHref('/examples/sidebar/app/')}?mode=${mobile ? 'mobile' : 'desktop'}`);
</script>

<DocsExample title="App sidebar" {source} bind:viewport height={frameHeight} openHref={src} contentless>
  <div class="sandbox__viewport">
    <div class="sandbox__stage"><iframe title="App sidebar" {src} loading="lazy" height={frameHeight}></iframe></div>
  </div>
</DocsExample>

<style>
  .sandbox__viewport {
    background: var(--ds-background-secondary);
  }
  .sandbox__stage {
    position: relative;
    width: 100%;
    margin-inline: auto;
  }
  iframe {
    display: block;
    width: 100%;
    border: 0;
    background: var(--ds-background);
  }
</style>
