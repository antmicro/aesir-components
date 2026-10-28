<script>
  import { AesirButton, AesirCommandMenu, AesirDropdown, AesirIcon, AesirNavbar } from '@aesir/svelte';
  import { resolveInternalHref } from '$lib/utils.js';
  import verksLight from '$lib/assets/common/verks-logotype/verks--logo-light.svg';
  import verksDark from '$lib/assets/common/verks-logotype/verks--logo-dark.svg';

  let { sandbox = false, menuTrigger = 'hover' } = $props();
  let commandOpen = $state(false);
  let selected = $state('');
  const href = (path) => resolveInternalHref(`/docs/${path}/`);
  const brand = { label: 'Verks', href: `${href('brand')}#verks` };
  const developerLinks = [
    { label: 'Projects', href: './projects', active: true },
    { label: 'Repositories', href: './repositories/' },
    { label: 'Activity', href: './activity' }
  ];
  const mergeItems = [
    { label: 'Review requests', value: 'review', action: () => (selected = 'Demo: no merge requests awaiting your review.') },
    { label: 'Created by me', value: 'created', action: () => (selected = 'Demo: you have no open merge requests.') },
    { label: 'Recently merged', value: 'merged', action: () => (selected = 'Demo: no recently merged requests.') }
  ];
  const account = {
    fallback: 'JK',
    label: 'Jan Kowalski - account',
    items: [
      { label: 'Profile', value: 'profile', action: () => (selected = 'Profile selected') },
      { label: 'Workspace settings', value: 'settings', action: () => (selected = 'Workspace settings selected') },
      { label: 'Sign out', value: 'sign-out', action: () => (selected = 'Sign out selected'), variant: 'destructive' }
    ]
  };
  const commands = [{ label: 'Navigate', items: developerLinks.map((item) => ({ ...item, id: item.href })) }];
</script>

{#snippet logo()}
  <img class="verks-logo verks-logo--light" src={verksLight} alt="Verks" width="98" height="24" />
  <img class="verks-logo verks-logo--dark" src={verksDark} alt="Verks" width="98" height="24" />
{/snippet}

<div class="navbar-example">
  <AesirNavbar {brand} {logo} layout="full" align="start" items={developerLinks} {menuTrigger} avatar={account} searchHint={sandbox ? 'K' : undefined} onsearch={() => (commandOpen = true)}>
    {#snippet utilities()}
      <AesirDropdown items={mergeItems} label="Merge requests">
        {#snippet trigger(props)}
          <AesirButton variant="ghost" size="icon-sm" aria-label="Merge requests" {...props}><AesirIcon name="git-merge" size={18} /></AesirButton>
        {/snippet}
      </AesirDropdown>
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
