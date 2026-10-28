<script>
  import { AesirSwitch } from '@aesir/svelte';

  let alerts = $state(true);
</script>

<div class="switch-example">
  <AesirSwitch bind:checked={alerts} label="Incident alerts" description="Notify the team when a service becomes unavailable." />
  <AesirSwitch label="Weekly digest" description="Send a summary every Monday." />
  <AesirSwitch checked disabled label="Security notifications" />
</div>

<style>
  .switch-example {
    display: grid;
    width: min(100%, var(--ds-sizing-md));
    gap: var(--ds-spacing-5);
  }
</style>
