<script>
  import { AesirButton, AesirIcon, AesirInput } from '@aesir/svelte';

  let project = $state('Aesir');
  let repository = $state('not-a-url');
  let replicas = $state(3);
  let query = $state('');

  const isHttpsUrl = (value) => {
    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  };

  const repositoryError = $derived(repository && !isHttpsUrl(repository) ? 'Enter a valid HTTPS URL.' : '');
</script>

<div class="input-example">
  <AesirInput bind:value={project} label="Project name" description="Used in navigation and notifications." placeholder="My project" />
  <AesirInput bind:value={repository} type="url" label="Repository URL" error={repositoryError} placeholder="https://example.com" />
  <AesirInput bind:value={query} type="search" label="Search" placeholder="Search components…">
    {#snippet leading()}<AesirIcon name="Search" />{/snippet}
    {#snippet trailing()}
      {#if query}
        <AesirButton variant="ghost" size="icon-sm" aria-label="Clear search" onclick={() => (query = '')}>
          <AesirIcon name="X" />
        </AesirButton>
      {/if}
    {/snippet}
  </AesirInput>
  <AesirInput bind:value={replicas} type="number" label="Replicas" description="Use the minus and plus buttons or the arrow keys." min="1" max="10" step="1" />
  <AesirInput label="Suite" optional placeholder="Apartment or unit" />
  <AesirInput label="Read only" value="production" disabled />
</div>

<style>
  .input-example {
    display: grid;
    width: min(100%, var(--ds-sizing-md));
    gap: var(--ds-spacing-4);
  }
</style>
