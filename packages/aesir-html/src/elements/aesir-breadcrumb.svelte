<svelte:options customElement="aesir-breadcrumb" />

<script>
  import { AesirBreadcrumb } from '@aesir/svelte/components/aesir-breadcrumb';
  import { parseJson } from '../parse.js';

  let { items = [], label = 'Breadcrumb', separator = 'chevron-right' } = $props();
  const host = $host();
  const parsedItems = $derived.by(() => {
    const parsed = parseJson(items);
    if (!Array.isArray(parsed)) return parsed;
    return parsed.map((item) =>
      item?.dropdown && item.items
        ? {
            ...item,
            onselect: (selected) => host.dispatchEvent(new CustomEvent('select', { detail: { item: selected, breadcrumb: item }, bubbles: true, composed: true }))
          }
        : item
    );
  });
</script>

<AesirBreadcrumb items={parsedItems} {label} {separator} />
