<svelte:options
  customElement={{
    tag: 'aesir-selection-toolbar',
    props: {
      count: { type: 'Number' },
      visible: { type: 'Boolean' }
    }
  }}
/>

<script>
  import { AesirSelectionToolbar } from '@aesir/svelte/components/aesir-selection-toolbar';

  let { count = 0, visible, label = 'selected', toolbarLabel = 'Selection actions', clearLabel = 'Clear selection', position = 'fixed' } = $props();
  const host = $host();
</script>

<AesirSelectionToolbar {count} {visible} {label} {toolbarLabel} {clearLabel} {position} onclear={() => host.dispatchEvent(new CustomEvent('clear', { bubbles: true, composed: true }))}>
  {#snippet actions()}<slot name="actions"></slot>{/snippet}
</AesirSelectionToolbar>
