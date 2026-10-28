<script>
  import { AesirAccordion, AesirBadge } from '@aesir/svelte';

  const items = [
    { value: 'production', title: 'Production', status: 'Operational', detail: 'Last deployed 12 minutes ago', region: 'eu-central-1' },
    { value: 'staging', title: 'Staging', status: 'Degraded', detail: 'Elevated response times', region: 'eu-west-1' }
  ];
</script>

<div class="example">
  <AesirAccordion {items}>
    {#snippet itemContent({ item })}
      <div class="environment">
        <div>
          <span>{item.detail}</span>
          <small>{item.region}</small>
        </div>
        <AesirBadge size="xs" variant={item.status === 'Operational' ? 'success' : 'warning'}>{item.status}</AesirBadge>
      </div>
    {/snippet}
  </AesirAccordion>
</div>

<style>
  .example {
    width: min(100%, var(--ds-sizing-xl));
  }
  .environment {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: var(--ds-spacing-4);
  }
  .environment div {
    display: grid;
    gap: var(--ds-spacing-1);
  }
  small {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    line-height: var(--ds-font-line-height-xs);
  }
</style>
