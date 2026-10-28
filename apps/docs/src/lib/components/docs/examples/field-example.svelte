<script>
  import { AesirField, AesirNativeSelect } from '@aesir/svelte';
  let role = $state('');
  const roles = [
    { label: 'Viewer', value: 'viewer' },
    { label: 'Editor', value: 'editor' },
    { label: 'Admin', value: 'admin' }
  ];
</script>

<div class="example">
  <AesirField label="Role" description="Controls access to this workspace." required>
    {#snippet children({ controlId, describedBy, invalid, required })}
      <AesirNativeSelect id={controlId} aria-describedby={describedBy} aria-invalid={invalid || undefined} {required} bind:value={role} options={roles} placeholder="Select a role" />
    {/snippet}
  </AesirField>
</div>

<style>
  .example {
    width: min(100%, var(--ds-sizing-md));
  }
</style>
