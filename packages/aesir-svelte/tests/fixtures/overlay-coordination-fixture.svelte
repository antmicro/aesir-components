<script>
  import { AesirButton, AesirContextMenu, AesirDropdown, AesirPopover, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../../src/index.js';

  let { modal = true } = $props();
  const dropdownItems = [{ label: 'Edit', value: 'edit' }];
</script>

<AesirDropdown items={dropdownItems} {modal} label="Actions">
  {#snippet trigger(triggerProps)}
    <AesirButton {...triggerProps}>Open dropdown</AesirButton>
  {/snippet}
</AesirDropdown>

<AesirPopover>
  {#snippet trigger(triggerProps)}
    <AesirButton {...triggerProps}>Open popover</AesirButton>
  {/snippet}
  {#snippet content()}
    <p>Popover content</p>
  {/snippet}
</AesirPopover>

<AesirContextMenu {modal}>
  <ContextMenuTrigger>
    <button type="button">Context surface</button>
  </ContextMenuTrigger>
  <ContextMenuContent aria-label="Context actions">
    <ContextMenuItem>Inspect</ContextMenuItem>
  </ContextMenuContent>
</AesirContextMenu>
