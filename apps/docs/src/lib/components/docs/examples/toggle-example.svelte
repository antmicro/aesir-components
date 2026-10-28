<script>
  import { AesirIcon, AesirToggle } from '@aesir/svelte';
  let pressed = $state(true);
</script>

<div class="toggle-example">
  <AesirToggle bind:pressed size="icon" aria-label="Toggle bold">
    <AesirIcon name="bold" />
  </AesirToggle>
  <AesirToggle variant="outline"><AesirIcon name="italic" /> Italic</AesirToggle>
  <AesirToggle disabled><AesirIcon name="underline" /> Underline</AesirToggle>
</div>

<style>
  .toggle-example {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--ds-spacing-4);
  }
</style>
