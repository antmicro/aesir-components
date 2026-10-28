<script>
  import { AesirPill } from '@aesir/svelte';
</script>

<div class="pill-example">
  <AesirPill href="/docs/" size="sm">Small link</AesirPill>
  <AesirPill href="/docs/components/badge/">Default link</AesirPill>
  <AesirPill href="https://github.com" size="lg" target="_blank" rel="noreferrer">Large link</AesirPill>
</div>

<style>
  .pill-example {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--ds-spacing-3);
  }
</style>
