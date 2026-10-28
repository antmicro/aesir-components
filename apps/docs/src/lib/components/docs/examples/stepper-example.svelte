<script>
  import { AesirButton, AesirStepper } from '@aesir/svelte';
  const items = [
    { value: 'details', label: 'User details', description: 'Project information', icon: 'user' },
    { value: 'members', label: 'Payment info', description: 'Invite collaborators', icon: 'credit-card' },
    { value: 'review', label: 'Auth OTP', description: 'Confirm settings', icon: 'lock' }
  ];
  let value = $state('members');
</script>

<div class="example"><AesirStepper {items} bind:value /><AesirButton variant="accent" onclick={() => (value = value === 'details' ? 'members' : 'review')}>Continue</AesirButton></div>

<style>
  .example {
    display: grid;
    width: 100%;
    gap: var(--ds-spacing-8);
  }
</style>
