<script>
  import { AesirBadge, AesirButton, AesirCard, AesirIcon } from '@aesir/svelte';
</script>

<div class="card-example">
  <AesirCard title="Production API" description="api.antmicro.com · eu-central-1">
    {#snippet headerAction()}<AesirBadge variant="success">Live</AesirBadge>{/snippet}

    <div class="project-card">
      <div class="project-card__health">
        <span class="project-card__health-icon"><AesirIcon strokeWidth={4} name="check" /></span>
        <span>
          <strong>All systems operational</strong>
          <small>No incidents in the last 24 hours</small>
        </span>
      </div>

      <dl class="project-card__metrics">
        <div>
          <dt>Requests</dt>
          <dd>2.4M</dd>
        </div>
        <div>
          <dt>Latency</dt>
          <dd>42 ms</dd>
        </div>
        <div>
          <dt>Uptime</dt>
          <dd>99.99%</dd>
        </div>
      </dl>
    </div>

    {#snippet footer()}
      <div class="project-card__footer">
        <span>Updated 2 minutes ago</span>
        <AesirButton size="sm" variant="outline">View dashboard</AesirButton>
      </div>
    {/snippet}
  </AesirCard>
</div>

<style>
  .card-example {
    width: min(100%, var(--ds-sizing-lg));
    margin-inline: auto;
  }

  .project-card {
    display: grid;
    gap: var(--ds-spacing-5);
  }

  .project-card__health {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-3) var(--ds-spacing-4);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-surface-green);
  }

  .project-card__health-icon {
    display: grid;
    width: var(--ds-spacing-8);
    height: var(--ds-spacing-8);
    flex-shrink: 0;
    place-items: center;
    border-radius: var(--ds-radius-full);
    background: var(--ds-emphasis-green);
    color: var(--ds-fixed-white);
  }

  .project-card__health-icon :global(svg) {
    width: var(--ds-spacing-4);
    height: var(--ds-spacing-4);
  }

  .project-card__health strong,
  .project-card__health small {
    display: block;
  }

  .project-card__health strong {
    color: var(--ds-foreground-green);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
  }

  .project-card__health small {
    margin-top: var(--ds-spacing-0-5);
    color: var(--ds-foreground-muted-green);
    font-size: var(--ds-font-size-xs);
  }

  .project-card__metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin: 0;
  }

  .project-card__metrics div {
    padding-inline: var(--ds-spacing-4);
    border-left: var(--ds-spacing-px) solid var(--ds-border);
  }

  .project-card__metrics div:first-child {
    padding-left: 0;
    border-left: 0;
  }

  .project-card__metrics dt {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }

  .project-card__metrics dd {
    margin: var(--ds-spacing-1) 0 0;
    font-size: var(--ds-font-size-lg);
    font-weight: var(--ds-font-weight-medium);
  }

  .project-card__footer {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-spacing-4);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }

  @media (max-width: 479px) {
    .project-card__metrics {
      grid-template-columns: 1fr;
      gap: var(--ds-spacing-3);
    }

    .project-card__metrics div {
      padding: 0;
      border-left: 0;
    }

    .project-card__footer {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
