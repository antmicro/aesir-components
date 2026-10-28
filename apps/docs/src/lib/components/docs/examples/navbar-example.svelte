<script>
  import Developer from './navbar-developer-example.svelte';
  import Marketing from './navbar-marketing-example.svelte';
  import Floating from './navbar-floating-example.svelte';
  let { variant = 'marketing', sandbox = false, menuTrigger = 'hover' } = $props();
  const Example = $derived({ developer: Developer, marketing: Marketing, floating: Floating }[variant] ?? Marketing);
</script>

<Example {sandbox} {menuTrigger} />
