<svelte:options
  customElement={{
    tag: 'aesir-command-menu',
    props: {
      open: { type: 'Boolean', reflect: true },
      showFooter: { type: 'Boolean', attribute: 'show-footer' }
    }
  }}
/>

<script>
  import { AesirCommandMenu } from '@aesir/svelte/components/aesir-command-menu';
  import { parseJson } from '../parse.js';

  let { open = $bindable(false), groups = [], placeholder = 'Type a command or search…', emptyText = 'No commands found.', label = 'Command menu', shortcut = 'k', showFooter = false } = $props();
  const host = $host();
  const parsedGroups = $derived(parseJson(groups));
  const selectItem = (item) => {
    host.dispatchEvent(new CustomEvent('select', { detail: item, bubbles: true, composed: true }));
  };
</script>

<AesirCommandMenu bind:open groups={parsedGroups} {placeholder} {emptyText} {label} {shortcut} {showFooter} onselect={selectItem} />
