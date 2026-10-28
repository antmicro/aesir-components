<script lang="ts">
  import AesirButton from '../../src/components/aesir-button/aesir-button.svelte';
  import AesirDropdown from '../../src/components/aesir-dropdown/aesir-dropdown.svelte';

  const items = [
    { label: 'Document', value: 'document' },
    { label: 'Templates', value: 'templates' },
    { label: 'Settings', value: 'settings' }
  ];
</script>

<div style="padding-left: 24px">
  <AesirDropdown {items} label="Editor actions" align="start" mobileBreakpoint={2000} contentStyle="width: 20rem">
    {#snippet trigger(props)}
      <AesirButton {...props}>Editing</AesirButton>
    {/snippet}
  </AesirDropdown>
</div>
