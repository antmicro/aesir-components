<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { SVGAttributes } from 'svelte/elements';

  type IconNodeProps = Omit<SVGAttributes<SVGSVGElement>, 'children' | 'name'> & {
    name?: string;
    iconNode?: Array<[keyof SVGElementTagNameMap, Record<string, string | number>]>;
    color?: string;
    size?: string | number;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
    mirrored?: boolean;
    children?: Snippet;
  };

  let { name = undefined, iconNode = [], color = 'currentColor', size = 24, strokeWidth = 2, absoluteStrokeWidth = false, children = undefined, ...restProps }: IconNodeProps = $props();
  const resolvedStrokeWidth = $derived(absoluteStrokeWidth ? (Number(strokeWidth) * 24) / Number(size) : strokeWidth);
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke={color}
  stroke-width={resolvedStrokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  data-lucide={name}
  {...restProps}
>
  {#each iconNode as [tag, attributes], index (`${tag}-${index}`)}
    <svelte:element this={tag} {...attributes} />
  {/each}
  {@render children?.()}
</svg>
