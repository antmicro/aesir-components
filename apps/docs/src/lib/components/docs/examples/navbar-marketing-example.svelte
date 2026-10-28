<script>
  import { AesirButton, AesirCommandMenu, AesirNavbar } from '@aesir/svelte';
  import { resolveInternalHref } from '$lib/utils.js';
  import verksLight from '$lib/assets/common/verks-logotype/verks--logo-light.svg';
  import verksDark from '$lib/assets/common/verks-logotype/verks--logo-dark.svg';

  let { sandbox = false, menuTrigger = 'hover' } = $props();
  let commandOpen = $state(false);
  let selected = $state('');
  const href = (path) => resolveInternalHref(`/docs/${path}/`);
  const brand = { label: 'Verks', href: `${href('brand')}#verks` };
  const features = [
    { label: 'Components', description: 'UI components and examples.', icon: 'package', href: href('components/accordion') },
    { label: 'Design tokens', description: 'Shared styles and tokens.', icon: 'palette', href: href('colors') },
    { label: 'Navigation', description: 'Menus, tabs, and navigation.', icon: 'panels-top-left', href: href('components/navbar') },
    { label: 'Forms', description: 'Inputs and validation.', icon: 'form-input', href: href('components/input') },
    { label: 'Icons', description: 'Searchable icon library.', icon: 'sparkles', href: href('icons') },
    { label: 'Brand assets', description: 'Logos and brand files.', icon: 'swatch-book', href: href('brand') }
  ];
  const resources = [
    { label: 'Documentation', description: 'APIs and working examples.', icon: 'file', href: resolveInternalHref('/docs/') },
    { label: 'Typography', description: 'Fonts and type scales.', icon: 'type', href: href('typography') },
    { label: 'Colors', description: 'Light and dark palettes.', icon: 'palette', href: href('colors') }
  ];
  const guides = [
    ...resources,
    { label: 'Keyboard interactions', description: 'Shortcuts and command search.', icon: 'command', href: href('components/command-menu') },
    { label: 'Form patterns', description: 'Validation and grouped inputs.', icon: 'form-input', href: href('components/input') }
  ];
  const marketingItems = [
    {
      label: 'Platform',
      menu: 'mega',
      items: [
        {
          label: 'Build with Aesir',
          eyebrow: 'COMPONENT LIBRARY',
          description: 'Components, tokens, and ready-to-use examples.',
          cta: 'Browse documentation',
          featured: true,
          icon: 'layers-2',
          href: resolveInternalHref('/docs/')
        },
        ...features
      ]
    },
    { label: 'Resources', items: guides },
    { label: 'Docs', href: resolveInternalHref('/docs/') }
  ];
  const commands = [{ label: 'Navigate', items: features.map((item) => ({ ...item, id: item.href })) }];
</script>

{#snippet categories()}
  {#each ['Components', 'Forms', 'Navigation', 'Feedback'] as category (category)}<AesirButton variant="ghost" size="sm" onclick={() => (selected = `${category} selected`)}>
      {category}
    </AesirButton>{/each}
{/snippet}

{#snippet logo()}
  <img class="verks-logo verks-logo--light" src={verksLight} alt="Verks" width="98" height="24" />
  <img class="verks-logo verks-logo--dark" src={verksDark} alt="Verks" width="98" height="24" />
{/snippet}

<div class="navbar-example">
  <AesirNavbar
    {brand}
    {logo}
    secondary={categories}
    layout="contained"
    align="center"
    items={marketingItems}
    {menuTrigger}
    searchHint={sandbox ? 'K' : undefined}
    onsearch={() => (commandOpen = true)}
  >
    {#snippet actions()}
      <AesirButton size="sm" href={resolveInternalHref('/docs/')}>Get started</AesirButton>
    {/snippet}
  </AesirNavbar>
  {#if selected}<p class="example-status" role="status">{selected}</p>{/if}
</div>

<AesirCommandMenu bind:open={commandOpen} groups={commands} shortcut={sandbox ? 'k' : false} label="Search Verks" placeholder="Search components, pages…" showFooter />

<style>
  .navbar-example {
    min-height: 100dvh;
    width: 100%;
    min-width: 0;
    background: var(--ds-background);
  }
  .verks-logo {
    display: block;
    width: 98px;
    height: 24px;
    object-fit: contain;
  }
  .verks-logo--dark {
    display: none;
  }
  :global(.dark) .verks-logo--light {
    display: none;
  }
  :global(.dark) .verks-logo--dark {
    display: block;
  }
  .example-status {
    margin: 0;
    padding: var(--ds-spacing-3);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
</style>
