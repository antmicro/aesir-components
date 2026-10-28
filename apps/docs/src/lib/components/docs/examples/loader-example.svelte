<script>
  import { AesirButton, AesirLoader } from '@aesir/svelte';
</script>

<div class="examples">
  <div class="example">
    <span>
      <AesirLoader variant="ring" />
      <small>Ring</small>
    </span>
    <span>
      <AesirLoader variant="lines" />
      <small>Lines</small>
    </span>
  </div>
  <div class="example">
    <span>
      <AesirLoader variant="grid" pattern="pulse" />
      <small>Pulse</small>
    </span>
    <span>
      <AesirLoader variant="grid" pattern="wave" />
      <small>Wave</small>
    </span>
    <span>
      <AesirLoader variant="grid" pattern="orbit" />
      <small>Orbit</small>
    </span>
  </div>
  <AesirButton disabled><AesirLoader decorative size="sm" />Saving…</AesirButton>
</div>

<style>
  .examples,
  .example {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-5);
  }
  .examples {
    flex-wrap: wrap;
  }
  .example span {
    display: grid;
    justify-items: center;
    gap: var(--ds-spacing-2);
  }
  small {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
</style>
