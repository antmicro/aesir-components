<script>
  import ToastColoredExample from '$lib/components/docs/examples/toast-colored-example.svelte';
</script>

<svelte:head>
  <title>Colored toast states</title>
</svelte:head>

<main class="toast-preview">
  <ToastColoredExample />
</main>

<style>
  .toast-preview {
    display: grid;
    min-height: 100dvh;
    place-items: center;
    padding: var(--ds-spacing-4);
  }
</style>
