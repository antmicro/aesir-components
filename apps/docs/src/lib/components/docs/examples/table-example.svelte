<script>
  import { AesirTable } from '@aesir/svelte';

  const columns = [
    { key: 'service', label: 'Service' },
    { key: 'region', label: 'Region' },
    { key: 'status', label: 'Status' },
    { key: 'latency', label: 'Latency', align: 'end' }
  ];

  const rows = [
    { id: 1, service: 'API', region: 'eu-central', status: 'Operational', latency: '82 ms' },
    { id: 2, service: 'Dashboard', region: 'us-east', status: 'Operational', latency: '104 ms' },
    { id: 3, service: 'Webhooks', region: 'eu-west', status: 'Degraded', latency: '318 ms' }
  ];

  const deploymentColumns = [
    { key: 'version', label: 'Version' },
    { key: 'environment', label: 'Environment' },
    { key: 'author', label: 'Author' },
    { key: 'age', label: 'Deployed', align: 'end' }
  ];

  const deployments = [
    { id: 1, version: 'v2.8.0', environment: 'Production', author: 'John Doe', age: '12 min ago' },
    { id: 2, version: 'v2.8.0-rc.2', environment: 'Preview', author: 'Jane Smith', age: '46 min ago' },
    { id: 3, version: 'v2.7.4', environment: 'Production', author: 'John Doe', age: '2 days ago' },
    { id: 4, version: 'v2.7.3', environment: 'Production', author: 'CI Pipeline', age: '5 days ago' }
  ];

  const detailColumns = [
    { key: 'label', label: 'Setting', rowHeader: true },
    { key: 'value', label: 'Value', align: 'end' }
  ];

  const details = [
    { id: 1, label: 'Region', value: 'eu-central-1' },
    { id: 2, label: 'Runtime', value: 'Node.js 22' },
    { id: 3, label: 'Autoscaling', value: 'Enabled' },
    { id: 4, label: 'Log retention', value: '30 days' }
  ];
</script>

<div class="table-example">
  <section>
    <h3>Default</h3>
    <AesirTable {columns} {rows} caption="Service health" />
  </section>

  <section>
    <h3>Striped and compact</h3>
    <AesirTable columns={deploymentColumns} rows={deployments} caption="Recent deployments" variant="striped" density="compact" />
  </section>

  <section>
    <h3>Minimal, copyable values</h3>
    <AesirTable columns={detailColumns} rows={details} caption="Project configuration" variant="minimal" showHeader={false} copyable copyColumn="value" copyLabel="Copy setting value" />
  </section>
</div>

<style>
  .table-example,
  .table-example section {
    display: grid;
    width: 100%;
    gap: var(--ds-spacing-4);
  }

  .table-example {
    gap: var(--ds-spacing-8);
  }

  .table-example h3 {
    margin: 0;
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
  }
</style>
