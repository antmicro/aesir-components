<script>
  import { AesirTextarea } from '@aesir/svelte';
  let summary = $state('');
  let notes = $state('This field grows as additional lines are entered.');
  const error = $derived(summary.length > 0 && summary.length < 20 ? 'Use at least 20 characters.' : '');
</script>

<div class="example">
  <AesirTextarea bind:value={summary} label="Project summary" placeholder="Describe the project…" maxlength={240} showCount {error} />
  <AesirTextarea bind:value={notes} label="Release notes" resize="auto" description="Auto-resizes to fit its content." />
  <AesirTextarea label="Internal note" optional resize="none" rows={3} placeholder="Visible to your team only" />
</div>

<style>
  .example {
    display: grid;
    width: min(100%, var(--ds-sizing-lg));
    gap: var(--ds-spacing-5);
  }
</style>
