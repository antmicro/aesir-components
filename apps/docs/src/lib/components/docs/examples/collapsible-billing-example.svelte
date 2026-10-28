<script>
  import { AesirBadge, AesirCollapsible } from '@aesir/svelte';
</script>

<div class="billing-example">
  <AesirCollapsible title="View usage breakdown" triggerPosition="bottom" open>
    <div class="billing-example__heading">
      <strong>Preview environment usage</strong>
      <AesirBadge variant="outline">This week</AesirBadge>
    </div>
    <div class="billing-example__meter" aria-label="72 of 100 compute hours used">
      <span>72 / 100 compute hours</span>
      <span>72%</span>
      <div><span></span></div>
    </div>
    <dl>
      <div>
        <dt>Documentation previews</dt>
        <dd>38h</dd>
      </div>
      <div>
        <dt>Visual regression tests</dt>
        <dd>21h</dd>
      </div>
      <div>
        <dt>Package builds</dt>
        <dd>13h</dd>
      </div>
    </dl>
  </AesirCollapsible>
</div>

<style>
  .billing-example {
    width: min(100%, var(--ds-sizing-lg));
  }

  .billing-example__heading,
  .billing-example__meter,
  dl div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-spacing-3);
  }

  .billing-example__meter {
    margin-block: var(--ds-spacing-4);
    flex-wrap: wrap;
    padding: var(--ds-spacing-3);
    border-radius: var(--ds-radius-md);
    background: var(--ds-surface);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
  }

  .billing-example__meter > div {
    width: 100%;
    height: var(--ds-spacing-1-5);
    border-radius: var(--ds-radius-full);
    background: var(--ds-border);
    overflow: hidden;
  }

  .billing-example__meter > div span {
    display: block;
    width: 72%;
    height: 100%;
    background: var(--ds-foreground);
  }

  dl {
    display: grid;
    gap: var(--ds-spacing-2);
    margin: 0;
    font-size: var(--ds-font-size-sm);
  }

  dt {
    color: var(--ds-foreground-muted);
  }

  dd {
    margin: 0;
  }
</style>
