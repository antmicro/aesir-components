<script>
  import { AesirAccordion, AesirButton } from '@aesir/svelte';

  let value = $state('activity');
  const items = [
    { value: 'activity', title: 'Recent activity', content: 'Deploy completed successfully 12 minutes ago.' },
    { value: 'members', title: 'Team members', content: 'Eight people currently have access to this workspace.' }
  ];
</script>

<div class="example">
  <div class="controls">
    <AesirButton size="sm" variant="outline" onclick={() => (value = 'activity')}>Show activity</AesirButton>
    <AesirButton size="sm" variant="outline" onclick={() => (value = 'members')}>Show members</AesirButton>
  </div>
  <AesirAccordion {items} bind:value />
</div>

<style>
  .example {
    width: min(100%, var(--ds-sizing-xl));
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ds-spacing-2);
    margin-bottom: var(--ds-spacing-4);
  }
</style>
