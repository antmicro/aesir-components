<script lang="ts">
  import AesirAlert from '../../src/components/aesir-alert/aesir-alert.svelte';
  import AesirBadge from '../../src/components/aesir-badge/aesir-badge.svelte';
  import AesirButton from '../../src/components/aesir-button/aesir-button.svelte';
  import AesirCard from '../../src/components/aesir-card/aesir-card.svelte';
  import AesirInput from '../../src/components/aesir-input/aesir-input.svelte';

  let { width = 760 }: { width?: number } = $props();
</script>

<div data-testid="visual-surface" class="visual-surface" style:width={`${width}px`}>
  <AesirCard
    title="Coordinate release requirements across multiple teams"
    description="A longer description confirms that layout remains readable when a project name and supporting details span several lines."
  >
    {#snippet headerAction()}<AesirBadge variant="outline" font="mono">24 items</AesirBadge>{/snippet}
    <div class="visual-content">
      <AesirAlert
        variant="warning"
        title="Review required before publishing"
        description="Several linked tasks still need an owner and a final status before the release can be shared with the wider team."
      />
      <AesirInput label="Workspace display name" value="Shared component library and accessibility review" description="This name is visible in project navigation and notifications." />
      <div class="visual-actions">
        <AesirButton size="sm">Review changes</AesirButton>
        <AesirButton size="sm" variant="outline">Open issue tracker</AesirButton>
      </div>
    </div>
  </AesirCard>
</div>

<style>
  .visual-surface {
    box-sizing: border-box;
    max-width: 100%;
    padding: 16px;
    background: var(--ds-background);
  }

  .visual-content {
    display: grid;
    gap: 16px;
    min-width: 0;
  }

  .visual-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
