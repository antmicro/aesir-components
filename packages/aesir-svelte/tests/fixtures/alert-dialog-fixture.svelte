<script lang="ts">
  import { AesirAlertDialog, AesirButton } from '../../src/index.js';
  let open = $state(false);
  let confirmations = $state(0);
  let cancellations = $state(0);
  let asyncOpen = $state(false);
  let asyncConfirmations = $state(0);
  let settle: (() => void) | undefined;
  let fail: (() => void) | undefined;
  const confirmAsync = () => {
    asyncConfirmations += 1;
    return new Promise<void>((resolve, reject) => {
      settle = resolve;
      fail = () => reject(new Error('Request failed'));
    });
  };
</script>

<AesirButton onclick={() => (open = true)}>Delete project</AesirButton>
<AesirAlertDialog
  bind:open
  title="Delete project?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  destructive
  onconfirm={() => (confirmations += 1)}
  oncancel={() => (cancellations += 1)}
>
  <p>All project data will be removed.</p>
</AesirAlertDialog>
<output aria-label="Confirmations">{confirmations}</output>
<output aria-label="Cancellations">{cancellations}</output>
<AesirButton onclick={() => (asyncOpen = true)}>Publish project</AesirButton>
<AesirAlertDialog bind:open={asyncOpen} title="Publish project?" description="This makes the project visible." confirmLabel="Publish" errorText="Publishing failed." onconfirm={confirmAsync}>
  <AesirButton onclick={() => settle?.()}>Resolve publish</AesirButton>
  <AesirButton onclick={() => fail?.()}>Reject publish</AesirButton>
</AesirAlertDialog>
<output aria-label="Async confirmations">{asyncConfirmations}</output>
