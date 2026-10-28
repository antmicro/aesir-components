<script>
  import { AesirBadge, AesirCollapsible } from '@aesir/svelte';

  let open = $state(false);
</script>

<div class="collapsible-example">
  <AesirCollapsible bind:open indicator="plus-minus">
    {#snippet trigger({ open })}
      <span>Build #A-731</span>
      {#if !open}<AesirBadge variant="success" size="sm">Passed</AesirBadge>{/if}
    {/snippet}
    <dl>
      <div>
        <dt>Status</dt>
        <dd><AesirBadge variant="success" size="sm">Passed</AesirBadge></dd>
      </div>
      <div>
        <dt>Branch</dt>
        <dd>release/next</dd>
      </div>
      <div>
        <dt>Duration</dt>
        <dd>3m 42s</dd>
      </div>
    </dl>
  </AesirCollapsible>
</div>

<style>
  .collapsible-example {
    width: min(100%, var(--ds-sizing-lg));
  }

  :global(.collapsible-example .aesir-collapsible__trigger-content) {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
  }

  dl {
    display: grid;
    gap: var(--ds-spacing-2);
    margin: 0;
  }

  dl div {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--ds-spacing-1);
    padding: var(--ds-spacing-3);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
  }

  dt {
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
    line-height: var(--ds-font-line-height-sm);
  }

  dd {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    line-height: var(--ds-font-line-height-xs);
  }
</style>
