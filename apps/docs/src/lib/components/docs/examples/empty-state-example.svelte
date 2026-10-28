<script>
  import { AesirButton, AesirEmptyState, AesirIcon } from '@aesir/svelte';
</script>

<AesirEmptyState title="No projects yet" description="Create a project to organize documents, context, and collaborators.">
  {#snippet icon()}<AesirIcon name="folder-plus" />{/snippet}
  {#snippet actions()}<AesirButton variant="accent">Create project</AesirButton><AesirButton variant="secondary">Import</AesirButton>{/snippet}
</AesirEmptyState>
