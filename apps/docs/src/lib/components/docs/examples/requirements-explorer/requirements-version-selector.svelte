<script>
  import { AesirButton, AesirDropdown, AesirIcon } from '@aesir/svelte';

  let { documentName = 'Requirements', versions = [], value = 'latest', onchange } = $props();
  const formatDate = (date) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
  const items = $derived([
    { value: 'latest', label: 'Latest', description: 'Current document', role: 'menuitemradio', checked: value === 'latest' },
    ...versions.map((version) => ({
      value: version.id,
      label: version.label,
      description: formatDate(version.date),
      role: 'menuitemradio',
      checked: value === version.id
    }))
  ]);
  const label = $derived(value === 'latest' ? 'Latest' : (versions.find((version) => version.id === value)?.label ?? value));
</script>

<AesirDropdown class="version-selector" label="Document versions" {items} contentStyle="min-width: 15rem; max-width: calc(100vw - var(--ds-spacing-6));" onselect={(item) => onchange?.(item.value)}>
  {#snippet trigger(props)}
    <AesirButton {...props} class="version-trigger" variant="ghost" size="sm" aria-current="page" aria-label={`${documentName}, document version: ${label}`} title={documentName}>
      <span class="version-trigger__title">{documentName}</span>
      {#if value !== 'latest'}<span class="version-trigger__version">{label}</span>{/if}
      <AesirIcon name="chevron-down" size={13} />
    </AesirButton>
  {/snippet}
  {#snippet itemContent({ item })}
    <span class="version-option">
      <span class="version-option__copy">
        <span>{item.label}</span>
        <small>{item.description}</small>
      </span>
      <span class="version-option__check">
        {#if item.checked}<AesirIcon name="check" size={14} />{/if}
      </span>
    </span>
  {/snippet}
</AesirDropdown>

<style>
  :global(.version-selector) {
    min-width: 0;
    max-width: 100%;
  }
  :global(.version-trigger) {
    height: var(--ds-spacing-8);
    min-width: 0;
    max-width: 100%;
    gap: var(--ds-spacing-1-5);
    padding-inline: var(--ds-spacing-2);
    color: var(--ds-foreground);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-regular);
    white-space: nowrap;
  }
  .version-trigger__title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .version-trigger__version {
    flex: none;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .version-option {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-spacing-4);
  }
  .version-option__copy {
    display: grid;
    gap: var(--ds-spacing-0-5);
    text-align: left;
  }
  .version-option__copy small {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .version-option__check {
    width: var(--ds-spacing-3-5);
    flex: none;
  }
</style>
