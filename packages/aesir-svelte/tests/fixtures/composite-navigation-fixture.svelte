<script>
  import { AesirMenubar, AesirToggleGroup, AesirToggleGroupItem, AesirTreeView } from '../../src/index.js';

  const treeItems = [
    {
      value: 'src',
      label: 'src',
      items: [
        { value: 'components', label: 'components', items: [{ value: 'button', label: 'button.svelte' }] },
        { value: 'routes', label: 'routes' }
      ]
    },
    { value: 'package', label: 'package.json' }
  ];

  const menus = [
    {
      label: 'File',
      value: 'file',
      items: [
        { label: 'New file', value: 'new' },
        { label: 'Unavailable', value: 'unavailable', disabled: true },
        { label: 'Close file', value: 'close' }
      ]
    },
    {
      label: 'Edit',
      value: 'edit',
      disabled: true,
      items: [{ label: 'Undo', value: 'undo' }]
    },
    {
      label: 'View',
      value: 'view',
      items: [
        { label: 'Show sidebar', value: 'sidebar', role: 'menuitemcheckbox', checked: true },
        { label: 'Comfortable', value: 'comfortable', role: 'menuitemradio', checked: true }
      ]
    }
  ];

  let formatting = $state(['bold']);
  let treeValue = $state('package');
  let expanded = $state([]);
  let selectedMenuItem = $state('none');
</script>

<AesirToggleGroup type="multiple" bind:value={formatting} label="Formatting">
  <AesirToggleGroupItem value="bold">Bold</AesirToggleGroupItem>
  <AesirToggleGroupItem value="italic" disabled>Italic</AesirToggleGroupItem>
  <AesirToggleGroupItem value="underline">Underline</AesirToggleGroupItem>
</AesirToggleGroup>
<output aria-label="Formatting value">{formatting.join(',')}</output>

<AesirTreeView items={treeItems} bind:value={treeValue} bind:expanded label="Project files" />
<output aria-label="Tree value">{treeValue}</output>
<output aria-label="Expanded branches">{expanded.join(',')}</output>

<AesirMenubar {menus} onselect={(item) => (selectedMenuItem = item.value ?? item.label)} />
<output aria-label="Selected menu item">{selectedMenuItem}</output>
