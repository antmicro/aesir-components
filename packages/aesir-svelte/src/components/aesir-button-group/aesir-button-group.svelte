<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  type ButtonGroupProps = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> & {
    class?: string;
    orientation?: 'horizontal' | 'vertical';
    size?: 'sm' | 'default' | 'lg';
    children?: Snippet;
  };

  let { class: className = '', orientation = 'horizontal', size = 'default', children, ...restProps }: ButtonGroupProps = $props();
</script>

<div class={`aesir-button-group ${className}`.trim()} data-orientation={orientation} data-size={size} role="group" {...restProps}>
  {@render children?.()}
</div>

<style>
  :global {
    .aesir-button-group {
      display: inline-flex;
      align-items: stretch;
      width: var(--aesir-button-group-width, fit-content);
      max-width: 100%;
      isolation: isolate;
      --aesir-button-group-height: var(--ds-spacing-9);
    }

    .aesir-button-group[data-size='sm'] {
      --aesir-button-group-height: var(--ds-spacing-8);
    }

    .aesir-button-group[data-size='lg'] {
      --aesir-button-group-height: var(--ds-spacing-10);
    }

    .aesir-button-group[data-orientation='vertical'] {
      flex-direction: column;
    }

    .aesir-button-group[data-size] > :is(.aesir-button, button, a, input, select, [data-slot='button-group-text']),
    .aesir-button-group[data-size] > .aesir-input > .aesir-input__control {
      height: var(--aesir-button-group-height);
      border-radius: 0;
    }

    .aesir-button-group > :where(input, select) {
      min-width: 0;
      padding-inline: var(--ds-spacing-3);
      border: var(--ds-spacing-px) solid var(--ds-border);
      outline: none;
      background: var(--ds-background);
      color: var(--ds-foreground);
      font-family: var(--ds-font-family-sans);
      font-size: var(--ds-font-size-sm);
    }

    .aesir-button-group > .aesir-input {
      flex: 1 1 auto;
      width: auto;
      min-width: 0;
      gap: 0;
    }

    .aesir-button-group > .aesir-input > .aesir-input__control > input {
      min-width: 0;
    }

    .aesir-button-group > [data-slot='button-group-text'] {
      display: inline-flex;
      align-items: center;
      padding-inline: var(--ds-spacing-3);
      border: var(--ds-spacing-px) solid var(--ds-border);
      background: var(--ds-background-secondary);
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-sm);
      white-space: nowrap;
    }

    .aesir-button-group[data-orientation='horizontal'] > * + * {
      margin-inline-start: calc(var(--ds-spacing-px) * -1);
    }

    .aesir-button-group[data-orientation='vertical'] > * + * {
      margin-block-start: calc(var(--ds-spacing-px) * -1);
    }

    .aesir-button-group[data-orientation='horizontal'] > :first-child:not(.aesir-input) {
      border-start-start-radius: var(--ds-radius-lg);
      border-end-start-radius: var(--ds-radius-lg);
    }

    .aesir-button-group[data-orientation='horizontal'] > :last-child:not(.aesir-input) {
      border-start-end-radius: var(--ds-radius-lg);
      border-end-end-radius: var(--ds-radius-lg);
    }

    .aesir-button-group[data-orientation='horizontal'] > .aesir-input:first-child > .aesir-input__control {
      border-start-start-radius: var(--ds-radius-lg);
      border-end-start-radius: var(--ds-radius-lg);
    }

    .aesir-button-group[data-orientation='horizontal'] > .aesir-input:last-child > .aesir-input__control {
      border-start-end-radius: var(--ds-radius-lg);
      border-end-end-radius: var(--ds-radius-lg);
    }

    .aesir-button-group[data-orientation='vertical'] > :first-child:not(.aesir-input) {
      border-start-start-radius: var(--ds-radius-lg);
      border-start-end-radius: var(--ds-radius-lg);
    }

    .aesir-button-group[data-orientation='vertical'] > :last-child:not(.aesir-input) {
      border-end-start-radius: var(--ds-radius-lg);
      border-end-end-radius: var(--ds-radius-lg);
    }

    .aesir-button-group[data-orientation='vertical'] > .aesir-input:first-child > .aesir-input__control {
      border-start-start-radius: var(--ds-radius-lg);
      border-start-end-radius: var(--ds-radius-lg);
    }

    .aesir-button-group[data-orientation='vertical'] > .aesir-input:last-child > .aesir-input__control {
      border-end-start-radius: var(--ds-radius-lg);
      border-end-end-radius: var(--ds-radius-lg);
    }

    .aesir-button-group > :where(.aesir-button, button, a):active {
      transform: none;
    }

    .aesir-button-group > :where(.aesir-button, button, a, input, select, .aesir-input):hover,
    .aesir-button-group > :where(.aesir-button, button, a, input, select, .aesir-input):focus-within {
      z-index: 1;
    }

    .aesir-button-group > :where(input, select):focus-visible {
      z-index: 2;
      border-color: var(--ds-accent-ring);
      box-shadow: 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-surface);
    }
  }
</style>
