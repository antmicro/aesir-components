<script lang="ts">
  import { AesirQuantityStepper } from '../../src/index.js';

  let quantity = $state(5);
  let step = $state(2);
</script>

<form aria-label="Stepped quantity form">
  <AesirQuantityStepper name="quantity" label="Quantity" bind:value={quantity} min={1} max={6} {step} />
  <button type="button" onclick={() => (step = 3)}>Set step to three</button>
  <button type="button" onclick={() => (step = 2)}>Set step to two</button>
</form>

<output aria-label="Raw stepped quantity">{quantity}</output>

<form aria-label="Decimal quantity form">
  <AesirQuantityStepper name="decimal" label="Decimal quantity" value={0.1} min={0.1} max={0.5} step={0.1} />
</form>

<form aria-label="Large quantity form">
  <AesirQuantityStepper name="large" label="Large quantity" value={1000000000001} min={1000000000000} max={1000000000003} />
</form>

<form aria-label="Invalid step form">
  <AesirQuantityStepper name="fallback" label="Fallback quantity" value={2} min={1} max={4} step={0} />
</form>

<form aria-label="Wide range form">
  <AesirQuantityStepper name="wide" label="Wide range quantity" value={1000000000001} min={0} max={1000000000003} />
</form>
