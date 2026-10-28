<script lang="ts">
  import { AesirButton, AesirIcon } from '@aesir/svelte';
  import { resolveInternalHref } from '$lib/utils.js';
</script>

<div class="button-options">
  <div class="button-options__row">
    <AesirButton size="sm">Small</AesirButton>
    <AesirButton>Default</AesirButton>
    <AesirButton size="lg">Large</AesirButton>
  </div>

  <div class="button-options__row">
    <AesirButton radius="none" variant="outline">Square</AesirButton>
    <AesirButton radius="full" variant="outline">Pill</AesirButton>
    <AesirButton href={resolveInternalHref('/docs/')} variant="outline"><AesirIcon name="arrow-left" />Docs</AesirButton>
    <AesirButton size="icon" aria-label="Settings"><AesirIcon name="settings" /></AesirButton>
    <AesirButton disabled>Disabled</AesirButton>
  </div>

  <AesirButton width="full" variant="outline">Full width</AesirButton>
</div>

<style>
  .button-options {
    display: grid;
    width: 100%;
    gap: var(--ds-spacing-4);
  }

  .button-options__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ds-spacing-3);
  }
</style>
