<script>
  import { AesirTagInput } from '@aesir/svelte';
  const options = ['Design', 'Frontend', 'Backend', 'Research', 'Accessibility'];
  let value = $state(['Design']);
</script>

<div class="example">
  <AesirTagInput {options} bind:value label="Project tags" description="Type to filter. Enter selects the highlighted result and Backspace removes the last tag." placeholder="Add a tag…" />
  <p>{value.join(', ')}</p>
</div>

<style>
  .example {
    display: grid;
    width: min(100%, var(--ds-sizing-md));
    gap: var(--ds-spacing-3);
  }
  p {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
</style>
