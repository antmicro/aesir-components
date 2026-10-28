<svelte:options
  customElement={{
    tag: 'aesir-status-bar',
    props: {
      total: { type: 'Number' },
      interval: { attribute: 'interval' },
      defaultStatus: { attribute: 'default-status' },
      statusLabel: { attribute: 'status-label' },
      startLabel: { attribute: 'start-label' },
      endLabel: { attribute: 'end-label' },
      tooltipPlacement: { attribute: 'tooltip-placement' }
    }
  }}
/>

<script>
  import { AesirStatusBar } from '@aesir/svelte/components/aesir-status-bar';
  import { parseJson } from '../parse.js';

  let {
    label,
    items = [],
    descriptions = {},
    total,
    interval,
    startDate,
    defaultStatus,
    status,
    statusLabel,
    startLabel,
    endLabel = 'Today',
    tooltipPlacement = 'top',
    getEvent,
    getIntervalColor,
    formatInterval
  } = $props();
  const parsedItems = $derived(parseJson(items));
  const parsedDescriptions = $derived(parseJson(descriptions, {}));
</script>

<AesirStatusBar
  {label}
  items={parsedItems}
  descriptions={parsedDescriptions}
  {total}
  {interval}
  {startDate}
  {defaultStatus}
  {status}
  {statusLabel}
  {startLabel}
  {endLabel}
  {tooltipPlacement}
  {getEvent}
  {getIntervalColor}
  {formatInterval}
/>
