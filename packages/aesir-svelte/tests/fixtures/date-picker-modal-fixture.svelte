<script>
  import { AesirButton, AesirDatePicker, AesirDialog } from '../../src/index.js';
  let open = $state(false);
</script>

<AesirButton onclick={() => (open = true)}>Open scheduler</AesirButton>
<AesirDialog bind:open title="Scheduler">
  <AesirDatePicker label="Send date" value="2026-10-08" />
</AesirDialog>
