<script>
  import { AesirCollapsible } from '@aesir/svelte';
</script>

<div class="faq-example">
  <AesirCollapsible title="When should I use a semantic token?" open>
    <p>Use semantic tokens when a value communicates purpose, such as foreground, surface, or border. This keeps components consistent across themes without tying them to a specific palette.</p>
  </AesirCollapsible>
</div>

<style>
  .faq-example {
    width: min(100%, var(--ds-sizing-lg));
  }

  p {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-lg);
  }
</style>
