<script>
  import SidebarAppExample from '$lib/components/docs/examples/sidebar-app-example.svelte';
  import { onMount } from 'svelte';
  let mode = $state('responsive');
  onMount(() => {
    const params = new URL(window.location.href).searchParams;
    const requestedMode = params.get('mode');
    mode = requestedMode === 'desktop' || requestedMode === 'mobile' ? requestedMode : 'responsive';
  });
</script>

<svelte:head><title>Verks app sidebar</title></svelte:head>
<main id="main-content" class="sidebar-preview-page" tabindex="-1"><SidebarAppExample {mode} /></main>

<style>
  .sidebar-preview-page {
    height: calc(100dvh - var(--ds-spacing-16));
    min-height: 0;
    overflow: hidden;
  }
  :global(html:has(.sidebar-preview-page)) {
    scrollbar-gutter: auto;
  }
</style>
