<script>
  import { AesirNativeSelect } from '@aesir/svelte';

  const regions = [
    {
      label: 'Europe',
      options: [
        { label: 'Poland', value: 'pl' },
        { label: 'Germany', value: 'de' }
      ]
    },
    { label: 'Americas', options: [{ label: 'United States', value: 'us' }] },
    { label: 'Asia Pacific', value: 'apac' }
  ];

  let region = $state('pl');
  let visibleRegions = $state(['pl', 'us']);
</script>

<div class="native-select-example">
  <AesirNativeSelect bind:value={region} options={regions} label="Deployment region" description="Choose the region closest to your users." />
  <AesirNativeSelect multiple bind:values={visibleRegions} options={regions} label="Visible regions" description="Use Command or Control to select several regions." />
</div>

<style>
  .native-select-example {
    display: grid;
    gap: var(--ds-spacing-4);
    width: min(100%, var(--ds-sizing-sm));
  }
</style>
