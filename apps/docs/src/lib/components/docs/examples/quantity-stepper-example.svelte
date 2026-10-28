<script>
  import { AesirQuantityStepper } from '@aesir/svelte';
  let quantity = $state(2);
</script>

<div class="quantity-stepper-example">
  <AesirQuantityStepper bind:value={quantity} max={9} />
  <span aria-live="polite">{quantity} {quantity === 1 ? 'item' : 'items'}</span>
</div>

<style>
  .quantity-stepper-example {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-3);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }
</style>
