<script>
  import { AesirDateRangePicker, AesirQuantityStepper, AesirSelectionToolbar } from '../../src/index.js';

  let quantity = $state(2);
  let quantityChanges = $state(0);
  let range = $state({ start: '2026-09-10', end: '2026-09-20' });
  let rangeChanges = $state(0);
  let selectionCount = $state(2);
</script>

<AesirQuantityStepper bind:value={quantity} min={1} max={3} name="quantity" label="Seats" data-testid="quantity" class="consumer-quantity" onchange={() => (quantityChanges += 1)} />
<output aria-label="Quantity value">{quantity}</output>
<output aria-label="Quantity changes">{quantityChanges}</output>

<AesirQuantityStepper value={2} label="Disabled seats" disabled onchange={() => (quantityChanges += 1)} />

<AesirDateRangePicker bind:value={range} label="Deployment window" locale="en-US" min="2026-09-01" max="2026-09-30" onchange={() => (rangeChanges += 1)} />
<output aria-label="Range start">{range.start}</output>
<output aria-label="Range end">{range.end}</output>
<output aria-label="Range changes">{rangeChanges}</output>

<AesirDateRangePicker label="Disabled window" disabled />

<AesirSelectionToolbar count={selectionCount} position="inline" onclear={() => (selectionCount = 0)} />
