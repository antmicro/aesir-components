<script>
  import { AesirAnimate, AesirBadge, AesirButton, AesirCard } from '@aesir/svelte';

  let replay = $state(0);
</script>

<div class="animate-example">
  <AesirButton variant="outline" size="sm" onclick={() => (replay += 1)}>Replay animation</AesirButton>

  {#key replay}
    <div class="animate-example__grid">
      <AesirAnimate animation="fade-up">
        <AesirCard title="API" description="All endpoints are responding normally.">
          {#snippet headerAction()}<AesirBadge variant="success">Operational</AesirBadge>{/snippet}
        </AesirCard>
      </AesirAnimate>

      <AesirAnimate animation="fade-up" delay={50}>
        <AesirCard title="Dashboard" description="No incidents reported in the last 24 hours.">
          {#snippet headerAction()}<AesirBadge variant="success">Operational</AesirBadge>{/snippet}
        </AesirCard>
      </AesirAnimate>

      <AesirAnimate animation="fade-up" delay={100}>
        <AesirCard title="Webhooks" description="Delivery latency remains below 100 ms.">
          {#snippet headerAction()}<AesirBadge variant="success">Operational</AesirBadge>{/snippet}
        </AesirCard>
      </AesirAnimate>
    </div>
  {/key}
</div>

<style>
  .animate-example {
    display: grid;
    width: 100%;
    gap: var(--ds-spacing-4);
  }

  .animate-example > :global(.aesir-button) {
    justify-self: end;
  }

  .animate-example__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--ds-sizing-3xs)), 1fr));
    gap: var(--ds-spacing-4);
  }
</style>
