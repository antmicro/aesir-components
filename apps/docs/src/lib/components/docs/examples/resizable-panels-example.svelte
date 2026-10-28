<script>
  import { AesirResizablePanels } from '@aesir/svelte';
  let size = $state(38);
</script>

<div class="example">
  <AesirResizablePanels bind:size min={24} max={72}>
    {#snippet first()}<section>
        <strong>Editor</strong>
        <p>Drag the divider or focus it and use arrow keys.</p>
      </section>{/snippet}{#snippet second()}<section>
        <strong>Preview</strong>
        <p>The split is {Math.round(size)}% / {Math.round(100 - size)}%.</p>
      </section>{/snippet}
  </AesirResizablePanels>
</div>

<style>
  .example {
    height: 18rem;
    overflow: hidden;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
  }
  section {
    box-sizing: border-box;
    height: 100%;
    padding: var(--ds-spacing-4);
    background: var(--ds-background);
  }
  p {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }
</style>
