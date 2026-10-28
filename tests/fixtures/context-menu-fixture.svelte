<script>
  import { AesirContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSubmenu, ContextMenuTrigger } from '../../src/index.js';
  let { modal = true } = $props();

  let selected = $state('none');
  let outsideClicks = $state(0);
  let secondOpen = $state(false);
</script>

<AesirContextMenu {modal}>
  <ContextMenuTrigger>
    <button type="button">File surface</button>
  </ContextMenuTrigger>
  <ContextMenuContent aria-label="File actions">
    <ContextMenuItem onclick={() => (selected = 'copy')}>Copy</ContextMenuItem>
    <ContextMenuItem disabled>Archive</ContextMenuItem>
  </ContextMenuContent>
</AesirContextMenu>

<AesirContextMenu {modal} class="second-menu" bind:open={secondOpen}>
  <ContextMenuTrigger>
    <button type="button">Second surface</button>
  </ContextMenuTrigger>
  <ContextMenuContent aria-label="Second actions">
    <ContextMenuSubmenu label="Status" shortcut="s">
      <ContextMenuItem>Done</ContextMenuItem>
      <ContextMenuItem>Todo</ContextMenuItem>
    </ContextMenuSubmenu>
    <ContextMenuSubmenu label="Priority" shortcut="p">
      <ContextMenuItem>High</ContextMenuItem>
    </ContextMenuSubmenu>
    <ContextMenuItem>Inspect</ContextMenuItem>
  </ContextMenuContent>
</AesirContextMenu>

<button type="button" onclick={() => outsideClicks++}>Outside</button>
<output aria-label="Outside clicks">{outsideClicks}</output>
<button type="button" onclick={() => (secondOpen = false)}>Close second externally</button>
<button type="button" onclick={() => (secondOpen = true)}>Open second externally</button>
<output aria-label="Selected action">{selected}</output>

<style>
  :global(.second-menu) {
    margin-left: 24rem;
  }
</style>
