<script lang="ts">
  import AesirButton from '../../src/components/aesir-button/aesir-button.svelte';
  import AesirCommandMenu from '../../src/components/aesir-command-menu/aesir-command-menu.svelte';
  import AesirDialog from '../../src/components/aesir-dialog/aesir-dialog.svelte';

  let open = $state(false);
  let commandOpen = $state(false);
  const groups = [{ items: [{ label: 'Nested action' }] }];
</script>

<AesirButton onclick={() => (open = true)}>Open settings</AesirButton>
<output aria-label="Dialog state">{open ? 'open' : 'closed'}</output>

<AesirDialog bind:open title="Settings" description="Manage workspace settings.">
  <button type="button">First action</button>
  <button type="button">Last action</button>
  <button type="button" onclick={() => (commandOpen = true)}>Open nested commands</button>
</AesirDialog>

<AesirCommandMenu bind:open={commandOpen} {groups} shortcut={false} label="Nested commands" />
