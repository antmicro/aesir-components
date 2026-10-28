<script>
  import { AesirButton, AesirDrawer } from '@aesir/svelte';

  let open = $state(false);
</script>

<AesirButton onclick={() => (open = true)}>Open drawer</AesirButton>

<AesirDrawer bind:open label="Project settings">
  {#snippet header()}<strong>Project settings</strong>{/snippet}
  <div class="drawer-content">
    <p>Use a drawer for contextual work that should preserve the current page behind it.</p>
  </div>
  {#snippet footer({ close })}<AesirButton width="full" onclick={close}>Done</AesirButton>{/snippet}
</AesirDrawer>

<style>
  .drawer-content {
    padding: var(--ds-spacing-4);
  }

  .drawer-content p {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
  }
</style>
