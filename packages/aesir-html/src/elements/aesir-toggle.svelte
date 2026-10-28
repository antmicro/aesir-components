<svelte:options
  customElement={{
    tag: 'aesir-toggle',
    props: {
      pressed: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true }
    }
  }}
/>

<script>
  import { AesirToggle } from '@aesir/svelte/components/aesir-toggle';
  import { blockDisabledClick } from '../disabled-click.js';
  let { pressed = $bindable(false), variant = 'default', size = 'default', disabled = false } = $props();
  const host = $host();
  blockDisabledClick(host, () => disabled);
</script>

<AesirToggle bind:pressed {variant} {size} {disabled} onpressedchange={(value) => host.dispatchEvent(new CustomEvent('pressed-change', { detail: { pressed: value }, bubbles: true, composed: true }))}>
  <slot></slot>
</AesirToggle>
