<script>
  import { AesirButton } from '@aesir/svelte';
</script>

<div class="button-example">
  <AesirButton variant="default">Default</AesirButton>
  <AesirButton variant="accent">Accent</AesirButton>
  <AesirButton variant="secondary">Secondary</AesirButton>
  <AesirButton variant="outline">Outline</AesirButton>
  <AesirButton variant="ghost">Ghost</AesirButton>
  <AesirButton variant="destructive">Destructive</AesirButton>
</div>

<style>
  .button-example {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--ds-spacing-4);
  }
</style>
