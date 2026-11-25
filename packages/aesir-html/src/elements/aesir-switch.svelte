<svelte:options
  customElement={{
    tag: 'aesir-switch',
    props: {
      checked: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      readonly: { type: 'Boolean', reflect: true },
      required: { type: 'Boolean', reflect: true }
    }
  }}
/>

<script>
  import { AesirSwitch } from '@aesir/svelte/components/aesir-switch';
  import { blockDisabledClick } from '../disabled-click.js';

  let { checked = $bindable(false), label, description, disabled = false, readonly = false, required = false, name, value, form } = $props();
  const host = $host();
  blockDisabledClick(host, () => disabled);
</script>

<AesirSwitch
  bind:checked
  oncheckedchange={(checked) => host.dispatchEvent(new CustomEvent('checkedchange', { detail: { checked }, bubbles: true, composed: true }))}
  {label}
  {description}
  {disabled}
  {readonly}
  {required}
  {name}
  {value}
  {form}
/>
