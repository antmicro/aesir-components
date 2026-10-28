<svelte:options
  customElement={{
    tag: 'aesir-input',
    props: {
      disabled: { type: 'Boolean', reflect: true },
      optional: { type: 'Boolean', reflect: true },
      required: { type: 'Boolean', reflect: true },
      reserveMessageSpace: { type: 'Boolean', reflect: true }
    }
  }}
/>

<script>
  import { onMount } from 'svelte';
  import { AesirInput } from '@aesir/svelte/components/aesir-input';
  import { blockDisabledClick } from '../disabled-click.js';

  let {
    value = $bindable(''),
    id,
    label,
    description,
    error,
    errorPlacement = 'message',
    type = 'text',
    size = 'default',
    disabled = false,
    optional = false,
    required = false,
    reserveMessageSpace = false,
    name,
    placeholder,
    autocomplete,
    min,
    max,
    step
  } = $props();
  const host = $host();
  blockDisabledClick(host, () => disabled);
  let hasLeading = $state(false);
  let hasTrailing = $state(false);

  const updateSlots = () => {
    hasLeading = Boolean(host.querySelector('[slot="leading"]'));
    hasTrailing = Boolean(host.querySelector('[slot="trailing"]'));
  };

  onMount(() => {
    updateSlots();
    const observer = new MutationObserver(updateSlots);
    observer.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['slot'] });
    return () => observer.disconnect();
  });
</script>

<AesirInput
  bind:value
  {id}
  {label}
  {description}
  {error}
  {errorPlacement}
  {type}
  {size}
  {disabled}
  {optional}
  {required}
  {reserveMessageSpace}
  {name}
  {placeholder}
  {autocomplete}
  {min}
  {max}
  {step}
  leadingVisible={hasLeading}
  trailingVisible={hasTrailing}
>
  {#snippet leading()}<slot name="leading"></slot>{/snippet}
  {#snippet trailing()}<slot name="trailing"></slot>{/snippet}
</AesirInput>
