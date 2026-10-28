<script>
  import { AesirTabs } from '@aesir/svelte';

  const tabs = [
    { value: 'overview', label: 'Overview', content: 'Current availability is 99.99% across all production services.' },
    { value: 'deployments', label: 'Deployments', content: 'The latest deployment completed successfully 18 minutes ago.' },
    { value: 'settings', label: 'Settings', content: 'Configure regions, alerts, and maintenance windows.' }
  ];

  const badgeTabs = [
    { value: 'requirements', label: 'Requirements', content: 'Review the requirements extracted from this document.' },
    { value: 'text', label: 'Text', content: 'Read the source text alongside its requirements.' }
  ];

  let defaultTab = $state('overview');
  let smallTab = $state('overview');
  let fullTab = $state('overview');
  let lineTab = $state('overview');
  let badgeTab = $state('requirements');
</script>

<div class="tabs-example">
  <section>
    <p>Default</p>
    <AesirTabs bind:value={defaultTab} items={tabs} label="Workspace views" />
  </section>

  <section>
    <p>Small</p>
    <AesirTabs bind:value={smallTab} items={tabs} label="Compact workspace views" size="sm" />
  </section>

  <section>
    <p>Full width</p>
    <AesirTabs bind:value={fullTab} items={tabs} label="Full-width workspace views" width="full" border />
  </section>

  <section>
    <p>Line</p>
    <AesirTabs bind:value={lineTab} items={tabs} label="Workspace views, line style" variant="line" border />
  </section>

  <section>
    <p>Badge</p>
    <AesirTabs bind:value={badgeTab} items={badgeTabs} label="Document views" variant="badge" size="sm" />
  </section>
</div>

<style>
  .tabs-example,
  .tabs-example section {
    display: grid;
    gap: var(--ds-spacing-4);
    width: 100%;
  }

  .tabs-example {
    gap: var(--ds-spacing-8);
  }

  .tabs-example p {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
  }
</style>
