<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import AesirSegmentedField from './aesir-segmented-field.svelte';
  type Props = Omit<ComponentProps<typeof AesirSegmentedField>, 'kind'>;
  let { label, value = $bindable(''), ...props }: Props = $props();
</script>

<AesirSegmentedField kind="date" {label} bind:value {...props} />
