<svelte:options
  customElement={{
    tag: 'aesir-checkbox',
    props: {
      checked: { type: 'Boolean', reflect: true },
      indeterminate: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      readonly: { type: 'Boolean', reflect: true },
      required: { type: 'Boolean', reflect: true }
    }
  }}
/>

<script>
  import { AesirCheckbox } from '@aesir/svelte/components/aesir-checkbox';
  import { blockDisabledClick } from '../disabled-click.js';

  let { checked = $bindable(false), indeterminate = false, label, description, disabled = false, readonly = false, required = false, name, value, form } = $props();
  blockDisabledClick($host(), () => disabled);
</script>

<AesirCheckbox bind:checked {indeterminate} {label} {description} {disabled} {readonly} {required} {name} {value} {form} />
