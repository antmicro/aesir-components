<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { onDestroy, setContext } from 'svelte';
  import { SubmenuController } from '../aesir-dropdown/submenu-controller.svelte.js';
  import { registerDismissableOverlay } from '../overlay/overlay.js';
  import type { ContextMenuContext, ContextMenuOpenOptions } from './types.js';

  type ContextMenuProps = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> & {
    open?: boolean;
    modal?: boolean;
    class?: string;
    children?: Snippet;
  };

  let { open = $bindable(false), modal = true, class: className, children, ...restProps }: ContextMenuProps = $props();
  let rootRef = $state<HTMLDivElement>();
  let contentRef = $state<HTMLElement>();
  let position = $state({ x: 0, y: 0 });
  let returnFocus: HTMLElement | null;
  const submenu = new SubmenuController(() => contentRef);

  const setOpen = (value: boolean, { restoreFocus = false, returnFocus: nextReturnFocus }: ContextMenuOpenOptions = {}) => {
    if (value) {
      submenu.reset();
      if (!open) returnFocus = nextReturnFocus ?? ((rootRef?.getRootNode() as Document | ShadowRoot | undefined)?.activeElement as HTMLElement | null);
    }
    open = value;
    if (!value) {
      submenu.reset();
      if (restoreFocus) queueMicrotask(() => returnFocus?.isConnected && returnFocus.focus?.());
    }
  };
  const setPosition = (x: number, y: number) => {
    position = { x, y };
  };

  $effect(() => {
    if (!open) {
      submenu.reset();
      return;
    }
    if (!rootRef || !contentRef) return;
    const ownerDocument = rootRef.ownerDocument;
    const releaseDismissable = registerDismissableOverlay(ownerDocument, {
      branches: () => [contentRef],
      exclusive: true,
      modal,
      onDismiss: (reason: string, event: PointerEvent | KeyboardEvent) => {
        if (reason === 'pointerdown' && 'button' in event && event.button !== 0) return;
        setOpen(false, { restoreFocus: reason === 'escape' || (modal && reason === 'pointerdown') });
      }
    });

    return () => {
      releaseDismissable();
    };
  });

  setContext<ContextMenuContext>('context-menu', {
    getOpen: () => open,
    getModal: () => modal,
    setOpen,
    getPosition: () => position,
    setPosition,
    setContent: (element) => (contentRef = element),
    submenu
  });

  onDestroy(() => submenu.destroy());
</script>

<div bind:this={rootRef} class={`context-menu-root ${className ?? ''}`.trim()} data-state={open ? 'open' : 'closed'} {...restProps}>
  {@render children?.()}
</div>

<style>
  .context-menu-root {
    position: relative;
  }
</style>
