<script>
  import { AesirButton, AesirCommandMenu, AesirIcon, AesirKbd } from '@aesir/svelte';

  let open = $state(false);
  let selected = $state('No command selected');

  const groups = [
    {
      label: 'Go to',
      items: [
        {
          id: 'users',
          label: 'Users',
          description: 'Find a workspace member',
          icon: 'users',
          placeholder: 'Search users…',
          groups: [
            {
              label: 'Users',
              items: [
                { id: 'morgan', label: 'Morgan Brown', description: 'Design systems' },
                { id: 'sam', label: 'Sam Rivera', description: 'Frontend' }
              ]
            }
          ]
        },
        {
          id: 'merge-requests',
          label: 'Merge requests',
          description: 'Open a recent merge request',
          icon: 'git-pull-request',
          placeholder: 'Search merge requests…',
          groups: [
            {
              label: 'Merge requests',
              items: [
                { id: 'mr-184', label: '!184 Improve sidebar navigation', description: 'Open · updated today' },
                { id: 'mr-179', label: '!179 Add command menu', description: 'Draft · updated yesterday' }
              ]
            }
          ]
        },
        {
          id: 'issues',
          label: 'Issues',
          description: 'Browse assigned issues',
          icon: 'circle-dot',
          placeholder: 'Search issues…',
          groups: [
            {
              label: 'Issues',
              items: [
                { id: 'issue-42', label: '#42 Autocomplete scrolls on hover', description: 'Bug' },
                { id: 'issue-38', label: '#38 Improve mobile toolbar', description: 'Enhancement' }
              ]
            }
          ]
        },
        {
          id: 'projects',
          label: 'Projects',
          description: 'Switch project context',
          icon: 'package',
          placeholder: 'Search projects…',
          groups: [
            {
              label: 'Projects',
              items: [
                { id: 'aesir', label: 'Aesir design system', description: '12 active members' },
                { id: 'docs', label: 'Documentation', description: '8 active members' }
              ]
            }
          ]
        }
      ]
    }
  ];
</script>

<div class="command-menu-example">
  <AesirButton variant="outline" onclick={() => (open = true)}>
    <AesirIcon name="command" />
    Open command menu
    <AesirKbd meta small>K</AesirKbd>
  </AesirButton>
  <p>{selected}</p>
</div>

<AesirCommandMenu bind:open {groups} shortcut={false} showFooter onselect={(item) => (selected = `${item.label} selected`)} />

<style>
  .command-menu-example {
    display: grid;
    place-items: center;
    gap: var(--ds-spacing-3);
  }

  .command-menu-example p {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
</style>
