<script>
  import { AesirCheckbox } from '@aesir/svelte';

  let updates = $state(true);
</script>

<div class="checkbox-example">
  <AesirCheckbox bind:checked={updates} label="Product updates" description="Receive release notes and maintenance notices." />
  <AesirCheckbox label="Usage reports" description="A weekly summary of workspace activity." />
  <AesirCheckbox checked disabled label="Required policy" />
</div>

<style>
  .checkbox-example {
    display: grid;
    gap: var(--ds-spacing-4);
  }
</style>
