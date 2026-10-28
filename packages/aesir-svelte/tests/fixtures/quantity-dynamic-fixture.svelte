<script lang="ts">
  import { AesirQuantityStepper } from '../../src/index.js';

  let quantity = $state(5);
  let min = $state(1);
  let max = $state(5);
</script>

<form aria-label="Quantity form">
  <AesirQuantityStepper name="quantity" label="Quantity" bind:value={quantity} {min} {max} />
  <button type="button" onclick={() => (quantity = 2)}>Set quantity to two</button>
  <button type="button" onclick={() => (min = 3)}>Raise minimum</button>
  <button type="button" onclick={() => (min = 1)}>Lower minimum</button>
  <button type="button" onclick={() => (max = 3)}>Narrow range</button>
  <button type="button" onclick={() => (max = 5)}>Widen range</button>
  <button type="reset">Reset</button>
</form>

<output aria-label="Raw quantity">{quantity}</output>
