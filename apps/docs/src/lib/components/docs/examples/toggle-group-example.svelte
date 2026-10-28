<script>
  import { AesirIcon, AesirToggleGroup, AesirToggleGroupItem } from '@aesir/svelte';
  let formatting = $state(['bold']);
  let alignment = $state('left');
</script>

<div class="toggle-group-example">
  <AesirToggleGroup type="multiple" bind:value={formatting} variant="outline" size="icon" label="Text formatting">
    <AesirToggleGroupItem value="bold" aria-label="Bold"><AesirIcon name="bold" /></AesirToggleGroupItem>
    <AesirToggleGroupItem value="italic" aria-label="Italic"><AesirIcon name="italic" /></AesirToggleGroupItem>
    <AesirToggleGroupItem value="underline" aria-label="Underline"><AesirIcon name="underline" /></AesirToggleGroupItem>
  </AesirToggleGroup>

  <AesirToggleGroup type="single" bind:value={alignment} spacing={0} variant="outline" size="icon" required label="Text alignment">
    <AesirToggleGroupItem value="left" aria-label="Align left"><AesirIcon name="align-left" /></AesirToggleGroupItem>
    <AesirToggleGroupItem value="center" aria-label="Align center"><AesirIcon name="align-center" /></AesirToggleGroupItem>
    <AesirToggleGroupItem value="right" aria-label="Align right"><AesirIcon name="align-right" /></AesirToggleGroupItem>
  </AesirToggleGroup>
</div>

<style>
  .toggle-group-example {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--ds-spacing-6);
  }
</style>
