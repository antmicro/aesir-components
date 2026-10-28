<script>
  import { AesirContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from '@aesir/svelte';
  let selected = $state('Right-click the surface');
</script>

<AesirContextMenu style="width: 100%">
  <ContextMenuTrigger>
    <button class="surface" type="button">{selected}</button>
  </ContextMenuTrigger>
  <ContextMenuContent aria-label="File actions">
    <ContextMenuItem icon="copy" shortcut="C" onclick={() => (selected = 'Copied')}>Copy</ContextMenuItem>
    <ContextMenuItem icon="edit" shortcut="E" onclick={() => (selected = 'Renamed')}>Rename</ContextMenuItem>
    <ContextMenuItem disabled>Archive</ContextMenuItem>
    <ContextMenuItem icon="trash-2" variant="destructive" onclick={() => (selected = 'Deleted')}>Delete</ContextMenuItem>
  </ContextMenuContent>
</AesirContextMenu>

<style>
  .surface {
    width: 100%;
    display: grid;
    min-height: 12rem;
    box-sizing: border-box;
    place-items: center;
    padding: var(--ds-spacing-6);
    border: 1px dashed var(--ds-border);
    border-radius: var(--ds-radius-lg);
    color: var(--ds-foreground-muted);
    outline: none;
    background: transparent;
    font: inherit;
    text-align: center;
  }
  .surface:focus-visible {
    box-shadow: 0 0 0 2px var(--ds-accent-ring);
  }
</style>
