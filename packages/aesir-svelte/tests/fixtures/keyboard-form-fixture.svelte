<script lang="ts">
  import { AesirAutocompleteBox, AesirButton, AesirCheckbox, AesirDropdown, AesirInput, AesirNativeSelect, AesirRadio, AesirSwitch } from '../../src/index.js';

  let plan = $state('free');
  let action = $state('none');
  let submitted = $state(0);
  const regions = [
    { value: 'eu', label: 'Europe' },
    { value: 'us', label: 'United States' }
  ];
  const actions = [
    { label: 'Save draft', value: 'draft' },
    { label: 'Publish', value: 'publish' }
  ];
  const cities = [
    { label: 'Warsaw', value: 'waw' },
    { label: 'Prague', value: 'prg' }
  ];
</script>

<form
  aria-label="Keyboard workflow"
  onsubmit={(event) => {
    event.preventDefault();
    submitted += 1;
  }}
>
  <AesirInput name="project" label="Project" value="Aesir" />
  <AesirCheckbox name="updates" value="yes" label="Updates" />
  <AesirCheckbox name="locked" label="Locked" disabled />
  <AesirRadio name="plan" value="free" label="Free" bind:group={plan} />
  <AesirRadio name="plan" value="pro" label="Pro" bind:group={plan} />
  <AesirSwitch name="alerts" value="enabled" label="Alerts" />
  <AesirNativeSelect name="region" label="Region" value="eu" options={regions} />
  <AesirDropdown items={actions} label="Workflow actions" onselect={(item) => (action = item.value ?? 'none')}>
    {#snippet trigger(props)}<AesirButton {...props}>Actions</AesirButton>{/snippet}
  </AesirDropdown>
  <AesirAutocompleteBox label="City" options={cities} />
  <AesirButton type="submit">Submit workflow</AesirButton>
</form>

<output aria-label="Selected action">{action}</output>
<output aria-label="Submit count">{submitted}</output>
