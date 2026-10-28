<script>
  import { AesirButton, AesirSelectionToolbar } from '../../src/index.js';

  let selected = $state(4);
  let lastAction = $state('');
</script>

<AesirSelectionToolbar count={selected} position="fixed" onclear={() => (selected = 0)}>
  {#snippet actions()}
    <AesirButton variant="ghost" onclick={() => (lastAction = 'Archive')}>Archive</AesirButton>
    <AesirButton variant="ghost" onclick={() => (lastAction = 'Duplicate')}>Duplicate</AesirButton>
    <AesirButton variant="ghost" onclick={() => (lastAction = 'Move')}>Move</AesirButton>
    <AesirButton variant="ghost" onclick={() => (lastAction = 'Share')}>Share</AesirButton>
    <AesirButton variant="ghost" onclick={() => (lastAction = 'Export')}>Export</AesirButton>
    <AesirButton variant="ghost" onclick={() => (lastAction = 'Print')}>Print</AesirButton>
    <AesirButton variant="ghost" onclick={() => (lastAction = 'Assign')}>Assign</AesirButton>
    <AesirButton variant="ghost" onclick={() => (lastAction = 'More')}>More</AesirButton>
  {/snippet}
</AesirSelectionToolbar>

<output aria-label="Last action">{lastAction}</output>
