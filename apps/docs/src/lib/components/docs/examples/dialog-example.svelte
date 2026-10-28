<script>
  import { AesirButton, AesirDialog, AesirInput } from '@aesir/svelte';

  let open = $state(false);
  let projectName = $state('Aesir Status');
</script>

<AesirButton variant="outline" onclick={() => (open = true)}>Edit project</AesirButton>

<AesirDialog bind:open title="Edit project" description="Update the project name shown across the workspace.">
  <AesirInput bind:value={projectName} label="Project name" />

  {#snippet footer({ close })}
    <AesirButton variant="ghost" onclick={close}>Cancel</AesirButton>
    <AesirButton onclick={close}>Save changes</AesirButton>
  {/snippet}
</AesirDialog>
