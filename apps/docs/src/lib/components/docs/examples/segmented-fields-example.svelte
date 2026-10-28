<script>
  import { AesirDateField, AesirDateRangeField, AesirTimeField, AesirTimeRangeField } from '@aesir/svelte';
  let date = $state('2026-10-03');
  let time = $state('09:30');
</script>

<div class="fields">
  <AesirDateField label="Due date" bind:value={date} />
  <AesirTimeField label="Start time" bind:value={time} />
  <AesirDateRangeField label="Date interval" value={{ start: '2026-10-03', end: '2026-10-05' }} />
  <AesirTimeRangeField label="Time interval" value={{ start: '09:30', end: '17:00' }} />
</div>

<style>
  .fields {
    display: grid;
    gap: var(--ds-spacing-4);
  }
</style>
