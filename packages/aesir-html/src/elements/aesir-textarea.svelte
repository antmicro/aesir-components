<svelte:options
  customElement={{
    tag: 'aesir-textarea',
    props: {
      disabled: { type: 'Boolean', reflect: true },
      optional: { type: 'Boolean', reflect: true },
      required: { type: 'Boolean', reflect: true },
      reserveMessageSpace: { type: 'Boolean', reflect: true },
      showCount: { type: 'Boolean', reflect: true }
    }
  }}
/>

<script>
  import { AesirTextarea } from '@aesir/svelte/components/aesir-textarea';
  import { blockDisabledClick } from '../disabled-click.js';
  let {
    value = $bindable(''),
    id,
    label,
    description,
    error,
    errorPlacement = 'message',
    size = 'default',
    disabled = false,
    optional = false,
    required = false,
    reserveMessageSpace = false,
    resize = 'vertical',
    rows = 4,
    maxlength,
    showCount = false,
    name,
    placeholder,
    autocomplete
  } = $props();
  blockDisabledClick($host(), () => disabled);
</script>

<AesirTextarea
  bind:value
  {id}
  {label}
  {description}
  {error}
  {errorPlacement}
  {size}
  {disabled}
  {optional}
  {required}
  {reserveMessageSpace}
  {resize}
  {rows}
  {maxlength}
  {showCount}
  {name}
  {placeholder}
  {autocomplete}
/>
