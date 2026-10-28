<script lang="ts">
  import type { Snippet } from 'svelte';
  import RequirementsTree from './requirements-tree.svelte';
  import RequirementsTreeLine from './requirements-tree-line.svelte';

  type TreeNode = {
    item: Record<string, unknown>;
    index: number;
    children: TreeNode[];
  };

  type RequirementsTreeProps = {
    nodes: TreeNode[];
    row: Snippet<[Record<string, unknown>, number, boolean]>;
    details?: Snippet<[Record<string, unknown>]>;
    collapsed?: string[];
    expanded?: boolean;
    sticky?: boolean;
    depth?: number;
  };

  let { nodes, row, details, collapsed = [], expanded = false, sticky = false, depth = 1 }: RequirementsTreeProps = $props();
  const stickyTop = $derived(`calc(var(--tree-row-height) * ${depth})`);
</script>

{#each nodes as node, index (String(node.item.id))}
  <div class="requirements-tree__branch">
    {#if expanded}
      <RequirementsTreeLine depth={depth - 1} last={index === nodes.length - 1} />
    {/if}
    <div class="requirements-tree__node" data-sticky={sticky && node.children.length > 0 ? true : undefined} style:--requirements-sticky-top={stickyTop} style:--requirements-sticky-z={20 - depth}>
      {@render row(node.item, node.index, node.children.length > 0)}
    </div>
    <div class="requirements-tree__details">
      {#if expanded && node.children.length > 0 && !collapsed.includes(String(node.item.id))}
        <RequirementsTreeLine {depth} />
      {/if}
      {@render details?.(node.item)}
    </div>
    {#if node.children.length && !collapsed.includes(String(node.item.id))}
      <RequirementsTree nodes={node.children} {row} {details} {collapsed} {expanded} {sticky} depth={depth + 1} />
    {/if}
  </div>
{/each}

<style>
  .requirements-tree__branch {
    position: relative;
    display: grid;
    min-width: 0;
    gap: 0;
  }

  .requirements-tree__node {
    position: relative;
    display: grid;
    min-width: 0;
    gap: 0;
  }
  .requirements-tree__details {
    position: relative;
  }

  .requirements-tree__node[data-sticky] {
    position: sticky;
    z-index: var(--requirements-sticky-z);
    top: var(--requirements-sticky-top);
    background: var(--ds-background-secondary);
  }
</style>
