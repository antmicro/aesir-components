<svelte:options
  customElement={{
    tag: 'aesir-native-select',
    props: {
      disabled: { type: 'Boolean', reflect: true },
      optional: { type: 'Boolean', reflect: true },
      required: { type: 'Boolean', reflect: true }
    }
  }}
/>

<script>
  import { AesirNativeSelect } from '@aesir/svelte/components/aesir-native-select';
  import { blockDisabledClick } from '../disabled-click.js';
  import { parseJson } from '../parse.js';

  let { value = $bindable(), options = [], label, description, placeholder, disabled = false, optional = false, required = false, name } = $props();
  blockDisabledClick($host(), () => disabled);
  const parsedOptions = $derived(parseJson(options));
</script>

<AesirNativeSelect bind:value options={parsedOptions} {label} {description} {placeholder} {disabled} {optional} {required} {name} />
