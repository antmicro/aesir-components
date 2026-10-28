<script>
  import { AesirCommandMenu } from '../../src/components/aesir-command-menu/index.js';

  let open = $state(false);
  let secondChild = $state('Second child');
  const groups = $derived([
    {
      label: 'Actions',
      items: [
        {
          label: 'Workspace',
          description: 'First workspace',
          groups: [{ label: 'First', items: [{ label: 'First child' }] }]
        },
        {
          label: 'Workspace',
          description: 'Second workspace',
          groups: [{ label: 'Second', items: [{ label: secondChild }] }]
        }
      ]
    }
  ]);
</script>

<button type="button" onclick={() => (open = true)}>Open commands</button>
<button type="button" onclick={() => (secondChild = 'Updated second child')}>Update second workspace</button>
<AesirCommandMenu bind:open {groups} shortcut={false} />
