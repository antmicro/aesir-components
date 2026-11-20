<script>
  import { AesirBreadcrumb } from '@aesir/svelte';

  let current = $state('Deployment settings');

  const environments = [
    { type: 'label', label: 'Environments' },
    { label: 'Development', value: 'development', icon: 'layers-2' },
    { label: 'Staging', value: 'staging', icon: 'layers-2' },
    { type: 'separator' },
    { label: 'Deployment settings', value: 'deployment-settings', icon: 'settings' }
  ];

  const items = $derived([
    { label: 'Projects', href: '/docs/' },
    { label: 'Infrastructure', dropdown: true, items: environments, onselect: (item) => (current = item.label ?? current) },
    { label: current }
  ]);
</script>

<AesirBreadcrumb {items} label="Project navigation" />
