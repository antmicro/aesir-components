<script>
  import { AesirSidebar, AesirIcon, AesirButton } from '@aesir/svelte';

  let value = $state('installation');
  let expanded = $state(['guide', 'building', 'reference']);
  let collapsed = $state(false);
  let width = $state(320);
  const findPath = (entries, id) => {
    for (const item of entries) {
      if (item.id === id) return [item];
      const nested = findPath(item.items ?? [], id);
      if (nested.length) return [item, ...nested];
    }
    return [];
  };
  const link = (id, label, icon, items) => ({ id, label, icon, href: `#${id}`, items });
  const items = [
    {
      id: 'guide',
      label: 'Getting started',
      href: '#guide',
      icon: 'file',
      badge: 6,
      items: [
        link('introduction', 'Introduction', 'info'),
        link('installation', 'Installation', 'download'),
        { ...link('configuration', 'Configuration', 'settings'), badge: 0 },
        link('project-structure', 'Project structure', 'layers-2'),
        link('quickstart', 'Quick start', 'rocket'),
        link('upgrading', 'Upgrading', 'refresh-cw')
      ]
    },
    link('building', 'Build your application', 'layout-dashboard', [
      link('routing', 'Routing', 'git-merge', [
        link('routes', 'Defining routes', 'file'),
        link('layouts', 'Layouts and pages', 'panels-top-left'),
        link('navigation', 'Navigation', 'arrow-right'),
        link('loading', 'Loading states', 'loader-circle')
      ]),
      link('data', 'Data fetching', 'database', [
        link('server-data', 'Server data', 'terminal'),
        link('client-data', 'Client queries', 'monitor'),
        link('mutations', 'Mutations', 'edit'),
        link('caching', 'Caching', 'refresh-cw')
      ]),
      link('rendering', 'Rendering', 'smartphone'),
      link('styling', 'Styling', 'palette', [link('tokens', 'Design tokens', 'variable'), link('themes', 'Themes', 'sun'), link('typography', 'Typography', 'type')]),
      link('authentication', 'Authentication', 'shield-check'),
      link('forms', 'Forms and validation', 'form-input'),
      link('testing', 'Testing', 'check'),
      link('accessibility', 'Accessibility', 'users'),
      link('deployment', 'Deployment', 'upload')
    ]),
    {
      id: 'reference',
      label: 'API reference',
      href: '#reference',
      icon: 'terminal',
      items: [
        {
          id: 'components',
          label: 'Components',
          href: '#components',
          icon: 'package',
          items: [
            link('sidebar', 'Sidebar', 'panel-left'),
            link('annotation', 'Annotation', 'message-square-more'),
            link('buttons', 'Buttons', 'mouse-pointer-click'),
            link('dialogs', 'Dialogs', 'panels-top-left'),
            link('tables', 'Tables', 'table-2'),
            link('menus', 'Menus', 'menu')
          ]
        },
        link('functions', 'Functions', 'command'),
        link('configuration-api', 'Configuration options', 'sliders-horizontal'),
        link('events', 'Events', 'activity'),
        link('cli', 'Command line', 'terminal')
      ]
    },
    {
      ...link('resources', 'Resources', 'swatch-book', [link('examples', 'Examples', 'grid-3x3'), link('migration', 'Migration guide', 'arrow-right'), link('community', 'Community', 'users')]),
      divider: true
    },
    { id: 'issues', label: 'Report an issue', href: 'https://github.com/antmicro', target: '_blank', icon: 'arrow-up-right', divider: true }
  ];
</script>

<div class="documentation-tree">
  <AesirSidebar
    title="Documentation"
    variant="app"
    branchBehavior="navigate"
    treeLines
    resizable
    collapsible
    collapseTrigger="external"
    bind:collapsed
    bind:width
    stickyBranches
    mobileTrigger="floating"
    {items}
    bind:value
    bind:expanded
    sticky={false}
    style="--aesir-sidebar-height: 34rem;"
  >
    {#snippet header()}
      <div class="tree-heading">
        <span>Documentation</span>
      </div>
    {/snippet}
  </AesirSidebar>
  <section class="document-content">
    <nav class="document-breadcrumbs" aria-label="Documentation location">
      <span class="desktop-collapse">
        <AesirButton variant="outline" size="icon-sm" aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} aria-expanded={!collapsed} onclick={() => (collapsed = !collapsed)}>
          <AesirIcon name={collapsed ? 'panel-left-open' : 'panel-left-close'} size={16} />
        </AesirButton>
      </span>
      {#each findPath(items, value) as item, index (item.id)}
        {#if index}<AesirIcon name="chevron-right" size={14} />{/if}
        <button aria-current={item.id === value ? 'page' : undefined} onclick={() => (value = item.id)}>{item.label}</button>
      {/each}
    </nav>
    <div class="document-body">
      <h3>{findPath(items, value).at(-1)?.label ?? 'Documentation'}</h3>
    </div>
  </section>
</div>

<style>
  .documentation-tree {
    display: flex;
    width: 100%;
  }
  .document-content {
    min-width: 0;
    flex: 1;
  }
  .document-breadcrumbs {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--ds-spacing-2);
    padding: var(--ds-spacing-2);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }
  .document-breadcrumbs button {
    border: 0;
    background: transparent;
    color: var(--ds-foreground);
    font: inherit;
    font-size: var(--ds-font-size-xs);
    cursor: pointer;
  }
  .document-body {
    padding: var(--ds-spacing-4);
  }
  @media (max-width: 1023px) {
    .documentation-tree {
      flex-direction: column;
    }
    .desktop-collapse {
      display: none;
    }
  }
  .tree-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }
</style>
