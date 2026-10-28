<script>
  import { AesirSidebar } from '@aesir/svelte';

  const machines = [
    { value: 'desktop', label: 'workstation-01', description: 'lab-a.example', status: 'online', statusLabel: 'Online' },
    { value: 'skyfall', label: 'render-node-02', description: 'lab-b.example', status: 'online', statusLabel: 'Online' },
    { value: 'aurora', label: 'build-node-03', description: 'lab-c.example', status: 'maintenance', statusLabel: 'Maintenance' },
    { value: 'atlas', label: 'test-node-04', description: 'lab-c.example', status: 'offline', statusLabel: 'Offline' },
    { value: 'lab', label: 'storage-node-05', description: 'lab-a.example', status: 'offline', statusLabel: 'Offline' }
  ];

  let selected = $state('desktop');
</script>

<div class="sidebar-example">
  <AesirSidebar title="Machines" label="Machines" items={machines} bind:value={selected} />
  <div class="sidebar-example__content">
    <span>Selected machine</span>
    <strong>{machines.find((machine) => machine.value === selected)?.label}</strong>
  </div>
</div>

<style>
  .sidebar-example {
    display: flex;
    width: 100%;
    height: var(--ds-sizing-xl);
    overflow: hidden;
    border: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background);
  }

  .sidebar-example__content {
    display: grid;
    place-content: center;
    gap: var(--ds-spacing-1);
    padding: var(--ds-spacing-6);
    text-align: center;
    flex: 1;
  }

  .sidebar-example__content span {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }

  .sidebar-example__content strong {
    font-size: var(--ds-font-size-lg);
  }
</style>
