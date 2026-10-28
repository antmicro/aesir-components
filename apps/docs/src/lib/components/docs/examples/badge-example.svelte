<script>
  import { AesirBadge, AesirIcon } from '@aesir/svelte';
</script>

<div class="badge-example">
  <AesirBadge>Default</AesirBadge>
  <AesirBadge variant="secondary">Secondary</AesirBadge>
  <AesirBadge variant="outline">Outline</AesirBadge>
  <AesirBadge variant="accent">Accent</AesirBadge>
  <AesirBadge variant="info"><AesirIcon name="info" />Beta</AesirBadge>
  <AesirBadge variant="success"><AesirIcon name="check" />Stable</AesirBadge>
  <AesirBadge variant="warning"><AesirIcon name="triangle-alert" />Deprecated</AesirBadge>
  <AesirBadge variant="destructive"><AesirIcon name="x" />Failed</AesirBadge>
  <AesirBadge variant="success">Operational</AesirBadge>
  <AesirBadge variant="warning">Degraded</AesirBadge>
  <AesirBadge size="xs">Extra small</AesirBadge>
  <AesirBadge size="sm">Small</AesirBadge>
  <AesirBadge variant="outline" size="sm" font="mono">128</AesirBadge>
  <AesirBadge size="lg">Large</AesirBadge>
</div>

<style>
  .badge-example {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--ds-spacing-3);
  }
</style>
