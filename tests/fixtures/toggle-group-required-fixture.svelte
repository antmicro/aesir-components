<script>
  import { AesirToggleGroup, AesirToggleGroupItem } from '../../src/index.js';

  let { spacing = 2 } = $props();
  let selected = $state('alpha');
  let changes = $state(0);
</script>

<AesirToggleGroup type="single" bind:value={selected} {spacing} required label="Required choice" onvaluechange={() => changes++}>
  <AesirToggleGroupItem value="alpha">Alpha</AesirToggleGroupItem>
  <AesirToggleGroupItem value="beta">Beta</AesirToggleGroupItem>
</AesirToggleGroup>
<output aria-label="Selection changes">{changes}</output>
