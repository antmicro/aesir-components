<script>
  import { AesirBadge, AesirButton, AesirDropdown, AesirEmptyState, AesirIcon, AesirInput, AesirPagination, AesirSelectionToolbar, AesirTable } from '@aesir/svelte';

  const columns = [
    { key: 'vehicle', label: 'Vehicle', sortable: true, rowHeader: true, width: '12rem' },
    { key: 'driver', label: 'Driver', sortable: true, width: '8rem' },
    { key: 'status', label: 'Status', sortable: true, width: '7rem' },
    { key: 'battery', label: 'Battery', sortable: true, width: '6rem' },
    { key: 'location', label: 'Last location', sortable: true, width: '9rem' }
  ];
  const statusItems = [
    { value: 'On route', label: 'Set on route' },
    { value: 'Idle', label: 'Set idle' },
    { value: 'Charging', label: 'Set charging' },
    { value: 'Service', label: 'Schedule service' }
  ];
  let all = $state([
    { id: 1, vehicle: 'Van 001', plate: 'NY 4821K', driver: 'Maya Chen', status: 'On route', battery: 84, location: 'New York' },
    { id: 2, vehicle: 'Van 002', plate: 'MA 9034L', driver: 'Noah Williams', status: 'Charging', battery: 36, location: 'Boston' },
    { id: 3, vehicle: 'Van 003', plate: 'IL 7148M', driver: 'Ava Patel', status: 'On route', battery: 72, location: 'Chicago' },
    { id: 4, vehicle: 'Van 004', plate: 'TX 2651N', driver: 'Unassigned', status: 'Idle', battery: 95, location: 'Austin' },
    { id: 5, vehicle: 'Van 005', plate: 'WA 5517P', driver: 'Leo Martin', status: 'Service', battery: 18, location: 'Seattle' },
    { id: 6, vehicle: 'Van 006', plate: 'CO 1836R', driver: 'Maya Chen', status: 'On route', battery: 61, location: 'Denver' },
    { id: 7, vehicle: 'Van 007', plate: 'GA 8472S', driver: 'Noah Williams', status: 'Idle', battery: 88, location: 'Atlanta' },
    { id: 8, vehicle: 'Van 008', plate: 'CA 3926T', driver: 'Ava Patel', status: 'Charging', battery: 27, location: 'San Diego' },
    { id: 9, vehicle: 'Van 009', plate: 'FL 6264U', driver: 'Leo Martin', status: 'On route', battery: 79, location: 'Miami' },
    { id: 10, vehicle: 'Van 010', plate: 'NY 1175W', driver: 'Unassigned', status: 'Service', battery: 43, location: 'New York' }
  ]);
  const pageSize = 5;
  let query = $state('');
  let statusFilter = $state('all');
  let density = $state('default');
  const statusFilters = [
    { value: 'all', label: 'All statuses' },
    { value: 'On route', label: 'On route' },
    { value: 'Idle', label: 'Idle' },
    { value: 'Charging', label: 'Charging' },
    { value: 'Service', label: 'Service' }
  ];
  const densities = [
    { value: 'default', label: 'Comfortable', icon: 'list' },
    { value: 'compact', label: 'Compact', icon: 'list-collapse' }
  ];
  const selectedStatus = $derived(statusFilters.find((item) => item.value === statusFilter) ?? statusFilters[0]);
  const selectedDensity = $derived(densities.find((item) => item.value === density) ?? densities[0]);
  const statusFilterItems = $derived(statusFilters.map((item) => ({ ...item, role: 'menuitemradio', checked: item.value === statusFilter })));
  const densityItems = $derived(densities.map((item) => ({ ...item, role: 'menuitemradio', checked: item.value === density })));
  let sortKey = $state('vehicle');
  let sortDirection = $state('ascending');
  let page = $state(1);
  let selected = $state([]);
  const filtered = $derived(
    all
      .filter((row) => {
        const matchesQuery = [row.vehicle, row.plate, row.driver, row.location].some((value) => value.toLowerCase().includes(query.trim().toLowerCase()));
        return matchesQuery && (statusFilter === 'all' || row.status === statusFilter);
      })
      .toSorted((a, b) => {
        const comparison = typeof a[sortKey] === 'number' && typeof b[sortKey] === 'number' ? a[sortKey] - b[sortKey] : String(a[sortKey]).localeCompare(String(b[sortKey]));
        return sortDirection === 'ascending' ? comparison : -comparison;
      })
  );
  const totalPages = $derived(Math.max(1, Math.ceil(filtered.length / pageSize)));
  const rows = $derived(filtered.slice((page - 1) * pageSize, page * pageSize));

  const setStatus = (id, status) => {
    all = all.map((row) => (row.id === id ? { ...row, status } : row));
  };

  const addVehicle = () => {
    const id = Math.max(0, ...all.map((row) => row.id)) + 1;
    all = [{ id, vehicle: `Van ${String(id).padStart(3, '0')}`, plate: `NY ${String(id).padStart(4, '0')}Z`, driver: 'Unassigned', status: 'Idle', battery: 100, location: 'New York' }, ...all];
    query = '';
    statusFilter = 'all';
    sortKey = 'vehicle';
    sortDirection = 'descending';
    page = 1;
  };

  const serviceSelected = () => {
    all = all.map((row) => (selected.includes(row.id) ? { ...row, status: 'Service' } : row));
    selected = [];
  };

  const deleteSelected = () => {
    all = all.filter((row) => !selected.includes(row.id));
    selected = [];
    page = 1;
  };
</script>

<div class="pattern">
  <div class="toolbar">
    <AesirInput type="search" bind:value={query} oninput={() => (page = 1)} placeholder="Search vehicles…" aria-label="Search vehicles" />
    <AesirDropdown
      class="fleet-filter"
      items={statusFilterItems}
      label="Filter by status"
      matchTriggerWidth
      onselect={(item) => {
        statusFilter = item.value;
        page = 1;
      }}
    >
      {#snippet trigger(props)}
        <AesirButton {...props} variant="outline" width="full" aria-label={`Filter by status: ${selectedStatus.label}`}>
          <span class="status-dot" data-status={statusFilter} aria-hidden="true"></span>
          <span>{selectedStatus.label}</span>
          <AesirIcon name="chevron-down" size={16} class="filter-chevron" />
        </AesirButton>
      {/snippet}
      {#snippet itemContent({ item })}
        <span class="filter-option">
          <span class="status-dot" data-status={item.value} aria-hidden="true"></span>
          <span>{item.label}</span>
          {#if item.checked}<AesirIcon name="check" size={16} class="filter-check" />{/if}
        </span>
      {/snippet}
    </AesirDropdown>
    <AesirDropdown class="fleet-filter" items={densityItems} label="Table density" matchTriggerWidth onselect={(item) => (density = item.value)}>
      {#snippet trigger(props)}
        <AesirButton {...props} variant="outline" width="full" aria-label={`Table density: ${selectedDensity.label}`}>
          <AesirIcon name={selectedDensity.icon} size={16} />
          <span>{selectedDensity.label}</span>
          <AesirIcon name="chevron-down" size={16} class="filter-chevron" />
        </AesirButton>
      {/snippet}
      {#snippet itemContent({ item })}
        <span class="filter-option">
          <AesirIcon name={item.icon} size={16} />
          <span>{item.label}</span>
          {#if item.checked}<AesirIcon name="check" size={16} class="filter-check" />{/if}
        </span>
      {/snippet}
    </AesirDropdown>
    <AesirButton variant="accent" onclick={addVehicle}>Add vehicle</AesirButton>
  </div>

  {#if rows.length}
    <AesirTable class="fleet-table" {columns} {rows} aria-label="Fleet vehicles" layout="fixed" tableStyle="min-width: 50rem" {density} selectable bind:selected bind:sortKey bind:sortDirection>
      {#snippet cell({ row, column, value })}
        {#if column.key === 'vehicle'}
          <span class="vehicle">
            <span class="vehicle__icon" aria-hidden="true"><AesirIcon name="truck" size={16} /></span>
            <span class="vehicle__labels">
              <strong>{row.vehicle}</strong>
              <small>{row.plate}</small>
            </span>
          </span>
        {:else if column.key === 'status'}
          <AesirBadge size="sm" variant={value === 'On route' ? 'success' : value === 'Service' ? 'warning' : value === 'Charging' ? 'info' : 'secondary'}>{value}</AesirBadge>
        {:else if column.key === 'battery'}
          <span class="battery" data-level={row.battery < 25 ? 'low' : row.battery < 50 ? 'medium' : 'high'}>
            <span class="battery__dot" aria-hidden="true"></span>
            {row.battery}%
          </span>
        {:else if column.key === 'location'}
          <span class="location">{value}</span>
        {:else}
          {value}
        {/if}
      {/snippet}
      {#snippet rowActions({ row })}
        <span class="row-actions">
          <AesirButton
            variant="ghost"
            size="icon-sm"
            aria-label={row.status === 'Service' ? `Return ${row.vehicle} to idle` : `Schedule service for ${row.vehicle}`}
            title={row.status === 'Service' ? 'Return to idle' : 'Schedule service'}
            onclick={() => setStatus(row.id, row.status === 'Service' ? 'Idle' : 'Service')}
          >
            <AesirIcon name="wrench" size={16} />
          </AesirButton>
          <AesirDropdown items={statusItems} label={`Status for ${row.vehicle}`} align="end" onselect={(item) => setStatus(row.id, item.value)}>
            {#snippet trigger(props)}
              <AesirButton {...props} variant="ghost" size="icon-sm" aria-label={`More actions for ${row.vehicle}`} title="Change status"><AesirIcon name="ellipsis" size={16} /></AesirButton>
            {/snippet}
          </AesirDropdown>
        </span>
      {/snippet}
    </AesirTable>
    <div class="footer">
      <span>{selected.length} selected · {filtered.length} vehicles</span>
      <AesirPagination bind:page {totalPages} />
    </div>
  {:else}
    <AesirEmptyState title="No matching vehicles" description="Try another search term or status." />
  {/if}

  <AesirSelectionToolbar count={selected.length} onclear={() => (selected = [])}>
    {#snippet actions()}
      <AesirButton variant="ghost" size="sm" onclick={serviceSelected}><AesirIcon name="wrench" size={16} /> Schedule service</AesirButton>
      <AesirButton variant="destructive" size="sm" onclick={deleteSelected}><AesirIcon name="trash-2" size={16} /> Remove</AesirButton>
    {/snippet}
  </AesirSelectionToolbar>
</div>

<style>
  .pattern {
    display: grid;
    width: 100%;
    gap: var(--ds-spacing-4);
  }
  .toolbar,
  .footer {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--ds-spacing-3);
  }
  .toolbar :global(.aesir-input) {
    min-width: min(100%, var(--ds-spacing-40));
    flex: 1;
  }
  .toolbar :global(.fleet-filter) {
    width: min(100%, var(--ds-spacing-40));
  }
  .toolbar :global(.fleet-filter .aesir-button) {
    justify-content: flex-start;
  }
  .pattern :global(.filter-chevron),
  .pattern :global(.filter-check) {
    margin-inline-start: auto;
  }
  .filter-option {
    display: flex;
    width: 100%;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
  .status-dot {
    display: inline-block;
    width: var(--ds-spacing-2);
    height: var(--ds-spacing-2);
    flex: none;
    border-radius: var(--ds-radius-full);
    background: var(--ds-foreground-muted);
  }
  .status-dot[data-status='On route'] {
    background: var(--ds-emphasis-green);
  }
  .status-dot[data-status='Charging'] {
    background: var(--ds-emphasis-blue);
  }
  .status-dot[data-status='Service'] {
    background: var(--ds-emphasis-orange);
  }
  .toolbar > :global(.aesir-button) {
    margin-inline-start: auto;
  }
  .vehicle {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
  .vehicle__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--ds-spacing-8);
    height: var(--ds-spacing-8);
    flex: none;
    border-radius: var(--ds-radius-md);
    background: var(--ds-surface);
    color: var(--ds-foreground-muted);
  }
  .vehicle__labels {
    display: grid;
    min-width: 0;
    gap: var(--ds-spacing-0-5);
  }
  .vehicle__labels strong {
    overflow: hidden;
    color: var(--ds-foreground);
    font-weight: var(--ds-font-weight-medium);
    text-overflow: ellipsis;
  }
  .vehicle__labels small {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-regular);
  }
  .pattern :global(.fleet-table[data-density='compact'] .vehicle__icon) {
    width: var(--ds-spacing-6);
    height: var(--ds-spacing-6);
  }
  .pattern :global(.fleet-table[data-density='compact'] .vehicle__labels) {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-1);
  }
  .pattern :global(.fleet-table[data-density='compact'] .vehicle__labels small) {
    font-size: var(--ds-font-size-xxs);
  }
  .battery {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-spacing-2);
    font-variant-numeric: tabular-nums;
  }
  .battery__dot {
    width: var(--ds-spacing-2);
    height: var(--ds-spacing-2);
    flex: none;
    border-radius: var(--ds-radius-full);
    background: var(--ds-emphasis-green);
  }
  .battery[data-level='medium'] .battery__dot {
    background: var(--ds-emphasis-orange);
  }
  .battery[data-level='low'] .battery__dot {
    background: var(--ds-emphasis-red);
  }
  .location {
    color: var(--ds-foreground-muted);
  }
  .row-actions {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--ds-spacing-1);
  }
  .footer {
    justify-content: space-between;
  }
  .footer > span {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  @media (max-width: 40rem) {
    .toolbar > :global(.aesir-button) {
      margin-inline-start: 0;
    }
  }
</style>
