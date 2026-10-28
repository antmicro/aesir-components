<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { AesirIcon } from '../aesir-icon/index.js';
  import { AesirKbd } from '../aesir-kbd/index.js';
  import { isReservedShortcut } from '../keyboard/shortcut.js';

  type ContextMenuItemProps = Omit<HTMLButtonAttributes, 'children' | 'class' | 'disabled' | 'role' | 'tabindex'> & {
    icon?: string | null;
    shortcut?: string;
    variant?: 'default' | 'destructive';
    disabled?: boolean;
    class?: string;
    role?: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';
    tabindex?: number;
    children?: Snippet;
  };

  let { icon = null, shortcut = '', variant = 'default', disabled = false, class: className, role = 'menuitem', tabindex = -1, onclick, children, ...restProps }: ContextMenuItemProps = $props();
</script>

<button type="button" class={`context-menu-item ${className ?? ''}`.trim()} data-variant={variant} data-shortcut={shortcut || undefined} {disabled} {role} {tabindex} {onclick} {...restProps}>
  <span class="context-menu-item__label">
    {#if icon}
      <AesirIcon name={icon} class="context-menu-item__icon" size={16} aria-hidden="true" />
    {/if}
    {@render children?.()}
  </span>
  {#if shortcut && !isReservedShortcut(shortcut)}<AesirKbd class="context-menu-item__shortcut" small aria-hidden="true">{shortcut}</AesirKbd>{/if}
</button>

<style>
  .context-menu-item {
    display: grid;
    width: 100%;
    align-items: center;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--ds-spacing-4);
    padding: var(--ds-spacing-2) var(--ds-spacing-3);
    border: 0;
    border-radius: var(--ds-radius-md);
    background: transparent;
    color: var(--ds-foreground);
    font: inherit;
    text-align: left;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color var(--ds-motion-duration-instant) var(--ds-motion-easing-subtle),
      color var(--ds-motion-duration-instant) var(--ds-motion-easing-subtle);
  }

  .context-menu-item:hover,
  .context-menu-item:focus-visible {
    background: var(--ds-surface-hover);
    outline: none;
  }

  .context-menu-item[data-variant='destructive'] {
    color: var(--ds-foreground-red);
  }
  .context-menu-item:disabled {
    cursor: not-allowed;
    opacity: var(--ds-opacity-50);
  }
  .context-menu-item__label {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-2);
  }

  :global(.context-menu-item__shortcut) {
    flex: none;
  }

  .context-menu-item:focus-visible {
    box-shadow: inset 0 0 0 var(--ds-spacing-px) var(--ds-accent-ring);
  }

  :global(.context-menu-item__icon) {
    flex: none;
  }
</style>
