<script lang="ts">
  import AesirButton from '../../src/components/aesir-button/aesir-button.svelte';
  import AesirDropdown from '../../src/components/aesir-dropdown/aesir-dropdown.svelte';
  let { modal = true } = $props();

  const items = [
    { label: 'Edit', value: 'edit' },
    { label: 'Duplicate', value: 'duplicate' },
    {
      label: 'More',
      value: 'more',
      items: [
        { label: 'Move', value: 'move' },
        { label: 'Share', value: 'share' }
      ]
    },
    { label: 'Archive', value: 'archive', disabled: true }
  ];
  let selected = $state('none');
  let outsideClicks = $state(0);
  let checked = $state<string[]>([]);
</script>

<AesirDropdown {items} {modal} label="Project actions" onselect={(item) => (selected = item.value ?? 'none')}>
  {#snippet trigger(props)}
    <AesirButton {...props}>Actions</AesirButton>
  {/snippet}
</AesirDropdown>
<button type="button" onclick={() => outsideClicks++}>Outside</button>
<output aria-label="Outside clicks">{outsideClicks}</output>
<output aria-label="Selected action">{selected}</output>

<AesirDropdown
  {modal}
  closeOnSelect={false}
  label="Status filters"
  items={['Todo', 'In progress'].map((label) => ({ label, value: label, role: 'menuitemcheckbox', checked: checked.includes(label) }))}
  onselect={(item) => (checked = checked.includes(item.value) ? checked.filter((value) => value !== item.value) : [...checked, item.value])}
>
  {#snippet trigger(props)}
    <AesirButton {...props}>Filters</AesirButton>
  {/snippet}
</AesirDropdown>
<output aria-label="Selected filters">{checked.join(', ')}</output>
