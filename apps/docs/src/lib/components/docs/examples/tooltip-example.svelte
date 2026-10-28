<script>
  import { AesirButton, AesirIcon, AesirTooltip } from '@aesir/svelte';
</script>

<div class="tooltip-example">
  <AesirTooltip content="Copy deployment URL">
    {#snippet trigger(props)}
      <AesirButton size="icon" variant="outline" aria-label="Copy deployment URL" {...props}>
        <AesirIcon name="copy" />
      </AesirButton>
    {/snippet}
  </AesirTooltip>

  <AesirTooltip content="This action cannot be undone" placement="bottom">
    {#snippet trigger(props)}
      <AesirButton variant="outline" {...props}>Delete deployment</AesirButton>
    {/snippet}
  </AesirTooltip>
</div>

<style>
  .tooltip-example {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-3);
  }
</style>
