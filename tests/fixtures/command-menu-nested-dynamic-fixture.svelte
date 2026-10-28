<script>
  import { AesirCommandMenu } from '../../src/components/aesir-command-menu/index.js';

  let open = $state(false);
  let selected = $state('none');
  let nestedItems = $state([{ id: 'old', label: 'Old command' }]);
  const groups = $derived([
    {
      label: 'Actions',
      items: [
        {
          id: 'nested',
          label: 'Nested commands',
          groups: [{ label: 'Nested', items: nestedItems }]
        }
      ]
    }
  ]);
</script>

<button type="button" onclick={() => (open = true)}>Open commands</button>
<button type="button" onclick={() => (nestedItems = [{ id: 'new', label: 'New command' }])}>Replace nested commands</button>
<AesirCommandMenu bind:open {groups} shortcut={false} onselect={(item) => (selected = item.id)} />
<output aria-label="Selected command">{selected}</output>
