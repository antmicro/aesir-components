<script>
  import { AesirSelect, AesirTable } from '@aesir/svelte';

  let density = $state('lg');
  const options = [
    { value: 'xs', label: 'XS · 24px' },
    { value: 'sm', label: 'SM · 32px' },
    { value: 'md', label: 'MD · 40px' },
    { value: 'lg', label: 'LG · 48px' },
    { value: 'xl', label: 'XL · 64px' }
  ];
  const columns = [
    { key: 'name', label: 'Service' },
    { key: 'region', label: 'Region' },
    { key: 'status', label: 'Status' }
  ];
  const rows = [
    { id: 1, name: 'API', region: 'eu-central', status: 'Operational' },
    { id: 2, name: 'Dashboard', region: 'us-east', status: 'Operational' },
    { id: 3, name: 'Webhooks', region: 'eu-west', status: 'Degraded' }
  ];
</script>

<div class="density-example">
  <div class="density-control"><AesirSelect label="Density" {options} bind:value={density} /></div>
  <AesirTable {columns} {rows} {density} />
</div>

<style>
  .density-example {
    display: grid;
    width: 100%;
    gap: var(--ds-spacing-4);
  }
  .density-control {
    width: min(100%, var(--ds-spacing-48));
  }
</style>
