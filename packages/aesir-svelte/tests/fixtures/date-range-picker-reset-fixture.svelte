<script>
  import { AesirDateRangePicker } from '../../src/index.js';

  let range = $state({ start: '2026-09-10', end: '2026-09-20' });
  let changes = $state(0);
</script>

<form aria-label="Range form">
  <AesirDateRangePicker label="Deployment window" locale="en-US" bind:value={range} onchange={() => changes++} />
</form>
<output aria-label="Bound range">{range.start} / {range.end}</output>
<output aria-label="Range changes">{changes}</output>
