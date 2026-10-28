<script>
  import EmptyState from '../../src/components/aesir-empty-state/aesir-empty-state.svelte';
</script>

<EmptyState data-testid="actions-only">
  {#snippet actions()}<button type="button">Create project</button>{/snippet}
</EmptyState>

<EmptyState data-testid="custom-copy"><span>Nothing here yet</span></EmptyState>
