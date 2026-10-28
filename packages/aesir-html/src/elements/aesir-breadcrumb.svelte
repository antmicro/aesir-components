<svelte:options customElement="aesir-breadcrumb" />

<script>
  import { AesirBreadcrumb } from '@aesir/svelte/components/aesir-breadcrumb';
  import { parseJson } from '../parse.js';

  let { items = [], label = 'Breadcrumb', separator = 'chevron-right' } = $props();
  const parsedItems = $derived(parseJson(items));
</script>

<AesirBreadcrumb items={parsedItems} {label} {separator} />
