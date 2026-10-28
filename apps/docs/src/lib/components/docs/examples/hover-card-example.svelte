<script>
  import { resolve } from '$app/paths';
  import { AesirButton, AesirHoverCard } from '@aesir/svelte';
</script>

<AesirHoverCard openDelay={150}>
  {#snippet trigger(props)}
    <AesirButton variant="outline" {...props}>Preview project</AesirButton>
  {/snippet}
  {#snippet content()}
    <div class="preview">
      <strong>Component library</strong>
      <p>Shared controls, patterns, and accessibility guidance.</p>
      <a href={resolve('/docs/components/hover-card/')}>View details</a>
    </div>
  {/snippet}
</AesirHoverCard>

<style>
  .preview {
    display: grid;
    gap: var(--ds-spacing-2);
  }
  p {
    margin: 0;
    color: var(--ds-foreground-muted);
  }
</style>
