<script>
  import { AesirButton, AesirIcon, AesirSidebar } from '@aesir/svelte';
  let { mode = 'responsive' } = $props();

  const sections = [
    {
      title: 'Workspace',
      items: [
        { value: 'overview', label: 'Overview', icon: 'layout-dashboard' },
        {
          value: 'commerce',
          label: 'Commerce',
          icon: 'credit-card',
          items: [
            { value: 'commerce-overview', label: 'Overview', icon: 'layout-dashboard' },
            { value: 'orders', label: 'Orders', icon: 'file', badge: '12' },
            { value: 'products', label: 'Products', icon: 'package' },
            { value: 'customers', label: 'Customers', icon: 'user' }
          ]
        }
      ]
    },
    {
      title: 'Manage',
      items: [
        { value: 'analytics', label: 'Analytics', icon: 'chart-no-axes-column-increasing' },
        {
          value: 'configuration',
          label: 'Configuration',
          icon: 'settings',
          items: [
            { value: 'configuration-overview', label: 'Overview', icon: 'layout-dashboard' },
            { value: 'settings', label: 'General', icon: 'sliders-horizontal' },
            { value: 'billing', label: 'Billing', icon: 'credit-card' }
          ]
        }
      ]
    }
  ];

  let selected = $state('overview');
  let expanded = $state(['commerce']);
  let collapsed = $state(false);
  const contentBlocks = Array.from({ length: 6 }, (_, index) => index);
  const flattenItems = (items) => items.flatMap((item) => [item, ...flattenItems(item.items ?? [])]);
</script>

<div class="sidebar-example" data-mode={mode}>
  <AesirSidebar
    title="Acme"
    label="Workspace navigation"
    variant="app"
    {mode}
    {sections}
    resizable
    collapsible
    collapseTrigger="external"
    style="--aesir-sidebar-height: 100%;"
    bind:value={selected}
    bind:expanded
    bind:collapsed
  />

  <div class="sidebar-example__content">
    <header class="content-header">
      <AesirButton variant="outline" size="icon-sm" aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} aria-expanded={!collapsed} onclick={() => (collapsed = !collapsed)}>
        <AesirIcon name={collapsed ? 'panel-left-open' : 'panel-left-close'} size={16} />
      </AesirButton>
      <nav class="content-breadcrumbs" aria-label="Breadcrumb">
        <span>Acme</span>
        <AesirIcon name="chevron-right" size={13} />
        <span aria-current="page">{flattenItems(sections.flatMap((section) => section.items)).find((item) => item.value === selected)?.label}</span>
      </nav>
    </header>
    <div class="sidebar-example__current-page">
      <div class="page-heading">
        <span>Current page</span>
        <strong>{flattenItems(sections.flatMap((section) => section.items)).find((item) => item.value === selected)?.label}</strong>
      </div>
      {#each contentBlocks as index (index)}
        <div class="content-block" aria-hidden="true"></div>
      {/each}
    </div>
  </div>
</div>

<style>
  .sidebar-example {
    display: flex;
    width: 100%;
    height: calc(100dvh - var(--ds-spacing-16));
    min-height: 0;
    overflow: hidden;
    border: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background);
  }

  .sidebar-example__content {
    display: flex;
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    flex-direction: column;
    flex: 1;
  }

  .content-header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    min-height: var(--ds-spacing-12);
    align-items: center;
    gap: var(--ds-spacing-2);
    padding-inline: var(--ds-spacing-3);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
    background: var(--ds-background);
    flex: 0 0 auto;
  }

  .content-breadcrumbs {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-1);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
  }

  .content-breadcrumbs span,
  .content-breadcrumbs :global(svg) {
    color: var(--ds-foreground-muted);
  }

  .sidebar-example__current-page {
    display: grid;
    align-content: start;
    gap: var(--ds-spacing-4);
    padding: var(--ds-spacing-6);
  }

  .page-heading {
    display: grid;
    gap: var(--ds-spacing-1);
    padding-block: var(--ds-spacing-4);
  }

  .page-heading span {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }

  .page-heading strong {
    font-size: var(--ds-font-size-lg);
  }

  .content-block {
    min-height: var(--ds-spacing-40);
    border: var(--ds-spacing-px) solid var(--ds-border);
  }

  .sidebar-example[data-mode='mobile'] {
    display: block;
    height: calc(100dvh - var(--ds-spacing-16));
    min-height: 0;
    border: 0;
  }

  .sidebar-example[data-mode='mobile'] .sidebar-example__content {
    display: none;
  }

  @media (max-width: 1023px) {
    .sidebar-example:not([data-mode='desktop']) {
      height: calc(100dvh - var(--ds-spacing-16));
      min-height: 0;
      border: 0;
    }

    .sidebar-example:not([data-mode='desktop']) .sidebar-example__content {
      display: none;
    }
  }
</style>
