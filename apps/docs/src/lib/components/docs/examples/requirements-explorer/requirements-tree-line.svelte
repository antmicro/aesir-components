<script lang="ts">
  let { depth = 0, last = false }: { depth?: number; last?: boolean } = $props();
</script>

<span class="tree-line" data-last={last || undefined} style:--line-depth={depth} aria-hidden="true"></span>

<style>
  .tree-line {
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(var(--tree-axis) + var(--line-depth) * var(--ds-spacing-6));
    width: var(--ds-spacing-px);
    background: var(--ds-border);
    pointer-events: none;
    z-index: 1;
  }
  .tree-line[data-last] {
    bottom: auto;
    height: calc(var(--tree-row-height) / 2);
  }
</style>
