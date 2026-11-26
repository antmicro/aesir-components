<script>
  import { AesirButton, AesirToaster, toast } from '@aesir/svelte';
</script>

<AesirToaster coloredStates />

<div class="toast-example">
  <AesirButton variant="outline" onclick={() => toast.info('Deployment scheduled')}>Info toast</AesirButton>
  <AesirButton variant="outline" onclick={() => toast.success('Deployment complete')}>Success toast</AesirButton>
  <AesirButton variant="outline" onclick={() => toast.warning('Elevated latency')}>Warning toast</AesirButton>
  <AesirButton variant="outline" onclick={() => toast.error('Deployment failed')}>Error toast</AesirButton>
</div>

<style>
  .toast-example {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--ds-spacing-3);
  }
</style>
