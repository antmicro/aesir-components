<script lang="ts">
  import { AesirAutocompleteBox, AesirDateField, AesirDateRangeField, AesirHoverCard, AesirNativeSelect, AesirSegmentedField, AesirTimeField, AesirTimeRangeField } from '../../src/index.js';
  let date = $state('2026-10-03');
  let time = $state('09:30');
  let city = $state<string | number | null>(null);
</script>

<form aria-label="Advanced controls">
  <AesirNativeSelect
    label="Region"
    name="region"
    options={[
      {
        label: 'Europe',
        options: [
          { label: 'Poland', value: 'pl' },
          { label: 'Germany', value: 'de' }
        ]
      },
      { label: 'Americas', options: [{ label: 'United States', value: 'us' }] }
    ]}
  />
  <AesirNativeSelect
    label="Visible regions"
    name="visibleRegions"
    multiple
    values={['pl', 'us']}
    options={[
      {
        label: 'Europe',
        options: [
          { label: 'Poland', value: 'pl' },
          { label: 'Germany', value: 'de' }
        ]
      },
      { label: 'Americas', options: [{ label: 'United States', value: 'us' }] }
    ]}
  />
  <AesirAutocompleteBox label="City" name="city" bind:value={city} maxResults={2} options={['Warsaw', 'Prague', 'Paris']} />
  <AesirAutocompleteBox
    label="Grouped city"
    loop
    options={[
      { label: 'Europe', options: ['Warsaw', 'Prague'] },
      { label: 'Americas', options: [{ label: 'New York', value: 'nyc', disabled: true }, 'Boston'] }
    ]}
  />
  <AesirAutocompleteBox label="Repository" name="repository" required allowCustomValue={false} options={['Core', 'Docs']} />
  <AesirDateField label="Due date" name="due" bind:value={date} />
  <AesirDateField label="Localized date" name="localized" locale="pl-PL" value="2026-10-03" min="2026-10-03" />
  <AesirTimeField label="Start time" name="start" bind:value={time} />
  <AesirSegmentedField kind="time" label="Review time" name="review" value="12:00" />
  <AesirDateRangeField label="Date interval" name="dates" locale="pl-PL" min="2026-10-01" max="2026-10-31" value={{ start: '2026-10-03', end: '2026-10-05' }} />
  <AesirTimeRangeField label="Time interval" name="times" min="08:00" max="18:00" value={{ start: '09:30', end: '17:00' }} />
</form>

<AesirHoverCard openDelay={0} closeDelay={50}>
  {#snippet trigger(props)}
    <button type="button" {...props}>Preview item</button>
  {/snippet}
  {#snippet content()}
    <strong>Preview details</strong>
    <a href="#details">Open details</a>
  {/snippet}
</AesirHoverCard>
