<script>
  import { AesirBreadcrumb } from '@aesir/svelte';

  const items = [{ label: 'Projects', href: '/docs/' }, { label: 'Infrastructure', href: '/docs/components/status-bar/' }, { label: 'Deployment settings' }];
</script>

<AesirBreadcrumb {items} label="Project navigation" />
