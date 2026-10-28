<script>
  import { AesirButton, AesirDropdown, AesirIcon } from '@aesir/svelte';
  let { currentItem } = $props();

  const ancestors = [
    { label: 'Projects', href: '#projects' },
    { label: 'ACME corporation - Machine That Goes Ping', href: '#project-711' }
  ];
  const parentPages = [{ value: 'home', label: 'Home' }, ...ancestors.map((item) => ({ value: item.href.slice(1), label: item.label })), { value: 'requirements', label: 'Requirements' }];
  let tight = $state(false);
  let collapsed = $state(true);
  function observeWidth(node) {
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      collapsed = width < 1000;
      tight = width < 360;
    });
    observer.observe(node);
    return () => observer.disconnect();
  }
</script>

<!-- Demo navigation deliberately uses local fragment placeholders. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class="breadcrumb-layout" {@attach observeWidth}>
  <nav class="breadcrumbs" data-collapsed={collapsed} data-tight={tight} aria-label="Breadcrumb">
    <a class="breadcrumbs__context" href="#home">Home</a>
    <AesirIcon class="breadcrumbs__context" name="chevron-right" size={13} />
    <div class="breadcrumbs__overflow">
      <AesirDropdown
        align="start"
        label="Parent pages"
        items={parentPages}
        contentStyle="width: min(24rem, calc(100vw - var(--ds-spacing-6)));"
        onselect={(item) => (window.location.hash = item.value)}
      >
        {#snippet trigger(props)}
          <AesirButton {...props} size="icon-sm" variant="ghost" aria-label="Show parent pages"><AesirIcon name="ellipsis" size={16} /></AesirButton>
        {/snippet}
        {#snippet itemContent({ item })}
          <span class="parent-page-label">{item.label}</span>
        {/snippet}
      </AesirDropdown>
    </div>
    {#each ancestors as item (item.href)}
      <a href={item.href} class="breadcrumbs__ancestor" title={item.label}>{item.label}</a>
      <AesirIcon class="breadcrumbs__ancestor" name="chevron-right" size={13} />
    {/each}
    <AesirIcon class="breadcrumbs__overflow" name="chevron-right" size={13} />
    <a class="breadcrumbs__context" href="#requirements">Requirements</a>
    <AesirIcon class="breadcrumbs__context" name="chevron-right" size={13} />
    <div class="breadcrumbs__current">
      {#if currentItem}
        {@render currentItem()}
      {:else}
        <span aria-current="page" title="Machine Ping Sow">Machine Ping Sow</span>
      {/if}
    </div>
  </nav>
</div>

<!-- eslint-enable svelte/no-navigation-without-resolve -->

<style>
  .breadcrumb-layout {
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
  .breadcrumbs {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: var(--ds-spacing-1);
    overflow: hidden;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
    white-space: nowrap;
  }
  .breadcrumbs > a,
  .breadcrumbs :global(svg),
  .breadcrumbs__overflow {
    flex-shrink: 0;
  }
  .breadcrumbs .breadcrumbs__current {
    min-width: 0;
    flex-shrink: 1;
    overflow: hidden;
    color: var(--ds-foreground);
    text-overflow: ellipsis;
  }
  .breadcrumbs__overflow,
  .breadcrumbs :global(svg.breadcrumbs__overflow) {
    display: none;
  }
  [data-collapsed='true'] .breadcrumbs__ancestor,
  [data-collapsed='true'] :global(svg.breadcrumbs__ancestor) {
    display: none;
  }
  [data-collapsed='true'] .breadcrumbs__overflow,
  [data-collapsed='true'] :global(svg.breadcrumbs__overflow) {
    display: inline-flex;
  }
  .parent-page-label {
    min-width: 0;
    text-align: left;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  [data-tight='true'] .breadcrumbs__context,
  [data-tight='true'] :global(svg.breadcrumbs__context) {
    display: none;
  }
  a {
    color: inherit;
    text-decoration: none;
  }
  a:hover {
    color: var(--ds-foreground);
    text-decoration: underline;
  }
  a:focus-visible {
    outline: var(--ds-spacing-px) solid var(--ds-accent-ring);
    outline-offset: var(--ds-spacing-px);
    border-radius: var(--ds-radius-sm);
  }
</style>
