<script>
  import { AesirButton, AesirIcon, AesirSelectionToolbar, AesirTooltip } from '@aesir/svelte';

  let selected = $state(4);
</script>

<div class="example">
  <p>Select records to reveal contextual actions.</p>
  <AesirButton variant="outline" onclick={() => (selected = 4)}>Select 4 records</AesirButton>

  <AesirSelectionToolbar count={selected} onclear={() => (selected = 0)}>
    {#snippet actions()}
      <AesirTooltip content="Move selected">
        {#snippet trigger(props)}
          <AesirButton variant="ghost" size="icon" aria-label="Move selected" {...props}><AesirIcon name="move-up-right" /></AesirButton>
        {/snippet}
      </AesirTooltip>
      <AesirTooltip content="Archive selected">
        {#snippet trigger(props)}
          <AesirButton {...props} variant="ghost" size="icon" aria-label="Archive selected" onclick={() => (selected = 0)}><AesirIcon name="inbox" /></AesirButton>
        {/snippet}
      </AesirTooltip>
      <AesirTooltip content="Delete selected">
        {#snippet trigger(props)}
          <AesirButton {...props} variant="destructive" size="icon" aria-label="Delete selected" onclick={() => (selected = 0)}><AesirIcon name="trash-2" /></AesirButton>
        {/snippet}
      </AesirTooltip>
    {/snippet}
  </AesirSelectionToolbar>
</div>

<style>
  .example {
    display: flex;
    min-height: var(--ds-sizing-3xs);
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: var(--ds-spacing-3);
  }

  p {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }
</style>
