<svelte:options
  customElement={{
    tag: 'aesir-pagination',
    props: {
      page: { type: 'Number', reflect: true },
      totalPages: { type: 'Number', attribute: 'total-pages', reflect: true },
      siblingCount: { type: 'Number', attribute: 'sibling-count', reflect: true },
      disabled: { type: 'Boolean', reflect: true }
    }
  }}
/>

<script>
  import { AesirPagination } from '@aesir/svelte/components/aesir-pagination';
  import { blockDisabledClick } from '../disabled-click.js';
  let { page = $bindable(1), totalPages = 1, siblingCount = 1, disabled = false, label = 'Pagination' } = $props();
  const host = $host();
  blockDisabledClick(host, () => disabled);
  const change = (next) => host.dispatchEvent(new CustomEvent('pagechange', { detail: { page: next }, bubbles: true, composed: true }));
</script>

<AesirPagination bind:page {totalPages} {siblingCount} {disabled} {label} onpagechange={change} />
