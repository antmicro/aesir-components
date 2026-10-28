<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import { AesirIconSwap } from '../aesir-icon-swap/index.js';

  type CollapsibleProps = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'title'> & {
    class?: string;
    open?: boolean;
    title?: string;
    disabled?: boolean;
    triggerPosition?: 'top' | 'bottom';
    indicator?: 'chevron' | 'plus-minus';
    trigger?: Snippet<[{ open: boolean }]>;
    children?: Snippet;
  };

  let { class: className = '', open = $bindable(false), title, disabled = false, triggerPosition = 'top', indicator = 'chevron', trigger, children, ...restProps }: CollapsibleProps = $props();
  const collapsibleId = $props.id();
  const contentId = `${collapsibleId}-content`;
  let triggerRef = $state<HTMLButtonElement>();
  let contentRef = $state<HTMLDivElement>();

  $effect(() => {
    if (open || !triggerRef || !contentRef) return;
    const root = contentRef.getRootNode() as Document | ShadowRoot;
    if (contentRef.contains(root.activeElement)) triggerRef.focus();
  });

  const toggle = () => {
    if (!disabled) open = !open;
  };
</script>

<div
  class={`aesir-collapsible ${className}`.trim()}
  {...restProps}
  data-slot="collapsible"
  data-state={open ? 'open' : 'closed'}
  data-disabled={disabled || undefined}
  data-trigger-position={triggerPosition}
>
  <button bind:this={triggerRef} class="aesir-collapsible__trigger" type="button" aria-expanded={open} aria-controls={contentId} {disabled} onclick={toggle}>
    <span class="aesir-collapsible__trigger-content">
      {#if trigger}{@render trigger({ open })}{:else}{title}{/if}
    </span>
    {#if indicator === 'plus-minus'}
      <AesirIconSwap name="plus" activeName="minus" active={open} class="aesir-collapsible__icon" />
    {:else}
      <ChevronDown class="aesir-collapsible__icon aesir-collapsible__icon--chevron" aria-hidden="true" />
    {/if}
  </button>
  <div bind:this={contentRef} id={contentId} class="aesir-collapsible__content" aria-hidden={!open} inert={!open ? true : undefined}>
    <div class="aesir-collapsible__content-clip">
      <div class="aesir-collapsible__content-body">{@render children?.()}</div>
    </div>
  </div>
</div>

<style>
  :global {
    .aesir-collapsible {
      display: flex;
      flex-direction: column;
      width: 100%;
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-lg);
      background: var(--ds-background);
      color: var(--ds-foreground);
    }

    .aesir-collapsible__trigger {
      display: flex;
      width: 100%;
      min-height: var(--ds-spacing-10);
      align-items: center;
      justify-content: space-between;
      gap: var(--ds-spacing-3);
      padding: var(--ds-spacing-2-5) var(--ds-spacing-3);
      border: 0;
      border-radius: inherit;
      outline: none;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
      text-align: start;
      cursor: pointer;
      transition:
        background-color var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        box-shadow var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
    }

    .aesir-collapsible__trigger:hover:not(:disabled) {
      background: var(--ds-surface-hover);
    }

    .aesir-collapsible__trigger:focus-visible {
      box-shadow: 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-surface);
    }

    .aesir-collapsible__trigger-content {
      min-width: 0;
    }

    .aesir-collapsible__icon {
      width: var(--ds-spacing-4);
      height: var(--ds-spacing-4);
      flex-shrink: 0;
      color: var(--ds-foreground-muted);
      transition: transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }

    .aesir-collapsible__icon--chevron {
      transition: transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }

    .aesir-collapsible[data-state='open'] .aesir-collapsible__icon--chevron {
      transform: rotate(180deg);
    }

    .aesir-collapsible__content {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows var(--ds-motion-duration-moderate) var(--ds-motion-easing-subtle);
    }

    .aesir-collapsible[data-state='open'] .aesir-collapsible__content {
      grid-template-rows: 1fr;
    }

    .aesir-collapsible__content-clip {
      min-height: 0;
      overflow: hidden;
    }

    .aesir-collapsible__content-body {
      padding: var(--ds-spacing-3);
      overflow-wrap: anywhere;
    }

    .aesir-collapsible__content-body > :first-child {
      margin-top: 0;
    }

    .aesir-collapsible__content-body > :last-child {
      margin-bottom: 0;
    }

    .aesir-collapsible[data-disabled] {
      opacity: var(--ds-opacity-50);
    }

    .aesir-collapsible__trigger:disabled {
      cursor: not-allowed;
    }

    .aesir-collapsible[data-trigger-position='bottom'] .aesir-collapsible__trigger {
      order: 2;
    }

    .aesir-collapsible[data-trigger-position='bottom'] .aesir-collapsible__content {
      order: 1;
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-collapsible__content {
        transition: none;
      }
    }
  }
</style>
