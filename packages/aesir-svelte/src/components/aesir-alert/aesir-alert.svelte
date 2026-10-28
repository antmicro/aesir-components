<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import AesirIcon from '../aesir-icon/aesir-icon.svelte';
  type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'role' | 'title'> & {
    class?: string;
    variant?: 'default' | 'info' | 'success' | 'warning' | 'destructive';
    icon?: string;
    title?: string;
    titleElement?: keyof HTMLElementTagNameMap;
    description?: string;
    children?: Snippet;
    action?: Snippet;
    role?: 'alert' | 'status';
  };
  let { class: className = '', variant = 'default', icon, title, titleElement = 'div', description, children, action, role: roleProp, ...restProps }: AlertProps = $props();
  const liveRole = $derived(roleProp ?? (variant === 'destructive' ? 'alert' : 'status'));
</script>

<div data-slot="alert" data-variant={variant} data-has-icon={icon ? '' : undefined} data-has-action={action ? '' : undefined} role={liveRole} class={`aesir-alert ${className}`.trim()} {...restProps}>
  {#if icon}
    <span class="aesir-alert__icon" aria-hidden="true">
      <AesirIcon name={icon} size={16} />
    </span>
  {/if}

  {#if title}<svelte:element this={titleElement} data-slot="alert-title" class="aesir-alert__title">{title}</svelte:element>{/if}
  {#if description || children}
    <div data-slot="alert-description" class="aesir-alert__description">
      {description}
      {@render children?.()}
    </div>
  {/if}

  {#if action}
    <div data-slot="alert-action" class="aesir-alert__action">
      {@render action()}
    </div>
  {/if}
</div>

<style>
  :global {
    .aesir-alert {
      --aesir-alert-tone: var(--ds-foreground-muted);

      box-sizing: border-box;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      align-items: start;
      gap: var(--ds-spacing-0-5);
      width: 100%;
      padding: var(--ds-spacing-2) var(--ds-spacing-2-5);
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-lg);
      background: var(--ds-background-secondary);
      color: var(--ds-foreground);
      font-size: var(--ds-font-size-sm);
      text-align: left;
    }

    .aesir-alert[data-has-icon] {
      grid-template-columns: var(--ds-spacing-4) minmax(0, 1fr);
      column-gap: var(--ds-spacing-2);
    }

    .aesir-alert[data-has-action] {
      grid-template-columns: minmax(0, 1fr) auto;
      column-gap: var(--ds-spacing-3);
    }

    .aesir-alert[data-has-icon][data-has-action] {
      grid-template-columns: var(--ds-spacing-4) minmax(0, 1fr) auto;
      column-gap: var(--ds-spacing-2);
    }

    .aesir-alert__icon {
      display: grid;
      grid-row: 1 / span 2;
      width: var(--ds-spacing-4);
      height: var(--ds-spacing-4);
      margin-top: var(--ds-spacing-0-5);
      place-items: center;
      color: var(--aesir-alert-tone);
    }

    .aesir-alert__title {
      min-width: 0;
      margin: 0;
      color: var(--ds-foreground);
      font-size: var(--ds-font-size-sm);
      line-height: var(--ds-font-line-height-sm);
      overflow-wrap: anywhere;
      text-wrap: balance;
    }

    .aesir-alert__description {
      min-width: 0;
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-xs);
      line-height: var(--ds-font-line-height-sm);
      overflow-wrap: anywhere;
      text-wrap: pretty;
    }

    .aesir-alert[data-has-icon] :is(.aesir-alert__title, .aesir-alert__description) {
      grid-column: 2;
    }

    .aesir-alert__action {
      display: flex;
      grid-row: 1 / span 2;
      grid-column: -1;
      align-items: center;
      align-self: start;
      justify-content: flex-end;
      margin-left: var(--ds-spacing-1);
    }

    .aesir-alert :is(.aesir-alert__title, .aesir-alert__description) a {
      color: inherit;
      text-decoration: underline;
      text-underline-offset: var(--ds-spacing-0-5);
    }

    .aesir-alert :is(.aesir-alert__title, .aesir-alert__description) a:hover {
      color: var(--ds-foreground);
    }

    .aesir-alert__description :where(p) {
      margin: 0;
    }

    .aesir-alert__description :where(p:not(:last-child)) {
      margin-bottom: var(--ds-spacing-4);
    }

    .aesir-alert[data-variant='info'] {
      --aesir-alert-tone: var(--ds-accent-text-muted);
    }

    .aesir-alert[data-variant='success'] {
      --aesir-alert-tone: var(--ds-foreground-muted-green);
    }

    .aesir-alert[data-variant='warning'] {
      --aesir-alert-tone: var(--ds-foreground-muted-orange);
    }

    .aesir-alert[data-variant='destructive'] {
      --aesir-alert-tone: var(--ds-foreground-muted-red);

      border-color: var(--ds-border-red);
      background: var(--ds-surface-red);
      color: var(--ds-foreground-muted-red);
    }

    .aesir-alert[data-variant='destructive'] .aesir-alert__title {
      color: var(--ds-foreground-muted-red);
    }

    .aesir-alert[data-variant='destructive'] .aesir-alert__description {
      color: var(--ds-foreground-muted-red);
    }
  }
</style>
