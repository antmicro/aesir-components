<script>
  import { AesirTreeView } from '@aesir/svelte';

  const items = [
    {
      label: 'src',
      value: 'src',
      icon: 'folder',
      items: [
        {
          label: 'components',
          value: 'components',
          icon: 'folder',
          items: [
            { label: 'button.svelte', value: 'button', icon: 'file' },
            { label: 'dialog.svelte', value: 'dialog', icon: 'file' }
          ]
        },
        { label: 'routes', value: 'routes', icon: 'folder' }
      ]
    },
    { label: 'package.json', value: 'package', icon: 'file' }
  ];

  let value = $state('button');
  let expanded = $state(['src', 'components']);
</script>

<div class="example">
  <AesirTreeView {items} bind:value bind:expanded label="Project files" size="sm" />
  <p>Selected: {value}</p>
</div>

<style>
  .example {
    display: grid;
    width: min(100%, var(--ds-sizing-sm));
    gap: var(--ds-spacing-3);
  }

  p {
    margin: 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
</style>
