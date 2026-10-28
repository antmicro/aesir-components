<script>
  import { resolve } from '$app/paths';
  import { AesirAlert } from '@aesir/svelte';
</script>

<div class="alert-example">
  <AesirAlert variant="info" icon="info" title="Deployment scheduled" description="The API will restart tonight at 23:00 UTC." />
  <AesirAlert variant="success" icon="check" title="All systems operational" description="No incidents have been reported in the last 24 hours." />
  <AesirAlert variant="warning" icon="triangle-alert" title="Elevated latency" description="Requests in the EU region may respond more slowly." />
  <AesirAlert variant="destructive" icon="alert-circle" title="Service unavailable" description="New deployments are temporarily blocked.">
    {#snippet action()}
      <a class="alert-example__action" href={resolve('/docs/components/toast/')}>View logs</a>
    {/snippet}
  </AesirAlert>
</div>

<style>
  .alert-example {
    display: grid;
    width: min(100%, var(--ds-sizing-xl));
    margin-inline: auto;
    gap: var(--ds-spacing-4);
  }

  .alert-example__action {
    display: inline-flex;
    min-height: var(--ds-spacing-7);
    align-items: center;
    padding-inline: var(--ds-spacing-2);
    border: var(--ds-spacing-px) solid var(--ds-border-red);
    border-radius: var(--ds-radius-md);
    color: var(--ds-foreground-red);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
    text-decoration: none;
    transition: background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
  }

  .alert-example__action:hover {
    background: var(--ds-surface-hover-red);
  }
</style>
