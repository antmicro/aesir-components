<script lang="ts">
  import NativeSelect from '../../src/components/aesir-native-select/aesir-native-select.svelte';

  const allOptions = [
    { value: 'eu', label: 'Europe' },
    { value: 'us', label: 'United States' }
  ];
  let options = $state(allOptions);
  let region = $state<string | number | undefined>();
  let regions = $state<(string | number)[]>([]);
</script>

<form aria-label="Dynamic native select form">
  <NativeSelect label="Region" name="region" {options} bind:value={region} />
  <NativeSelect label="Regions" name="regions" {options} multiple bind:values={regions} />
</form>
<button type="button" onclick={() => (options = [allOptions[1]])}>Remove Europe</button>
<button type="button" onclick={() => (options = allOptions)}>Restore Europe</button>
<output aria-label="Region value">{region ?? ''}</output>
<output aria-label="Regions values">{regions.join(',')}</output>
