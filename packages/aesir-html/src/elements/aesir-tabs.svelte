<svelte:options
  customElement={{
    tag: 'aesir-tabs',
    props: {
      border: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      loop: { type: 'Boolean', reflect: true },
      activationMode: { attribute: 'activation-mode' },
      orientation: { reflect: true }
    }
  }}
/>

<script>
  import { AesirTabs } from '@aesir/svelte/components/aesir-tabs';
  import { blockDisabledClick } from '../disabled-click.js';
  import { parseJson } from '../parse.js';

  let {
    items = [],
    value = $bindable(),
    size = 'default',
    variant = 'default',
    width = 'default',
    border = false,
    label = 'Tabs',
    activationMode = 'automatic',
    disabled = false,
    loop = true,
    orientation = 'horizontal'
  } = $props();
  blockDisabledClick($host(), () => disabled);
  const parsedItems = $derived(parseJson(items));
</script>

<AesirTabs items={parsedItems} bind:value {size} {variant} {width} {border} {label} {activationMode} {disabled} {loop} {orientation} />
