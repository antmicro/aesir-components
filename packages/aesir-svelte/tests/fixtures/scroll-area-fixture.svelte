<script lang="ts">
  import { AesirScrollArea } from '../../src/index.js';
  let expanded = $state(true);
  let extraChild = $state(false);
  let nestedExpanded = $state(false);
</script>

<button type="button" onclick={() => (expanded = !expanded)}>Toggle content size</button>
<div style="width: 160px; height: 120px;">
  <AesirScrollArea label="Scrollable grid" orientation="both" type="auto" scrollbarSize={10} scrollbarClass="custom-track" thumbClass="custom-thumb">
    <div style:width={expanded ? '400px' : '40px'} style:height={expanded ? '400px' : '40px'}>Grid content</div>
  </AesirScrollArea>
</div>
<div style="width: 160px; height: 120px;">
  <AesirScrollArea label="Focus scroll area" type="hover" scrollHideDelay={20}>
    <div style="height: 400px;">Keyboard scroll content</div>
  </AesirScrollArea>
</div>
<button type="button" onclick={() => (extraChild = !extraChild)}>Toggle second child</button>
<div style="width: 160px; height: 120px;">
  <AesirScrollArea label="Dynamic children" type="auto">
    <div style="height: 20px;">First child</div>
    {#if extraChild}<div style="height: 400px;">Second child</div>{/if}
  </AesirScrollArea>
</div>
<button type="button" onclick={() => (nestedExpanded = !nestedExpanded)}>Toggle nested content size</button>
<div style="width: 160px; height: 120px;">
  <AesirScrollArea label="Nested dynamic content" type="auto">
    <div style="height: 20px; width: 20px;">
      <div style:height={nestedExpanded ? '300px' : '20px'}>Nested content</div>
    </div>
  </AesirScrollArea>
</div>
