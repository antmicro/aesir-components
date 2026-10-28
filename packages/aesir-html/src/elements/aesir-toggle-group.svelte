<svelte:options customElement={{ tag: 'aesir-toggle-group', props: { disabled: { type: 'Boolean', reflect: true } } }} />

<script>
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { blockDisabledClick } from '../disabled-click.js';
  let { type = 'single', value = $bindable(''), orientation = 'horizontal', spacing = '2', variant = 'default', size = 'default', disabled = false, label = 'Toggle group' } = $props();
  const host = $host();
  blockDisabledClick(host, () => disabled);
  let root;
  let mounted = $state(false);
  // DOM bookkeeping for restoring each toggle, not reactive component state.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const disabledByGroup = new Map();

  const values = () =>
    type === 'multiple'
      ? String(value || '')
          .split(',')
          .filter(Boolean)
      : [String(value || '')];
  const sync = () => {
    for (const item of host.querySelectorAll('aesir-toggle[value]')) {
      if (item.variant !== variant) item.variant = variant;
      if (item.size !== size) item.size = size;
      if (disabled) {
        if (!disabledByGroup.has(item)) disabledByGroup.set(item, item.disabled);
        if (!item.hasAttribute('disabled')) item.setAttribute('disabled', '');
      } else if (disabledByGroup.has(item)) {
        const original = disabledByGroup.get(item);
        if (item.hasAttribute('disabled') !== original) item.toggleAttribute('disabled', original);
        disabledByGroup.delete(item);
      }
      const pressed = values().includes(item.getAttribute('value'));
      if (item.pressed !== pressed) item.pressed = pressed;
    }
    for (const [item, original] of disabledByGroup) {
      if (host.contains(item)) continue;
      if (item.hasAttribute('disabled') !== original) item.toggleAttribute('disabled', original);
      disabledByGroup.delete(item);
    }
  };

  $effect(() => {
    value;
    variant;
    size;
    disabled;
    if (mounted) sync();
  });

  const onChange = (event) => {
    if (disabled) return;
    const item = event.target.closest?.('aesir-toggle[value]');
    if (!item || !host.contains(item)) return;
    const itemValue = item.getAttribute('value');
    if (type === 'multiple') {
      const next = new SvelteSet(values());
      event.detail.pressed ? next.add(itemValue) : next.delete(itemValue);
      value = [...next].join(',');
    } else value = event.detail.pressed ? itemValue : '';
    host.dispatchEvent(new CustomEvent('value-change', { detail: { value }, bubbles: true, composed: true }));
    sync();
  };

  onMount(() => {
    host.addEventListener('pressed-change', onChange);
    const observer = new MutationObserver(() => {
      if (!mounted || !host.isConnected) return;
      sync();
      if (disabled) {
        for (const item of host.querySelectorAll('aesir-toggle[value]')) {
          if (!item.disabled) item.disabled = true;
        }
      }
    });
    observer.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
    const timer = setTimeout(() => (mounted = true), 0);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      host.removeEventListener('pressed-change', onChange);
      for (const [item, original] of disabledByGroup) {
        if (item.hasAttribute('disabled') !== original) item.toggleAttribute('disabled', original);
      }
      disabledByGroup.clear();
    };
  });
</script>

<div bind:this={root} class="aesir-toggle-group" data-orientation={orientation} data-spacing={spacing} role="group" aria-label={label}>
  <slot onslotchange={sync}></slot>
</div>

<style>
  :host {
    display: inline-block;
  }
  .aesir-toggle-group {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-spacing-2);
  }
  .aesir-toggle-group[data-spacing='0'] {
    gap: 0;
  }
  .aesir-toggle-group[data-orientation='vertical'] {
    flex-direction: column;
    align-items: stretch;
  }
  :global(::slotted(aesir-toggle)) {
    position: relative;
    display: inline-block;
  }
  :global(::slotted(aesir-toggle[pressed])),
  :global(::slotted(aesir-toggle:focus-within)) {
    z-index: 1;
  }
  :global(::slotted(aesir-toggle:not(:first-child))) {
    margin-inline-start: calc(var(--ds-spacing-px) * -1);
  }
</style>
