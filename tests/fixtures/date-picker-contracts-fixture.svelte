<script>
  import { AesirDatePicker } from '../../src/index.js';

  let value = $state('2026-09-15');
  let selectedValue = $state('');
  let selectionCount = $state(0);
</script>

<AesirDatePicker
  bind:value
  label="Release date"
  locale="en-US"
  min="2026-09-10"
  max="2026-09-20"
  onselect={(date) => {
    selectedValue = date;
    selectionCount += 1;
  }}
/>
<output aria-label="Selected date">{selectedValue}</output>
<output aria-label="Date selections">{selectionCount}</output>

<AesirDatePicker label="Disabled date" locale="en-US" disabled />
