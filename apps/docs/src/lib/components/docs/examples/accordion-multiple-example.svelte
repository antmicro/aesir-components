<script>
  import { AesirAccordion } from '@aesir/svelte';

  let value = $state(['notifications']);
  const items = [
    { value: 'notifications', title: 'Notifications', icon: 'bell', content: 'Choose which product and account updates you want to receive.' },
    { value: 'privacy', title: 'Privacy', icon: 'shield', content: 'Control profile visibility and how your activity is used.' },
    { value: 'billing', title: 'Billing - managed by your organization', icon: 'credit-card', content: 'Only workspace owners can change billing settings.', disabled: true }
  ];
</script>

<div class="example"><AesirAccordion {items} type="multiple" indicator="plus-minus" bind:value /></div>

<style>
  .example {
    width: min(100%, var(--ds-sizing-xl));
  }
</style>
