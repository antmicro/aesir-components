<script lang="ts">
  import { AesirSelect } from '../../src/index.js';
  let region = $state('pl');
  let visible = $state(['pl']);
  let options = $state([
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
        { value: 'ca', label: 'Canada', disabled: true }
      ]
    }
  ]);
  const updateOptions = () =>
    (options = [
      { label: 'Americas', options: [{ value: 'us', label: 'United States' }] },
      { label: 'Europe', options: [{ value: 'de', label: 'Germany' }] }
    ]);
  const disablePoland = () =>
    (options = options.map((group) => ({
      ...group,
      options: group.options.map((option) => (option.value === 'pl' ? { ...option, disabled: true } : option))
    })));
  const enablePoland = () =>
    (options = options.map((group) => ({
      ...group,
      options: group.options.map((option) => (option.value === 'pl' ? { ...option, disabled: false } : option))
    })));
</script>

<form aria-label="Select form">
  <AesirSelect label="Region" name="region" {options} bind:value={region} required />
  <AesirSelect label="Visible regions" name="visible" {options} multiple bind:values={visible} />
  <AesirSelect label="No regions available" options={[]} />
  <button type="reset">Reset</button>
  <button type="button" onclick={updateOptions}>Update options</button>
  <button type="button" onclick={disablePoland}>Disable Poland</button>
  <button type="button" onclick={enablePoland}>Enable Poland</button>
  <button type="submit">Submit</button>
</form>

<div style="position: fixed; right: 0; bottom: 0; width: 96px;">
  <AesirSelect label="Edge region" {options} />
</div>
