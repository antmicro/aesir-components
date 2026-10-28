<script>
  import { onMount } from 'svelte';
  import { AesirCommandMenu } from '@aesir/svelte';
  import { resolveInternalHref } from '$lib/utils.js';

  let { pages = [] } = $props();

  let open = $state(false);

  const getDescription = (content = '') => {
    const summary = String(content).trim();
    if (!summary) return undefined;
    return summary.length > 140 ? `${summary.slice(0, 137).trimEnd()}…` : summary;
  };

  const toCommandItem = (page) => ({
    id: page.href,
    href: resolveInternalHref(page.href),
    label: page.title,
    icon: page.icon,
    description: getDescription(page.content),
    keywords: [page.group, page.content].filter(Boolean)
  });

  const groups = $derived.by(() => {
    const pageGroups = [];

    for (const page of pages) {
      const label = page.group || 'General';
      let group = pageGroups.find((item) => item.label === label);
      if (!group) {
        group = { label, items: [] };
        pageGroups.push(group);
      }
      group.items.push(toCommandItem(page));
    }

    return pageGroups;
  });

  onMount(() => {
    const onOpenRequest = () => {
      open = true;
    };
    window.addEventListener('docs-command-open', onOpenRequest);
    return () => {
      window.removeEventListener('docs-command-open', onOpenRequest);
    };
  });
</script>

<AesirCommandMenu bind:open {groups} label="Search documentation" placeholder="Search in docs…" emptyText="No documentation found." showFooter />
