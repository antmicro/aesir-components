<script>
  import { AesirToggleGroup, AesirToggleGroupItem } from '../../src/index.js';

  let showBold = $state(true);
  let underlineDisabled = $state(false);
  let formatting = $state(['bold']);
</script>

<button type="button" onclick={() => (showBold = false)}>Remove Bold</button>
<button type="button" onclick={() => (underlineDisabled = true)}>Disable Underline</button>
<AesirToggleGroup type="multiple" bind:value={formatting} label="Formatting">
  {#if showBold}<AesirToggleGroupItem value="bold">Bold</AesirToggleGroupItem>{/if}
  <AesirToggleGroupItem value="underline" disabled={underlineDisabled}>Underline</AesirToggleGroupItem>
  <AesirToggleGroupItem value="italic">Italic</AesirToggleGroupItem>
</AesirToggleGroup>
