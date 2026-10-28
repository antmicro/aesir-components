<script>
  import { AesirStatusBar } from '@aesir/svelte';

  const day = 24 * 60 * 60 * 1000;
  const start = Date.UTC(2026, 4, 1);
  const incidents = [
    { offset: 10, status: 'degraded', label: 'Elevated API latency for 38 minutes.' },
    { offset: 32, status: 'maintenance', label: 'Scheduled database maintenance.' },
    { offset: 61, status: 'outage', label: 'API requests failed for 12 minutes.' }
  ];
  const events = incidents.map(({ offset, ...incident }) => ({ id: `incident-${offset}`, start: start + offset * day, ...incident }));
</script>

<AesirStatusBar label="API" status="operational" items={events} interval={day} total={90} startDate={start + 90 * day} defaultStatus="operational" />
