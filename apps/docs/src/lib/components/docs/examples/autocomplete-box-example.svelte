<script>
  import { AesirAutocompleteBox } from '@aesir/svelte';
  const options = [
    'Amsterdam',
    'Athens',
    'Barcelona',
    'Berlin',
    'Bangkok',
    'Beijing',
    'Brussels',
    'Budapest',
    'Buenos Aires',
    'Boston',
    'Copenhagen',
    'Cairo',
    'Cape Town',
    'Chicago',
    'Dubai',
    'Dublin',
    'Edinburgh',
    'Helsinki',
    'Istanbul',
    'Lisbon',
    'London',
    'Madrid',
    'Melbourne',
    'Mexico City',
    'Montreal',
    'New York',
    'Oslo',
    'Paris',
    'Prague',
    'Rome',
    'San Francisco',
    'Seoul',
    'Singapore',
    'Stockholm',
    'Sydney',
    'Tokyo',
    'Toronto',
    'Vienna',
    'Warsaw',
    'Zurich'
  ]
    .sort()
    .map((label) => ({ label, value: label.toLowerCase() }));
  let value = $state(null);
  let destination = $state(null);
</script>

<div class="example">
  <AesirAutocompleteBox {options} bind:value label="City" placeholder="Search cities…" required errorPlacement="label" />
  <p>Value: {value ?? 'none'}</p>
  <AesirAutocompleteBox
    {options}
    bind:value={destination}
    label="Destination"
    placeholder="Select a city…"
    allowCustomValue={false}
    maxResults={8}
    required
    error={destination == null ? 'Choose a city to continue.' : undefined}
  />
</div>

<style>
  .example {
    width: min(100%, 24rem);
    margin: auto;
  }
  p {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }
</style>
