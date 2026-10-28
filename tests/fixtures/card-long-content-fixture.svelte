<script>
  import AesirCard from '../../src/components/aesir-card/aesir-card.svelte';
</script>

<div data-testid="card-surface" style="width: 240px">
  <AesirCard
    title="VeryLongUnbrokenProjectIdentifierThatMustFitInTheCard"
    titleElement="h2"
    description="https://example.com/a/very/long/unbroken/document/identifier/that/should/remain/inside/the/card"
  >
    {#snippet headerAction()}
      <button type="button">Action</button>
    {/snippet}
    <p>Card content</p>
  </AesirCard>
</div>
