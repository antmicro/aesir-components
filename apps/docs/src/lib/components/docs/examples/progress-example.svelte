<script>
  import { AesirProgress } from '@aesir/svelte';
</script>

<div class="example">
  <AesirProgress value={68} label="Uploading release" showValue />
  <AesirProgress value={100} label="Deployment complete" showValue variant="success" size="sm" />
  <AesirProgress label="Preparing environment" indeterminate />
</div>

<style>
  .example {
    display: grid;
    width: min(100%, var(--ds-sizing-xl));
    gap: var(--ds-spacing-6);
  }
</style>
