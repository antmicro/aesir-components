<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import AesirSegmentedRangeField from './aesir-segmented-range-field.svelte';
  type Props = Omit<ComponentProps<typeof AesirSegmentedRangeField>, 'kind'>;
  let { label, value = $bindable({ start: '', end: '' }), ...props }: Props = $props();
</script>

<AesirSegmentedRangeField kind="time" {label} bind:value {...props} />
