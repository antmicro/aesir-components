<script>
  const cards = ['Analytics', 'Deployments', 'Incidents', 'Settings'];
  const tiles = ['API', 'Dashboard', 'Webhooks', 'Workers'];
</script>

<div class="grid-example">
  <section>
    <h3>Responsive cards</h3>
    <div class="responsive-grid">
      {#each cards as card (card)}
        <article>{card}</article>
      {/each}
    </div>
  </section>

  <section>
    <h3>Spanning columns</h3>
    <div class="dashboard-grid">
      <header class="dashboard-grid__header">Status overview</header>
      <main class="dashboard-grid__main">Main content</main>
      <aside class="dashboard-grid__sidebar">Sidebar</aside>
    </div>
  </section>

  <section>
    <h3>Auto placement</h3>
    <div class="tile-grid">
      {#each tiles as tile (tile)}
        <div>{tile}</div>
      {/each}
    </div>
  </section>
</div>

<style>
  .grid-example,
  .grid-example section {
    display: grid;
  }

  .grid-example {
    width: 100%;
    gap: var(--ds-spacing-8);
  }

  .grid-example section {
    gap: var(--ds-spacing-3);
  }

  .grid-example h3 {
    margin: 0;
    color: var(--ds-foreground);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
  }

  .responsive-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--ds-spacing-48)), 1fr));
    gap: var(--ds-spacing-4);
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: var(--ds-spacing-4);
  }

  .dashboard-grid__header {
    grid-column: 1 / -1;
  }

  .dashboard-grid__main {
    grid-column: span 8;
  }

  .dashboard-grid__sidebar {
    grid-column: span 4;
  }

  .tile-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--ds-sizing-3xs)), 1fr));
    gap: var(--ds-spacing-4);
  }

  .responsive-grid article,
  .dashboard-grid > *,
  .tile-grid > * {
    min-width: 0;
    padding: var(--ds-spacing-4);
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-surface);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }
</style>
