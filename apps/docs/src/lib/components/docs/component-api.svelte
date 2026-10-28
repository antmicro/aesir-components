<script>
  import DocsTable from './docs-table.svelte';
  import { componentApiByRoute, componentApiForPlatform } from '$lib/docs/component-api-data.js';
  import { getDocsPlatform } from '$lib/docs/platform-context.svelte.js';
  import { AesirToggleGroup, AesirToggleGroupItem } from '@aesir/svelte';

  let { route } = $props();

  const platform = getDocsPlatform();
  const api = $derived(componentApiByRoute[route]);
  const supportsHtml = $derived(Array.isArray(api) || Boolean(api?.html?.length));
  const activePlatform = $derived(supportsHtml ? platform.value : 'svelte');
  const columns = $derived([
    { key: 'name', label: activePlatform === 'html' ? 'Attribute' : 'Prop', width: 'var(--ds-spacing-40)', code: true },
    { key: 'type', label: 'Type', width: 'var(--ds-spacing-56)', code: true },
    { key: 'default', label: 'Default', width: 'var(--ds-spacing-32)', code: true },
    { key: 'description', label: 'Description' }
  ]);

  const groups = $derived(componentApiForPlatform(route, activePlatform));
</script>

{#if groups.length}
  <section class="component-api">
    <header class="component-api__header">
      <h2>API Reference</h2>
      {#if supportsHtml}
        <AesirToggleGroup type="single" required value={platform.value} onvaluechange={(value) => (platform.value = value)} size="sm" spacing={0} label="Component platform">
          <AesirToggleGroupItem value="svelte">Svelte</AesirToggleGroupItem>
          <AesirToggleGroupItem value="html">Custom Elements</AesirToggleGroupItem>
        </AesirToggleGroup>
      {/if}
    </header>
    {#each groups as group (group.title)}
      <div class="component-api__group">
        {#if groups.length > 1}<h3>{group.title}</h3>{/if}
        <DocsTable {columns} rows={group.rows} minWidth="var(--ds-sizing-3xl)" codeTone="neutral" />
        {#if group.note}<p>{group.note}</p>{/if}
      </div>
    {/each}
  </section>
{/if}

<style>
  .component-api {
    display: grid;
    gap: var(--ds-spacing-6);
    margin-top: var(--ds-spacing-10);
  }

  .component-api h2,
  .component-api h3,
  .component-api p {
    margin: 0;
  }

  .component-api__group {
    display: grid;
    gap: var(--ds-spacing-3);
  }

  .component-api__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-spacing-3);
  }

  .component-api h3 {
    font-size: var(--ds-font-size-lg);
  }

  .component-api p {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
  }
</style>
