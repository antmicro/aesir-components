<script>
  import { AesirRadio } from '@aesir/svelte';

  let plan = $state('pro');
</script>

<div class="radio-example">
  <AesirRadio bind:group={plan} value="free" label="Free" description="For personal experiments." />
  <AesirRadio bind:group={plan} value="pro" label="Pro" description="For production applications." />
  <AesirRadio bind:group={plan} value="enterprise" label="Enterprise" description="Advanced controls and support." />
</div>

<style>
  .radio-example {
    display: grid;
    gap: var(--ds-spacing-4);
  }
</style>
