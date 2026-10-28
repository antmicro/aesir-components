<script>
  import { AesirToggle } from '@aesir/svelte';
  import { resolveInternalHref } from '$lib/utils.js';
  import DocsExample from './docs-example.svelte';
  import developerSource from './examples/navbar-developer-example.svelte?example';
  import marketingSource from './examples/navbar-marketing-example.svelte?example';
  import floatingSource from './examples/navbar-floating-example.svelte?example';
  let { variant = 'marketing', title = 'Navbar sandbox' } = $props();
  let viewport = $state('desktop');
  const mobile = $derived(viewport === 'mobile');
  let hover = $state(true);
  let mode = $state('preview');
  const source = $derived({ developer: developerSource, marketing: marketingSource, floating: floatingSource }[variant]);
  const frameHeight = $derived(mobile ? 560 : 400);
  const src = $derived(`${resolveInternalHref(`/examples/navbar/${variant}/`)}?trigger=${hover ? 'hover' : 'click'}`);
</script>

<DocsExample {title} {source} bind:mode bind:viewport height={frameHeight} openHref={src} contentless>
  {#snippet toolbar()}
    <div class="sandbox__controls">
      <AesirToggle size="sm" pressed={hover} disabled={mode === 'code'} onpressedchange={(value) => (hover = value)}>Hover menus</AesirToggle>
    </div>
  {/snippet}
  <div class="sandbox__viewport">
    <div class="sandbox__stage">
      <iframe {title} {src} loading="lazy" height={frameHeight}></iframe>
    </div>
  </div>
</DocsExample>

<style>
  .sandbox__controls {
    display: flex;
    flex-wrap: wrap;
    margin-left: auto;
    gap: var(--ds-spacing-1);
  }
  .sandbox__viewport {
    background: var(--ds-background-secondary);
  }
  .sandbox__stage {
    width: 100%;
    margin-inline: auto;
    position: relative;
  }
  iframe {
    display: block;
    width: 100%;
    border: 0;
    background: var(--ds-background);
  }
</style>
