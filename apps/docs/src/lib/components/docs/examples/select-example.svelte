<script lang="ts">
  import { AesirSelect } from '@aesir/svelte';
  let region = $state('pl');
  let visible = $state(['pl']);
  const regions = [
    {
      label: 'Europe',
      options: [
        { value: 'pl', label: 'Poland' },
        { value: 'de', label: 'Germany' }
      ]
    },
    {
      label: 'Americas',
      options: [
        { value: 'us', label: 'United States' },
        { value: 'ca', label: 'Canada' }
      ]
    }
  ];
</script>

<div style="display: grid; gap: 1rem; max-width: 20rem">
  <AesirSelect label="Region" name="region" options={regions} bind:value={region} required />
  <AesirSelect label="Visible regions" name="visible" options={regions} multiple bind:values={visible} />
</div>
