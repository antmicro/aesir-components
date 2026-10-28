<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getContext } from 'svelte';
  import type { ContextMenuContext } from './types.js';

  type ContextMenuTriggerProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'oncontextmenu'> & {
    ref?: HTMLDivElement;
    oncontextmenu?: (event: MouseEvent) => void;
    children?: Snippet;
  };

  let { ref = $bindable(), oncontextmenu, children, ...restProps }: ContextMenuTriggerProps = $props();
  const menu = getContext<ContextMenuContext>('context-menu');
  let localRef = $state<HTMLDivElement>();
  const isOpen = $derived.by(() => menu?.getOpen?.() ?? false);

  const getReturnFocus = (target: EventTarget | null) =>
    target instanceof Element ? (target.closest<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? localRef) : localRef;

  $effect(() => {
    ref = localRef;
  });

  const onContextMenu = (event: MouseEvent) => {
    oncontextmenu?.(event);
    event.preventDefault();
    menu?.setPosition?.(event.clientX, event.clientY);
    menu?.setOpen?.(true, { returnFocus: getReturnFocus(event.target) });
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
    event.preventDefault();
    const rect = localRef?.getBoundingClientRect();
    if (!rect) return;
    menu?.setPosition?.(rect.left, rect.bottom);
    menu?.setOpen?.(true, { returnFocus: getReturnFocus(event.target) });
  };
</script>

<div bind:this={localRef} data-state={isOpen ? 'open' : 'closed'} oncontextmenu={onContextMenu} onkeydowncapture={onKeydown} {...restProps}>
  {@render children?.()}
</div>
