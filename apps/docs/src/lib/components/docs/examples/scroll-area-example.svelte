<script>
  import { AesirScrollArea } from '@aesir/svelte';

  const deployments = Array.from({ length: 12 }, (_, index) => ({
    id: `deploy-${1248 - index}`,
    time: `${index + 8}:24`,
    status: index === 2 ? 'Rolled back' : 'Ready'
  }));
</script>

<div class="deployment-scroll-frame">
  <AesirScrollArea class="deployment-scroll">
    <ul class="deployment-list">
      {#each deployments as deployment (deployment.id)}
        <li>
          <span>
            <strong>{deployment.id}</strong>
            <small>{deployment.time}</small>
          </span>
          <small data-status={deployment.status}>{deployment.status}</small>
        </li>
      {/each}
    </ul>
  </AesirScrollArea>
</div>

<style>
  .deployment-scroll-frame {
    width: 100%;
    height: var(--ds-sizing-xs);
  }

  :global(.deployment-scroll) {
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-background-secondary);
  }

  .deployment-list {
    margin: 0;
    padding: var(--ds-spacing-2);
    list-style: none;
  }

  .deployment-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-spacing-4);
    padding: var(--ds-spacing-3);
    border-radius: var(--ds-radius-md);
  }

  .deployment-list li:hover {
    background: var(--ds-surface-hover);
  }

  .deployment-list span {
    display: grid;
    gap: var(--ds-spacing-0-5);
  }

  .deployment-list strong {
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
  }

  .deployment-list small {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }

  .deployment-list [data-status='Ready'] {
    color: var(--ds-foreground-green);
  }
</style>
