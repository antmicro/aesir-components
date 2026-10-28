<script lang="ts">
  import type { Snippet } from 'svelte';
  import { portal } from '../overlay/overlay.js';

  let { to, disabled = false, children }: { to?: string | Element | DocumentFragment; disabled?: boolean; children?: Snippet } = $props();
</script>

<div class="aesir-portal" style="display: contents" use:portal={{ to, disabled }}>
  {@render children?.()}
</div>
