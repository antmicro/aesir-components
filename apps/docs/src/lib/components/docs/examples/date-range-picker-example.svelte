<script>
  import { AesirDateRangePicker } from '@aesir/svelte';
  let value = $state({ start: '2026-09-10', end: '2026-09-18' });
</script>

<div class="example">
  <AesirDateRangePicker bind:value label="Release window" />
  <p>{value.start || 'Start'} – {value.end || 'End'}</p>
</div>

<style>
  .example {
    display: grid;
    width: min(100%, var(--ds-sizing-lg));
    gap: var(--ds-spacing-3);
  }
  p {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
</style>
