<script>
  import { AesirKbd } from '@aesir/svelte';
</script>

<div class="kbd-example">
  <p>Press <AesirKbd meta>K</AesirKbd> to open search.</p>
  <p>Press <AesirKbd meta shift>P</AesirKbd> to open the command palette.</p>
  <div class="kbd-example__dense" aria-label="Navigation keys">
    <AesirKbd small>↑</AesirKbd>
    <AesirKbd small>↓</AesirKbd>
    <AesirKbd small>Enter</AesirKbd>
    <AesirKbd small>Esc</AesirKbd>
  </div>
</div>

<style>
  .kbd-example {
    display: grid;
    justify-items: center;
    gap: var(--ds-spacing-4);
  }

  .kbd-example p {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
    margin: 0;
  }

  .kbd-example__dense {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
</style>
