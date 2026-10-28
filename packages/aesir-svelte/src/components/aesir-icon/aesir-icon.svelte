<script lang="ts">
  import type { Component, ComponentProps, Snippet } from 'svelte';
  import type { SVGAttributes } from 'svelte/elements';
  import type { IconNode as LucideIconNode, LucideProps } from '@lucide/svelte';
  import { resolveIcon } from '../../icons/registry.js';
  import IconNode from './icon-node.svelte';

  type IconProps = Omit<SVGAttributes<SVGSVGElement>, 'children' | 'name'> & {
    icon?: Component<LucideProps> | LucideIconNode;
    name?: string;
    label?: string;
    children?: Snippet;
    mirrored?: boolean;
    color?: string;
    size?: number | string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
  };

  let { icon = undefined, name = undefined, label = undefined, children = undefined, ...restProps }: IconProps = $props();
  const resolvedIcon = $derived(icon ?? resolveIcon(name));
  const isIconNode = $derived(Array.isArray(resolvedIcon));
  let color = $derived(restProps.color ?? 'currentColor');
  let size = $derived(restProps.size ?? '1em');
  let mirrored = $derived(restProps.mirrored ?? false);
  const hasAccessibleName = $derived(Boolean(label || restProps['aria-label'] || restProps['aria-labelledby']));
  const accessibilityProps = $derived({
    'aria-hidden': restProps['aria-hidden'] ?? (hasAccessibleName ? undefined : 'true'),
    'aria-label': label ?? restProps['aria-label'],
    role: restProps.role ?? (hasAccessibleName ? 'img' : undefined)
  } satisfies SVGAttributes<SVGSVGElement>);

  function svgAttr(obj: SVGAttributes<SVGSVGElement> & { mirrored?: boolean; weight?: string; size?: number | string }) {
    let attrs = { ...obj };
    delete attrs.weight;
    delete attrs.color;
    delete attrs.size;
    delete attrs.mirrored;
    return attrs;
  }

  const iconNodeProps = $derived({
    ...svgAttr(restProps),
    ...accessibilityProps,
    name,
    iconNode: resolvedIcon,
    color,
    size,
    mirrored
  } as ComponentProps<typeof IconNode>);
</script>

{#if isIconNode}
  <IconNode {...iconNodeProps}>
    {@render children?.()}
  </IconNode>
{:else}
  {@const Icon = resolvedIcon}
  <Icon {...svgAttr(restProps)} {...accessibilityProps} {color} {size} {mirrored}>
    {@render children?.()}
  </Icon>
{/if}
