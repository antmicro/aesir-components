<script>
  import { AesirDatePicker } from '../../src/index.js';

  let date = $state('2026-09-15');
  let selections = $state(0);
</script>

<form aria-label="Date form">
  <AesirDatePicker label="Release date" name="release" locale="en-US" bind:value={date} onselect={() => selections++} />
</form>
<output aria-label="Bound date">{date}</output>
<output aria-label="Date selections">{selections}</output>
