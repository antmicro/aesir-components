<script>
  import { page } from '$app/state';
  import { AesirSidebar } from '@aesir/svelte';
  import { normalizePathname, resolveInternalHref } from '$lib/utils.js';

  let { sections = [] } = $props();
  let width = $state(288);
  const value = $derived(normalizePathname(page.url.pathname));
  const navigationSections = $derived(
    sections.map((section) => ({
      title: section.title,
      items: section.items.map((item) => ({
        value: normalizePathname(item.href),
        label: item.title,
        href: resolveInternalHref(item.href),
        icon: item.icon,
        badge: item.badge
      }))
    }))
  );
</script>

<AesirSidebar
  class="docs-sidebar"
  title="Documentation"
  label="Documentation"
  sections={navigationSections}
  {value}
  bind:width
  minWidth={224}
  maxWidth={384}
  resizable
  stickyTop="var(--header-height)"
  mobileTrigger="external"
  style="--aesir-sidebar-panel-padding: var(--ds-spacing-8) var(--ds-spacing-4) var(--ds-spacing-8) var(--ds-spacing-2); --aesir-sidebar-item-padding: var(--ds-spacing-2) var(--ds-spacing-3); --aesir-sidebar-item-gap: var(--ds-spacing-2); --aesir-sidebar-item-font-size: var(--ds-font-size-xs); --aesir-sidebar-item-line-height: var(--ds-font-line-height-xs); --aesir-sidebar-icon-size: var(--ds-spacing-3);"
/>

<style>
  :global(.docs-sidebar) {
    display: none;
  }

  @media (min-width: 1024px) {
    :global(.docs-sidebar) {
      display: block;
    }
  }
</style>
