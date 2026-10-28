<svelte:options
  customElement={{
    tag: 'aesir-tag-input',
    props: {
      options: { type: 'Array' },
      value: { type: 'Array' },
      open: { type: 'Boolean' },
      disabled: { type: 'Boolean' },
      max: { type: 'Number' },
      maxHeight: { type: 'Number', attribute: 'max-height' },
      allowCustom: { type: 'Boolean', attribute: 'allow-custom' },
      closeOnSelect: { type: 'Boolean', attribute: 'close-on-select' }
    }
  }}
/>

<script>
  import { AesirTagInput } from '@aesir/svelte/components/aesir-tag-input';
  import { blockDisabledClick } from '../disabled-click.js';
  import { parseJson } from '../parse.js';
  let {
    options = [],
    value = $bindable([]),
    query = $bindable(''),
    open = $bindable(false),
    label,
    description,
    placeholder = 'Add…',
    emptyText = 'No results',
    disabled = false,
    max,
    maxHeight = 256,
    allowCustom = false,
    closeOnSelect = true
  } = $props();
  const host = $host();
  blockDisabledClick(host, () => disabled);
</script>

<AesirTagInput
  options={parseJson(options)}
  bind:value
  bind:query
  bind:open
  {label}
  {description}
  {placeholder}
  {emptyText}
  {disabled}
  {max}
  {maxHeight}
  {allowCustom}
  {closeOnSelect}
  onchange={(value) => host.dispatchEvent(new CustomEvent('change', { detail: { value }, bubbles: true, composed: true }))}
/>
