<script>
  import { AesirDatePicker } from '@aesir/svelte';
  let value = $state('2026-08-31');
</script>

<div class="example">
  <AesirDatePicker bind:value label="Release date" min="2026-01-01" />
  <p>Selected: {value}</p>
</div>

<style>
  .example {
    width: min(100%, 20rem);
    margin: auto;
  }
  p {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }
</style>
