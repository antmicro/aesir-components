<svelte:options
  customElement={{
    tag: 'aesir-tooltip',
    props: {
      offset: { type: 'Number' },
      delay: { type: 'Number' },
      disabled: { type: 'Boolean' }
    }
  }}
/>

<script>
  import { AesirTooltip } from '@aesir/svelte/components/aesir-tooltip';
  import { getFocusableElements } from '@aesir/svelte/utilities/overlay';

  let { content, placement = 'top', offset = 8, delay = 250, disabled = false } = $props();
  const host = $host();
  const uid = $props.id();
  const descriptionId = `${uid}-description`;

  // ID references cannot cross shadow roots. Keep the description beside the
  // actual control, including controls inside another Custom Element.
  const describeTrigger = (node, text) => {
    const description = node.ownerDocument.createElement('span');
    description.id = descriptionId;
    description.hidden = true;
    description.slot = 'aesir-tooltip-description';
    let target;
    const detach = () => {
      if (!target) return;
      const ids = (target.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((id) => id && id !== descriptionId);
      if (ids.length) target.setAttribute('aria-describedby', ids.join(' '));
      else target.removeAttribute('aria-describedby');
      description.remove();
    };
    const connect = () => {
      detach();
      if (text == null) return;
      target = getFocusableElements(host)[0];
      if (!target) return;
      const root = target.getRootNode();
      (root === host.ownerDocument ? host : root).appendChild(description);
      target.setAttribute('aria-describedby', [target.getAttribute('aria-describedby'), descriptionId].filter(Boolean).join(' '));
    };
    description.textContent = text ?? '';
    node.addEventListener('slotchange', connect);
    node.addEventListener('focusin', connect, true);
    node.addEventListener('mouseenter', connect);
    connect();
    return {
      update(next) {
        description.textContent = next ?? '';
        text = next;
        connect();
      },
      destroy() {
        node.removeEventListener('slotchange', connect);
        node.removeEventListener('focusin', connect, true);
        node.removeEventListener('mouseenter', connect);
        detach();
      }
    };
  };
</script>

<AesirTooltip {content} {placement} {offset} {delay} {disabled}>
  {#snippet trigger(props)}
    <!-- The slotted control owns focus and keyboard activation; this wrapper delegates its events. -->
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <span
      use:describeTrigger={disabled ? undefined : content}
      onmouseenter={props.onmouseenter}
      onmouseleave={props.onmouseleave}
      onpointerdown={props.onpointerdown}
      onclick={props.onclick}
      onfocusin={props.onfocus}
      onfocusout={props.onblur}
    >
      <slot></slot>
    </span>
  {/snippet}
</AesirTooltip>
