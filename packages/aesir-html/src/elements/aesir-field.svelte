<svelte:options
  customElement={{
    tag: 'aesir-field',
    props: {
      optional: { type: 'Boolean', reflect: true },
      required: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      reserveMessageSpace: { type: 'Boolean', reflect: true }
    }
  }}
/>

<script>
  import { onMount } from 'svelte';

  let { id, label, description, error, optional = false, required = false, disabled = false, reserveMessageSpace = false } = $props();
  const host = $host();
  // DOM bookkeeping for restoring each control, not reactive component state.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const disabledByField = new Map();
  const uid = $props.id();
  const controlId = $derived(id ?? `${uid}-control`);
  const messageId = $derived(`${uid}-${error ? 'error' : 'description'}`);

  const syncDisabled = () => {
    for (const control of host.querySelectorAll('*')) {
      if (!('disabled' in control)) continue;
      if (disabled) {
        if (!disabledByField.has(control)) disabledByField.set(control, control.disabled);
        if (!control.disabled) control.disabled = true;
      } else if (disabledByField.has(control)) {
        const original = disabledByField.get(control);
        if (control.disabled !== original) control.disabled = original;
        disabledByField.delete(control);
      }
    }
    for (const [control, original] of disabledByField) {
      if (host.contains(control)) continue;
      if (control.disabled !== original) control.disabled = original;
      disabledByField.delete(control);
    }
  };

  $effect(() => {
    disabled;
    syncDisabled();
  });

  onMount(() => {
    const observer = new MutationObserver(syncDisabled);
    observer.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
    return () => {
      observer.disconnect();
      for (const [control, original] of disabledByField) control.disabled = original;
      disabledByField.clear();
    };
  });
</script>

<div class="field" data-invalid={error ? true : undefined} data-disabled={disabled || undefined}>
  {#if label}<label for={controlId}>
      <span>
        {label}{#if optional}<small>(optional)</small>{/if}
      </span>
      {#if required}<em>Required</em>{/if}
    </label>{/if}
  <slot></slot>
  {#if error}<p id={messageId} class="error" aria-live="polite">{error}</p>{:else if description}<p id={messageId}>{description}</p>{:else if reserveMessageSpace}<p aria-hidden="true">&nbsp;</p>{/if}
</div>

<style>
  .field {
    display: grid;
    width: 100%;
    color: var(--ds-foreground);
  }
  label {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--ds-spacing-3);
    margin-bottom: var(--ds-spacing-1-5);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
  }
  small {
    margin-inline-start: var(--ds-spacing-1);
    color: var(--ds-foreground-muted);
    font-weight: var(--ds-font-weight-normal);
  }
  em {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xxs);
    font-style: normal;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  p {
    margin: 0;
    padding-top: var(--ds-spacing-1-5);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
  }
  .error {
    color: var(--ds-foreground-red);
  }
  [data-disabled] {
    opacity: 0.55;
  }
</style>
