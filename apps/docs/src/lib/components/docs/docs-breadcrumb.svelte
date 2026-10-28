<script>
  import { AesirBreadcrumb } from '@aesir/svelte';
  import { resolveInternalHref } from '$lib/utils.js';

  let { items = [] } = $props();
  const resolvedItems = $derived(items.map((item) => ({ ...item, label: item.title, href: item.href ? resolveInternalHref(item.href) : undefined })));
</script>

<AesirBreadcrumb items={resolvedItems} label="Documentation breadcrumb" />
