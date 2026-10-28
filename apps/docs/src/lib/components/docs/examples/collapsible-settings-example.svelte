<script>
  import { AesirCheckbox, AesirCollapsible } from '@aesir/svelte';

  let completed = $state(true);
  let failed = $state(true);
  let digest = $state(false);
</script>

<div class="settings-example">
  <AesirCollapsible title="Pipeline alerts" open>
    <div class="settings-example__options">
      <AesirCheckbox bind:checked={completed} label="Build completed" />
      <AesirCheckbox bind:checked={failed} label="Deployment failed" />
      <AesirCheckbox bind:checked={digest} label="Weekly activity digest" />
    </div>
  </AesirCollapsible>
</div>

<style>
  .settings-example {
    width: min(100%, var(--ds-sizing-lg));
  }

  .settings-example__options {
    display: grid;
    gap: var(--ds-spacing-3);
    padding: var(--ds-spacing-3);
    border-radius: var(--ds-radius-md);
  }
</style>
