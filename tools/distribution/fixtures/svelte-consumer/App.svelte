<script lang="ts">
  import { AesirAccordion, type AccordionItem } from '@aesir/svelte/components/aesir-accordion';
  import { AesirAvatar } from '@aesir/svelte/components/aesir-avatar';
  import { AesirBadge } from '@aesir/svelte/components/aesir-badge';
  import { AesirButton } from '@aesir/svelte/components/aesir-button';
  import { AesirButtonGroup } from '@aesir/svelte/components/aesir-button-group';
  import { AesirCheckbox } from '@aesir/svelte/components/aesir-checkbox';
  import { AesirCollapsible } from '@aesir/svelte/components/aesir-collapsible';
  import { AesirCommandMenu, type CommandItem } from '@aesir/svelte/components/aesir-command-menu';
  import { AesirDialog } from '@aesir/svelte/components/aesir-dialog';
  import { AesirDrawer } from '@aesir/svelte/components/aesir-drawer';
  import { AesirDropdown } from '@aesir/svelte/components/aesir-dropdown';
  import { AesirIcon } from '@aesir/svelte/components/aesir-icon';
  import { AesirInput } from '@aesir/svelte/components/aesir-input';
  import { AesirKbd } from '@aesir/svelte/components/aesir-kbd';
  import { AesirMenubar } from '@aesir/svelte/components/aesir-menubar';
  import { AesirNativeSelect } from '@aesir/svelte/components/aesir-native-select';
  import { AesirPill } from '@aesir/svelte/components/aesir-pill';
  import { AesirPopover } from '@aesir/svelte/components/aesir-popover';
  import { AesirProgress } from '@aesir/svelte/components/aesir-progress';
  import { AesirQuantityStepper } from '@aesir/svelte/components/aesir-quantity-stepper';
  import { AesirRadio } from '@aesir/svelte/components/aesir-radio';
  import { AesirSeparator } from '@aesir/svelte/components/aesir-separator';
  import { AesirSlider } from '@aesir/svelte/components/aesir-slider';
  import { AesirSwitch } from '@aesir/svelte/components/aesir-switch';
  import { AesirTabs } from '@aesir/svelte/components/aesir-tabs';
  import { AesirTextarea } from '@aesir/svelte/components/aesir-textarea';
  import { AesirToggle } from '@aesir/svelte/components/aesir-toggle';
  import { AesirToggleGroup, AesirToggleGroupItem } from '@aesir/svelte/components/aesir-toggle-group';
  import { AesirTooltip } from '@aesir/svelte/components/aesir-tooltip';
  import { Content as ContextMenuContent, Item as ContextMenuItem, Root as ContextMenuRoot, Trigger as ContextMenuTrigger } from '@aesir/svelte/components/aesir-context-menu';

  const label: string = 'Installed package';
  let text = $state('');
  let checked = $state(false);
  let radio = $state<string | number>('first');
  let quantity = $state(1);
  let selection = $state<string | number | undefined>();
  let slider = $state(50);
  let dialogOpen = $state(false);
  let drawerOpen = $state(false);
  let dropdownOpen = $state(false);
  let popoverOpen = $state(false);
  let collapsibleOpen = $state(false);
  let contextMenuOpen = $state(false);
  let commandMenuOpen = $state(false);
  let menuValue = $state<string | null>(null);
  let accordionValue = $state<string | string[]>('details');
  let tabValue = $state<string | number>('preview');
  let togglePressed = $state(false);
  let toggleValues = $state<(string | number)[]>(['bold']);

  type ConsumerAccordionItem = AccordionItem & { detail: string };
  const accordionItems: ConsumerAccordionItem[] = [{ value: 'details', title: 'Details', content: 'Installed package', detail: 'Typed custom data' }];
</script>

{#snippet overlayTrigger(props: Record<string, unknown>)}
  <button type="button" {...props}>Open</button>
{/snippet}

{#snippet drawerContent(props: { close: () => void })}
  <button type="button" onclick={props.close}>Close</button>
{/snippet}

{#snippet dropdownTrigger(props: Record<string, unknown>)}
  <button type="button" {...props}>Actions</button>
{/snippet}

{#snippet dropdownItemContent(props: { item: { label?: string } })}
  {props.item.label}
{/snippet}

{#snippet popoverContent(props: { close: (options?: { skipMotion?: boolean }) => void })}
  <button type="button" onclick={() => props.close()}>Close</button>
{/snippet}

{#snippet collapsibleTrigger(props: { open: boolean })}
  Details: {props.open ? 'open' : 'closed'}
{/snippet}

{#snippet commandItem(item: CommandItem)}
  {item.label}{#if item.shortcut}
    ({item.shortcut}){/if}
{/snippet}

{#snippet accordionItem({ item }: { item: ConsumerAccordionItem; open: boolean })}
  {item.detail}
{/snippet}

<AesirButton variant="accent" size="sm">{label}</AesirButton>
<AesirButtonGroup><AesirButton>Grouped</AesirButton><AesirButton>Actions</AesirButton></AesirButtonGroup>
<AesirIcon name="check" size={16} label="Complete" />
<AesirBadge variant="success" size="sm">Ready</AesirBadge>
<AesirPill href="/docs" size="sm">Docs</AesirPill>
<AesirKbd ctrl>K</AesirKbd>
<AesirSeparator orientation="vertical" />
<AesirAvatar fallback="AE" size="sm" />
<AesirProgress value={40} max={100} variant="success" formatValue={(value, max) => `${value} of ${max}`} />
<AesirInput bind:value={text} label="Name" size="sm" />
<AesirTextarea bind:value={text} label="Notes" resize="auto" maxlength={200} />
<AesirCheckbox bind:checked label="Enabled" />
<AesirRadio bind:group={radio} value="first" label="First" />
<AesirSwitch bind:checked label="Notifications" />
<AesirSlider bind:value={slider} min={0} max={100} />
<AesirQuantityStepper bind:value={quantity} min={1} max={10} onchange={(value) => (quantity = value)} />
<AesirNativeSelect bind:value={selection} label="Choice" options={[{ value: 'first', label: 'First' }]} />
<AesirDialog bind:open={dialogOpen} title="Dialog">Content</AesirDialog>
<AesirDrawer bind:open={drawerOpen} side="right" header={drawerContent} children={drawerContent} />
<AesirDropdown
  bind:open={dropdownOpen}
  trigger={dropdownTrigger}
  itemContent={dropdownItemContent}
  items={[
    { label: 'Copy', value: 'copy', icon: 'copy', shortcut: '⌘+C', action: (item) => item.label },
    { label: 'More', value: 'more', items: [{ label: 'Archive', value: 'archive', variant: 'destructive' }] }
  ]}
  onselect={(item) => item.value}
/>
<AesirPopover bind:open={popoverOpen} trigger={overlayTrigger} content={popoverContent} placement="bottom" align="start" />
<AesirTooltip trigger={overlayTrigger} content="Helpful text" placement="top" />
<AesirCollapsible bind:open={collapsibleOpen} trigger={collapsibleTrigger}>Content</AesirCollapsible>
<AesirAccordion items={accordionItems} bind:value={accordionValue} itemContent={accordionItem} />
<AesirTabs bind:value={tabValue} items={[{ value: 'preview', label: 'Preview', content: 'Content' }]} />
<AesirToggle bind:pressed={togglePressed}>Bold</AesirToggle>
<AesirToggleGroup type="multiple" bind:value={toggleValues}><AesirToggleGroupItem value="bold">Bold</AesirToggleGroupItem></AesirToggleGroup>
<AesirCommandMenu
  bind:open={commandMenuOpen}
  shortcut={false}
  groups={[{ label: 'Actions', items: [{ id: 'copy', label: 'Copy', icon: 'copy', shortcut: ['⌘', 'C'], action: (item) => item.label }] }]}
  itemContent={commandItem}
  onselect={(item) => item.id}
/>
<ContextMenuRoot bind:open={contextMenuOpen}>
  <ContextMenuTrigger>Right click</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem icon="copy" shortcut="⌘+C" onclick={() => undefined}>Copy</ContextMenuItem>
  </ContextMenuContent>
</ContextMenuRoot>
<AesirMenubar
  bind:value={menuValue}
  menus={[{ label: 'File', items: [{ label: 'New', value: 'new', icon: 'file', shortcut: '⌘+N', action: (item) => item.label }] }]}
  onselect={(item) => item.label}
/>
