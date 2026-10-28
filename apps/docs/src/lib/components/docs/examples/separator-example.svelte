<script>
  import { AesirSeparator } from '@aesir/svelte';
</script>

<div class="example">
  <span>Overview</span>
  <AesirSeparator orientation="vertical" />
  <span>Activity</span>
  <AesirSeparator orientation="vertical" />
  <span>Settings</span>
</div>

<style>
  .example {
    display: flex;
    height: var(--ds-spacing-5);
    align-items: center;
    gap: var(--ds-spacing-4);
    font-size: var(--ds-font-size-sm);
  }
</style>
