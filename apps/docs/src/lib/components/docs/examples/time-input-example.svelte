<script>
  import { AesirInput } from '@aesir/svelte';
  let time = $state('09:30');
</script>

<div class="example"><AesirInput type="time" bind:value={time} label="Start time" description="Uses the platform time picker and native keyboard behavior." step="900" /></div>

<style>
  .example {
    width: min(100%, var(--ds-sizing-sm));
  }
</style>
