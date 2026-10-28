<svelte:options
  customElement={{
    tag: 'aesir-autocomplete-box',
    props: {
      open: { type: 'Boolean', reflect: true },
      required: { type: 'Boolean' },
      disabled: { type: 'Boolean' },
      maxHeight: { type: 'Number', attribute: 'max-height' },
      errorPlacement: { attribute: 'error-placement' }
    }
  }}
/>

<script>
  import { AesirAutocompleteBox } from '@aesir/svelte/components/aesir-autocomplete-box';
  import { blockDisabledClick } from '../disabled-click.js';
  import { parseJson } from '../parse.js';
  let {
    options = [],
    value = $bindable(null),
    query = $bindable(''),
    open = $bindable(false),
    label,
    placeholder = 'Search…',
    disabled = false,
    required = false,
    error,
    errorPlacement = 'message',
    description,
    maxHeight = 256
  } = $props();
  const host = $host();
  blockDisabledClick(host, () => disabled);
  const parsed = $derived(parseJson(options));
</script>

<AesirAutocompleteBox
  options={parsed}
  bind:value
  bind:query
  bind:open
  {label}
  {placeholder}
  {disabled}
  {required}
  {error}
  {errorPlacement}
  {description}
  {maxHeight}
  onselect={(item) => host.dispatchEvent(new CustomEvent('select', { detail: item, bubbles: true, composed: true }))}
/>
