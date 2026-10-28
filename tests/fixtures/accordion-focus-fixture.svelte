<script>
  import Accordion from '../../src/components/aesir-accordion/aesir-accordion.svelte';

  const defaultItems = [{ value: 'one', title: 'One' }];
  let { value, items = defaultItems } = $props();
</script>

{#snippet content({ item })}
  <button type="button">Action in {item.title}</button>
{/snippet}

<Accordion {items} {value} itemContent={content} />
