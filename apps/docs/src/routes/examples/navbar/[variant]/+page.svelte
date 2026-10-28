<script>
  import Example from '$lib/components/docs/examples/navbar-example.svelte';
  import { onMount } from 'svelte';
  let { data } = $props();
  let menuTrigger = $state('hover');
  onMount(() => {
    menuTrigger = new URL(window.location.href).searchParams.get('trigger') === 'click' ? 'click' : 'hover';
  });
</script>

<svelte:head><title>Verks navbar - {data.variant}</title></svelte:head>
<main id="main-content" class="navbar-preview-page" tabindex="-1"><Example variant={data.variant} {menuTrigger} sandbox /></main>

<style>
  :global(html:has(.navbar-preview-page)) {
    scrollbar-gutter: auto;
  }
</style>
