<script>
  import { AesirCommandMenu } from '../../src/components/aesir-command-menu/index.js';

  let open = $state(false);
  let selected = $state('none');
  const groups = [
    { items: [{ id: 'alpha', label: 'Alpha' }] },
    { items: [{ id: 'beta', label: 'Beta' }] },
    { label: 'More', items: [{ id: 'gamma', label: 'Gamma' }] },
    { label: 'More', items: [{ id: 'delta', label: 'Delta' }] }
  ];
</script>

<button type="button" onclick={() => (open = true)}>Open commands</button>
<AesirCommandMenu bind:open {groups} shortcut={false} onselect={(item) => (selected = item.id)} />
<output aria-label="Selected command">{selected}</output>
