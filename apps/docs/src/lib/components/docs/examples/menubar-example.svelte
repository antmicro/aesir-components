<script>
  import { AesirMenubar } from '@aesir/svelte';
  let viewItems = $state([
    { label: 'Show sidebar', value: 'sidebar', role: 'menuitemcheckbox', checked: true },
    { label: 'Show status bar', value: 'status', role: 'menuitemcheckbox', checked: false },
    { label: 'Compact mode', value: 'compact', role: 'menuitemcheckbox', checked: false }
  ]);
  const menus = $derived([
    {
      label: 'File',
      items: [
        { label: 'New project', value: 'new', icon: 'plus', shortcut: 'Ctrl+Alt+N' },
        { label: 'Open…', value: 'open', icon: 'file', shortcut: 'Ctrl+Alt+O' },
        { label: 'Delete', value: 'delete', icon: 'trash-2', variant: 'destructive' }
      ]
    },
    { label: 'View', items: viewItems },
    {
      label: 'Help',
      items: [
        { label: 'Documentation', value: 'docs' },
        { label: 'Keyboard shortcuts', value: 'shortcuts' },
        { label: 'About Aesir', value: 'about' }
      ]
    }
  ]);
  let action = $state('Choose an action');
  const select = (item) => {
    if (item.role === 'menuitemcheckbox') viewItems = viewItems.map((candidate) => (candidate.value === item.value ? { ...candidate, checked: !candidate.checked } : candidate));
    else action = item.label;
  };
</script>

<div class="example">
  <AesirMenubar {menus} onselect={select} />
  <p>{action}</p>
</div>

<style>
  .example {
    display: grid;
    place-items: center;
    gap: var(--ds-spacing-3);
  }
  p {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
</style>
