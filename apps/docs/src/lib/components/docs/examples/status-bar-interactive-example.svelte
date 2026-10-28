<script>
  import { onMount } from 'svelte';
  import { AesirButton, AesirStatusBar } from '@aesir/svelte';

  const interval = 10_000;
  const initialEnd = Math.floor(Date.now() / interval) * interval;
  let events = $state(
    Array.from({ length: 60 }, (_, index) => ({
      id: `health-${index}`,
      time: new Date(initialEnd - (59 - index) * interval + 500),
      status: index % 19 === 0 ? 'degraded' : 'operational',
      label: index % 19 === 0 ? 'Response time above threshold' : 'Online'
    }))
  );
  let online = $state(true);
  let outageId = $state();
  let now = $state(Date.now());
  let nextId = 0;
  let secondsLeft = $derived(Math.max(0, Math.ceil((interval - (now % interval)) / 1000)));

  function toggleService() {
    const time = new Date();
    if (online) {
      outageId = `outage-${time.getTime()}`;
      events = [...events, { id: outageId, time, ongoing: true, status: 'outage', label: 'Service switched off' }];
      online = false;
      return;
    }

    events = events.map((event) => (event.id === outageId ? { ...event, ongoing: false, endTime: time } : event));
    events = [...events, { id: `recovery-${time.getTime()}`, time, status: 'operational', label: 'Service switched on' }];
    online = true;
    outageId = undefined;
  }

  function addLatencyEvent() {
    const time = new Date();
    events = [
      ...events,
      {
        id: `latency-${time.getTime()}-${nextId++}`,
        time,
        status: 'degraded',
        label: `Latency spike ${nextId}`
      }
    ];
  }

  onMount(() => {
    let heartbeatTimer;
    const clockTimer = setInterval(() => (now = Date.now()), 250);

    function scheduleHeartbeat() {
      heartbeatTimer = setTimeout(
        () => {
          if (online) {
            const time = new Date();
            events = [...events.slice(-119), { id: `health-${time.getTime()}`, time, status: 'operational', label: 'Online' }];
          }
          scheduleHeartbeat();
        },
        interval - (Date.now() % interval) + 50
      );
    }

    scheduleHeartbeat();
    return () => {
      clearTimeout(heartbeatTimer);
      clearInterval(clockTimer);
    };
  });
</script>

<div class="interactive-example">
  <div class="controls">
    <AesirButton variant={online ? 'destructive' : 'default'} onclick={toggleService}>
      {online ? 'Switch service off' : 'Switch service on'}
    </AesirButton>
    <AesirButton variant="outline" onclick={addLatencyEvent}>Add latency event</AesirButton>
  </div>
  <div class="live-meta">
    <span>
      <i></i>
      Live
    </span>
    <span>Next interval in {secondsLeft}s</span>
  </div>

  <AesirStatusBar
    label="Worker service"
    status={online ? 'operational' : 'outage'}
    statusLabel={online ? 'Operational' : 'Offline'}
    items={events}
    {interval}
    total={60}
    defaultStatus="operational"
    endLabel="Live"
  />
</div>

<style>
  .interactive-example {
    display: grid;
    width: 100%;
    gap: var(--ds-spacing-6);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ds-spacing-2);
  }

  .live-meta {
    display: flex;
    justify-content: space-between;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }

  .live-meta span:first-child {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-spacing-2);
  }

  i {
    width: var(--ds-spacing-2);
    height: var(--ds-spacing-2);
    border-radius: var(--ds-radius-full);
    background: var(--ds-emphasis-green);
  }
</style>
