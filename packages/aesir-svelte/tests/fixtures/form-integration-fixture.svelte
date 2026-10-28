<script>
  import { AesirCheckbox, AesirInput, AesirNativeSelect, AesirQuantityStepper, AesirRadio, AesirSwitch } from '../../src/index.js';

  let plan = $state('free');
  const regions = [
    { value: 'eu', label: 'Europe' },
    { value: 'us', label: 'United States' }
  ];
</script>

<form aria-label="Component form" onsubmit={(event) => event.preventDefault()}>
  <AesirInput name="project" label="Project" value="Aesir" />
  <AesirCheckbox name="updates" value="yes" label="Updates" />
  <AesirRadio name="plan" value="free" label="Free" bind:group={plan} />
  <AesirRadio name="plan" value="pro" label="Pro" bind:group={plan} />
  <AesirSwitch name="alerts" value="enabled" label="Alerts" />
  <AesirNativeSelect name="region" label="Region" value="eu" options={regions} />
  <AesirQuantityStepper name="seats" label="Seats" value={2} min={1} max={4} />
  <button type="reset">Reset form</button>
</form>
