<svelte:options
  customElement={{
    tag: 'aesir-radio',
    props: {
      disabled: { type: 'Boolean', reflect: true },
      readonly: { type: 'Boolean', reflect: true },
      required: { type: 'Boolean', reflect: true }
    }
  }}
/>

<script>
  import { onMount } from 'svelte';
  import { AesirRadio } from '@aesir/svelte/components/aesir-radio';
  import { blockDisabledClick } from '../disabled-click.js';

  let { group = $bindable(), value, label, description, disabled = false, readonly = false, required = false, name, form } = $props();
  const host = $host();
  blockDisabledClick(host, () => disabled);
  let scope;

  const groupKey = () => name ?? '__default';
  const updateFromGroup = (event) => {
    if (event.detail?.name === groupKey()) group = event.detail.value;
  };
  const selectRadio = (event) => {
    event.stopPropagation();
    if (readonly) return;
    group = value;
    scope?.dispatchEvent(
      new CustomEvent('aesir-radio-group-change', {
        detail: { name: groupKey(), value }
      })
    );
    host.dispatchEvent(
      new CustomEvent('change', {
        detail: { name, value },
        bubbles: true,
        composed: true
      })
    );
  };

  onMount(() => {
    scope = host.closest('[role="radiogroup"], [data-aesir-radio-group]') ?? host.parentElement;
    scope?.addEventListener('aesir-radio-group-change', updateFromGroup);
    if (group === value) {
      queueMicrotask(() => {
        scope?.dispatchEvent(new CustomEvent('aesir-radio-group-change', { detail: { name: groupKey(), value } }));
      });
    }
    return () => scope?.removeEventListener('aesir-radio-group-change', updateFromGroup);
  });
</script>

<AesirRadio bind:group {value} {label} {description} {disabled} {readonly} {required} {name} {form} onclick={selectRadio} />
