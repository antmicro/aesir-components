<svelte:options customElement={{ tag: 'aesir-context-menu', props: { open: { type: 'Boolean', reflect: true }, modal: { type: 'String' } } }} />

<script>
  import { AesirContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSubmenu } from '@aesir/svelte/components/aesir-context-menu';
  import { parseJson } from '../parse.js';

  let { items = [], open = $bindable(false), modal = true, label = 'Context menu' } = $props();
  const host = $host();
  const parsedItems = $derived(parseJson(items));
  const selectItem = (item) => host.dispatchEvent(new CustomEvent('select', { detail: item, bubbles: true, composed: true }));
</script>

{#snippet menuItems(entries)}
  {#each entries as item, index (item.value ?? item.label ?? index)}
    {#if item.items?.length}
      <ContextMenuSubmenu label={item.label} icon={item.icon} shortcut={item.shortcut} disabled={item.disabled}>
        {@render menuItems(item.items)}
      </ContextMenuSubmenu>
    {:else}
      <ContextMenuItem icon={item.icon} shortcut={item.shortcut} variant={item.variant} disabled={item.disabled} onclick={() => selectItem(item)}>{item.label}</ContextMenuItem>
    {/if}
  {/each}
{/snippet}

<AesirContextMenu bind:open modal={modal !== false && modal !== 'false'}>
  <ContextMenuTrigger><slot></slot></ContextMenuTrigger>
  <ContextMenuContent aria-label={label}>
    {@render menuItems(parsedItems)}
  </ContextMenuContent>
</AesirContextMenu>
