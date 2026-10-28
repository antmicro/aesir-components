<script>
  import { AesirButton, AesirDropdown, AesirIcon } from '@aesir/svelte';

  const actions = [
    { type: 'label', label: 'Create' },
    {
      label: 'Document',
      value: 'document',
      icon: 'file',
      items: [
        { label: 'New document', value: 'new-document', icon: 'plus' },
        { label: 'Open document', value: 'open-document', icon: 'file' },
        { label: 'Export as PDF', value: 'export-pdf', icon: 'download' }
      ]
    },
    {
      label: 'Templates',
      value: 'templates',
      icon: 'layers-2',
      items: [
        { label: 'Research article', value: 'research' },
        { label: 'Project proposal', value: 'proposal' },
        {
          label: 'Team templates',
          value: 'team-templates',
          items: [
            { label: 'Design review', value: 'design-review' },
            { label: 'Release notes', value: 'release-notes' }
          ]
        },
        { label: 'Technical report', value: 'report' }
      ]
    },
    { type: 'separator' },
    { type: 'label', label: 'Project' },
    { label: 'View documentation', value: 'documentation', href: '/docs/' },
    { label: 'Edit project', value: 'edit', shortcut: 'E' },
    { label: 'Duplicate', value: 'duplicate', shortcut: 'D' },
    { label: 'Archive', value: 'archive', disabled: true },
    { label: 'Delete project', value: 'delete', variant: 'destructive' }
  ];
  const workspaces = [
    { label: 'Documentation', value: 'documentation' },
    { label: 'Design system', value: 'design-system' },
    { label: 'Developer tools', value: 'developer-tools' }
  ];

  let selected = $state('No action selected');
  let workspace = $state('Select workspace');
  let workspaceError = $state(true);
</script>

<div class="dropdown-example">
  <AesirDropdown items={actions} onselect={(item) => (selected = item.label)}>
    {#snippet trigger(props)}
      <AesirButton variant="outline" {...props}>Cascading menu <AesirIcon name="chevron-down" /></AesirButton>
    {/snippet}
  </AesirDropdown>
  <p>{selected}</p>
  <AesirDropdown items={Array.from({ length: 30 }, (_, index) => ({ label: `Workspace ${index + 1}`, value: index }))} label="All workspaces">
    {#snippet trigger(props)}
      <AesirButton variant="outline" {...props}>Long menu <AesirIcon name="chevron-down" /></AesirButton>
    {/snippet}
  </AesirDropdown>
  <AesirDropdown
    items={workspaces}
    error={workspaceError}
    label="Select workspace"
    onselect={(item) => {
      workspace = item.label;
      workspaceError = false;
    }}
  >
    {#snippet trigger(props)}
      <AesirButton variant="outline" {...props}>{workspace} <AesirIcon name="chevron-down" /></AesirButton>
    {/snippet}
  </AesirDropdown>
  {#if workspaceError}<p class="error" role="alert">Choose a workspace to continue.</p>{/if}
</div>

<style>
  .dropdown-example {
    display: grid;
    place-items: center;
    gap: var(--ds-spacing-3);
  }

  .dropdown-example p {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }

  .dropdown-example .error {
    color: var(--ds-foreground-red);
  }
</style>
