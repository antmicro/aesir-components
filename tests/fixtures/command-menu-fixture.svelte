<script>
  import { AesirCommandMenu } from '../../src/components/aesir-command-menu/index.js';

  let open = $state(false);
  let selected = $state('none');

  const groups = [
    {
      label: 'Actions',
      items: [
        { id: 'create', label: 'Create issue' },
        { id: 'disabled', label: 'Delete project', disabled: true },
        {
          id: 'switch',
          label: 'Switch project',
          groups: [{ label: 'Projects', items: [{ id: 'aesir', label: 'Aesir' }] }]
        }
      ]
    }
  ];
</script>

<button type="button" onclick={() => (open = true)}>Open commands</button>
<AesirCommandMenu bind:open {groups} shortcut={false} onselect={(item) => (selected = item.id ?? item.label)} />
<output aria-label="Selected command">{selected}</output>
<output aria-label="Command menu state">{open ? 'open' : 'closed'}</output>
