<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  type KbdProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'class'> & {
    class?: string;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
    ctrl?: boolean;
    small?: boolean;
    children?: Snippet;
  };

  let { meta = false, shift = false, alt = false, ctrl = false, small = false, children = undefined, class: className = '', ...restProps }: KbdProps = $props();

  let applePlatform = $state(true);

  onMount(() => {
    const platform = navigator.platform ?? '';
    applePlatform = /mac|iphone|ipad|ipod/i.test(platform);
  });
</script>

<kbd class={`aesir-kbd ${className}`.trim()} data-size={small ? 'small' : 'default'} {...restProps}>
  {#if ctrl}<span>Ctrl</span>
    {#if alt || shift || meta || children}<span class="aesir-kbd__sr-only">+</span>{/if}{/if}
  {#if alt}<span>
      {#if applePlatform}<span aria-hidden="true">⌥</span>
        <span class="aesir-kbd__sr-only">Option</span>{:else}Alt{/if}
    </span>
    {#if shift || meta || children}<span class="aesir-kbd__sr-only">+</span>{/if}{/if}
  {#if shift}<span>
      {#if applePlatform}<span aria-hidden="true">⇧</span>
        <span class="aesir-kbd__sr-only">Shift</span>{:else}Shift{/if}
    </span>
    {#if meta || children}<span class="aesir-kbd__sr-only">+</span>{/if}{/if}
  {#if meta}<span>
      {#if applePlatform}<span aria-hidden="true">⌘</span>
        <span class="aesir-kbd__sr-only">Command</span>{:else}Ctrl{/if}
    </span>
    {#if children}<span class="aesir-kbd__sr-only">+</span>{/if}{/if}
  {#if children}<span>{@render children()}</span>{/if}
</kbd>

<style>
  :global {
    .aesir-kbd {
      display: inline-flex;
      width: fit-content;
      min-width: var(--ds-spacing-7);
      min-height: var(--ds-spacing-7);
      align-items: center;
      justify-content: center;
      gap: var(--ds-spacing-1);
      padding: 0 var(--ds-spacing-2);
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-md);
      background: var(--ds-background-secondary);
      box-shadow: inset 0 calc(var(--ds-spacing-px) * -1) 0 var(--ds-border);
      color: var(--ds-foreground-muted);
      font-family: var(--ds-font-family-sans);
      font-size: var(--ds-font-size-xs);
      font-weight: var(--ds-font-weight-medium);
      line-height: 1;
      user-select: none;
      white-space: nowrap;
    }

    .aesir-kbd[data-size='small'] {
      min-width: var(--ds-spacing-5);
      min-height: var(--ds-spacing-5);
      gap: var(--ds-spacing-0-5);
      padding-inline: var(--ds-spacing-1-5);
      font-size: var(--ds-font-size-xxs);
    }

    .aesir-kbd__sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  }
</style>
