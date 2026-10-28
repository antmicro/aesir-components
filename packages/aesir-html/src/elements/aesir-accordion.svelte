<svelte:options
  customElement={{
    tag: 'aesir-accordion',
    props: {
      collapsible: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      loop: { type: 'Boolean', reflect: true },
      headingLevel: { attribute: 'heading-level', type: 'Number', reflect: true }
    }
  }}
/>

<script>
  import { AesirAccordion } from '@aesir/svelte/components/aesir-accordion';
  import { blockDisabledClick } from '../disabled-click.js';
  import { parseJson } from '../parse.js';

  let { items = [], type = 'single', value = $bindable(), collapsible = true, disabled = false, loop = true, headingLevel = 3, indicator = 'chevron' } = $props();
  blockDisabledClick($host(), () => disabled);
  const parsedItems = $derived(parseJson(items));
</script>

<AesirAccordion items={parsedItems} {type} bind:value {collapsible} {disabled} {loop} {headingLevel} {indicator} />
