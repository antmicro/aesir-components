<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { portal } from '../overlay/overlay.js';

  type ContextMenuPortalProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    children?: Snippet;
  };

  let { children, ...restProps }: ContextMenuPortalProps = $props();
</script>

<div use:portal data-slot="context-menu-portal" {...restProps}>
  {@render children?.()}
</div>
