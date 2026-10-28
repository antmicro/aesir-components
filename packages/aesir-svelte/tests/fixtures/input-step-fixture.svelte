<script lang="ts">
  import { AesirInput } from '../../src/index.js';

  let value = $state(5);
  let max = $state(6);
  let step = $state(2);
  let anyValue = $state(5);
</script>

<form aria-label="Stepped number form">
  <AesirInput type="number" label="Seats" name="seats" bind:value min={1} {max} {step} />
</form>

<output aria-label="Raw seats">{value}</output>
<button type="button" onclick={() => (max = 7)}>Raise maximum</button>
<button type="button" onclick={() => (step = 1)}>Use unit steps</button>

<form aria-label="Decimal number form">
  <AesirInput type="number" label="Decimal seats" name="decimal" value={0.3} min={0.1} max={0.3} step={0.1} />
</form>

<form aria-label="Any step form">
  <AesirInput type="number" label="Any-step seats" name="any" bind:value={anyValue} min={1} max={6} step="any" />
</form>

<output aria-label="Raw any-step seats">{anyValue}</output>
