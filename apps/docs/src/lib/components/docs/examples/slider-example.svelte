<script>
  import { AesirSlider } from '@aesir/svelte';

  let replicas = $state(4);
</script>

<div class="slider-example">
  <AesirSlider bind:value={replicas} min={1} max={10} label="Replicas" />
  <AesirSlider value={75} label="Disabled capacity" disabled />
</div>

<style>
  .slider-example {
    display: grid;
    width: min(100%, var(--ds-sizing-md));
    gap: var(--ds-spacing-6);
  }
</style>
