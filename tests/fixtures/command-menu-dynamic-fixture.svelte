<script>
  import { AesirCommandMenu } from '../../src/components/aesir-command-menu/index.js';

  let open = $state(false);
  let selected = $state('none');
  let items = $state([
    { id: 'alpha', label: 'Alpha' },
    { id: 'beta', label: 'Beta' }
  ]);
</script>

<button type="button" onclick={() => (open = true)}>Open commands</button>
<button type="button" onclick={() => (items = [...items].reverse())}>Reorder commands</button>
<button type="button" onclick={() => (items = items.filter((item) => item.id !== 'beta'))}>Remove Beta</button>
<AesirCommandMenu bind:open groups={[{ label: 'Actions', items }]} shortcut={false} onselect={(item) => (selected = item.id)} />
<output aria-label="Selected command">{selected}</output>
