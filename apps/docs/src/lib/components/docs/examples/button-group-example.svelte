<script>
  import { AesirButton, AesirButtonGroup, AesirIcon, AesirInput } from '@aesir/svelte';
</script>

<div class="button-group-example">
  <div class="button-group-example__row">
    <AesirButton variant="outline" size="icon" aria-label="Back"><AesirIcon name="arrow-left" /></AesirButton>

    <AesirButtonGroup aria-label="Archive actions">
      <AesirButton variant="outline">Archive</AesirButton>
      <AesirButton variant="outline">Report</AesirButton>
    </AesirButtonGroup>

    <AesirButtonGroup aria-label="Snooze actions">
      <AesirButton variant="outline">Snooze</AesirButton>
      <AesirButton variant="outline" size="icon" aria-label="More snooze options"><AesirIcon name="ellipsis" /></AesirButton>
    </AesirButtonGroup>
  </div>

  <AesirButtonGroup class="button-group-example__field" aria-label="Repository URL">
    <span data-slot="button-group-text">https://</span>
    <AesirInput value="aesir.dev" aria-label="Repository domain" />
    <AesirButton variant="outline">Copy</AesirButton>
  </AesirButtonGroup>
</div>

<style>
  .button-group-example {
    display: grid;
    width: min(100%, var(--ds-sizing-lg));
    gap: var(--ds-spacing-6);
  }

  .button-group-example__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--ds-spacing-4);
  }

  :global(.button-group-example__field) {
    width: 100%;
  }
</style>
