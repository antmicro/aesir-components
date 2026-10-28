<script lang="ts">
  import AesirDateRangeField from '../../src/components/aesir-segmented-field/aesir-date-range-field.svelte';

  let range = $state({ start: '2026-10-03', end: '2026-10-05' });
</script>

<form aria-label="Segmented range state">
  <AesirDateRangeField label="Dates" name="dates" min="2026-10-01" bind:value={range} />
  <output data-testid="range-state">{JSON.stringify(range)}</output>
</form>
