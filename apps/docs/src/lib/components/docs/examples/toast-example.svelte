<script>
  import { AesirButton, toast } from '@aesir/svelte';

  const deployRelease = () =>
    toast.promise(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ version: '2.4.1' }), 1800);
        }),
      {
        loading: {
          title: 'Deploying release',
          description: 'Building and publishing version 2.4.1.'
        },
        success: ({ version }) => ({
          title: 'Deployment complete',
          description: `Version ${version} is now live.`
        }),
        error: (error) => ({
          title: 'Deployment failed',
          description: error.message
        })
      }
    );

  const createEvent = () =>
    toast.success('Event has been created', undefined, {
      action: {
        label: 'Undo',
        onClick: () => toast.info('Event creation undone')
      }
    });
</script>

<div class="toast-example">
  <AesirButton onclick={deployRelease}>Promise toast</AesirButton>
  <AesirButton variant="outline" onclick={createEvent}>Action toast</AesirButton>
  <AesirButton variant="outline" onclick={() => toast.info('Deployment scheduled', 'The release starts at 23:00 UTC.')}>Info toast</AesirButton>
  <AesirButton variant="outline" onclick={() => toast.success('Deployment complete', 'Version 2.4.0 is now live.')}>Success toast</AesirButton>
  <AesirButton variant="outline" onclick={() => toast.warning('Elevated latency', 'Requests may respond more slowly.')}>Warning toast</AesirButton>
  <AesirButton variant="outline" onclick={() => toast.error('Deployment failed', 'Review the build logs and try again.')}>Error toast</AesirButton>
</div>

<style>
  .toast-example {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ds-spacing-3);
  }
</style>
