<svelte:options
  customElement={{
    tag: 'aesir-button',
    props: {
      disabled: { type: 'Boolean', reflect: true },
      width: { reflect: true }
    }
  }}
/>

<script>
  import { onMount } from 'svelte';
  import { AesirButton } from '@aesir/svelte/components/aesir-button';
  import { blockDisabledClick } from '../disabled-click.js';

  let { variant = 'default', size = 'default', width = 'default', radius, href, type = 'button', disabled = false } = $props();
  const host = $host();
  blockDisabledClick(host, () => disabled);
  let groupPosition = $state();
  let groupOrientation = $state();

  const updateGroupPosition = () => {
    const group = host.parentElement?.closest('aesir-button-group');
    if (!group || host.parentElement !== group) {
      groupPosition = undefined;
      groupOrientation = undefined;
      return;
    }

    const items = [...group.children].filter((element) => element.localName === 'aesir-button' || element.matches("[data-slot='button-group-text']"));
    const index = items.indexOf(host);
    groupPosition = items.length === 1 ? 'only' : index === 0 ? 'first' : index === items.length - 1 ? 'last' : 'middle';
    groupOrientation = group.getAttribute('orientation') === 'vertical' ? 'vertical' : 'horizontal';
  };

  onMount(() => {
    updateGroupPosition();
    const group = host.parentElement?.closest('aesir-button-group');
    if (!group) return;

    const observer = new MutationObserver(updateGroupPosition);
    observer.observe(group, { attributes: true, attributeFilter: ['orientation'], childList: true });
    return () => observer.disconnect();
  });
</script>

<AesirButton {variant} {size} {width} {radius} {href} {type} {disabled} data-group-position={groupPosition} data-group-orientation={groupOrientation}>
  <slot></slot>
</AesirButton>

<style>
  :host {
    min-width: 0;
    justify-self: start;
  }

  :host([width='full']) {
    display: block;
    width: 100%;
    justify-self: stretch;
    --aesir-button-width: 100%;
  }

  :global(.aesir-button) {
    width: var(--aesir-button-width, auto);
    max-width: 100%;
  }

  :global(.aesir-button[data-group-orientation='horizontal'][data-group-position='first']) {
    border-start-end-radius: 0;
    border-end-end-radius: 0;
  }

  :global(.aesir-button[data-group-orientation='horizontal'][data-group-position='middle']) {
    margin-inline-start: calc(var(--ds-spacing-px) * -1);
    border-radius: 0;
  }

  :global(.aesir-button[data-group-orientation='horizontal'][data-group-position='last']) {
    margin-inline-start: calc(var(--ds-spacing-px) * -1);
    border-start-start-radius: 0;
    border-end-start-radius: 0;
  }

  :global(.aesir-button[data-group-orientation='vertical'][data-group-position='first']) {
    border-end-start-radius: 0;
    border-end-end-radius: 0;
  }

  :global(.aesir-button[data-group-orientation='vertical'][data-group-position='middle']) {
    margin-block-start: calc(var(--ds-spacing-px) * -1);
    border-radius: 0;
  }

  :global(.aesir-button[data-group-orientation='vertical'][data-group-position='last']) {
    margin-block-start: calc(var(--ds-spacing-px) * -1);
    border-start-start-radius: 0;
    border-start-end-radius: 0;
  }
</style>
