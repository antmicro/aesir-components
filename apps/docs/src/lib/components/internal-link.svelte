<script>
  /* eslint-disable svelte/no-navigation-without-resolve */
  import { resolveInternalHref } from '$lib/utils.js';

  let { href = '', class: className = '', children, ...restProps } = $props();
</script>

<a href={resolveInternalHref(href)} class={className} {...restProps}>
  {@render children?.()}
</a>
