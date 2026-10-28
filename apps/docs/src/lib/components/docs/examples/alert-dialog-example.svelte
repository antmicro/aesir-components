<script>
  import { AesirAlertDialog, AesirButton } from '@aesir/svelte';
  let open = $state(false);
  let message = $state('');
</script>

<AesirButton variant="destructive" onclick={() => (open = true)}>Delete project</AesirButton>
<AesirAlertDialog
  bind:open
  title="Delete project?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  destructive
  onconfirm={() => (message = 'Project deleted')}
  oncancel={() => (message = 'Deletion canceled')}
>
  All linked data will be removed.
</AesirAlertDialog>
{#if message}<p role="status">{message}</p>{/if}
