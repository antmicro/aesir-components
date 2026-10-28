<script lang="ts">
  import { AesirCheckbox, AesirSlider, AesirTextarea } from '../../src/index.js';
</script>

<form aria-label="Reset edge cases">
  <AesirCheckbox label="Partial selection" indeterminate />
  <AesirSlider label="Level" name="level" value={20} />
  <AesirTextarea label="Notes" name="notes" value="Initial" showCount />
</form>
