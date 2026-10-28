<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { getContext } from 'svelte';
  import { AesirToggle } from '../aesir-toggle/index.js';
  import { AESIR_TOGGLE_GROUP_CONTEXT } from './context.js';
  import type { ToggleGroupContext, ToggleGroupValue } from './types.js';

  type ToggleGroupItemProps = Omit<ComponentProps<typeof AesirToggle>, 'controlled' | 'onpressedchange' | 'pressed' | 'tabindex'> & {
    value: ToggleGroupValue;
  };

  let { value, variant, size, disabled = false, onclick, onfocus, children, ...restProps }: ToggleGroupItemProps = $props();
  const group = getContext<ToggleGroupContext>(AESIR_TOGGLE_GROUP_CONTEXT);
  const pressed = $derived(group.isPressed(value));
  let buttonRef = $state<HTMLButtonElement>();

  $effect(() => {
    if (!buttonRef || disabled || group.disabled) return;
    return group.registerItem(buttonRef, value);
  });
</script>

<AesirToggle
  bind:ref={buttonRef}
  {pressed}
  variant={variant ?? group.variant}
  size={size ?? group.size}
  disabled={disabled || group.disabled}
  data-slot="aesir-toggle-group-item"
  data-value={value}
  onpressedchange={() => group.updateValue(value)}
  {onclick}
  {...restProps}
  controlled
  tabindex={disabled || group.disabled || group.tabStop !== buttonRef ? -1 : 0}
  onfocus={(event) => {
    group.focusItem(event.currentTarget);
    onfocus?.(event);
  }}
>
  {@render children?.()}
</AesirToggle>
