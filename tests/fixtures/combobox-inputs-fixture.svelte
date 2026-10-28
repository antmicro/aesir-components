<script>
  import { AesirAutocompleteBox, AesirTagInput } from '../../src/index.js';

  const cityOptions = [
    { label: 'Warsaw', value: 'warsaw' },
    { label: 'Berlin', value: 'berlin', disabled: true },
    { label: 'Prague', value: 'prague' }
  ];

  const tagOptions = [
    { label: 'Accessibility', value: 'a11y' },
    { label: 'Deprecated', value: 'deprecated', disabled: true },
    { label: 'Design systems', value: 'design-systems' }
  ];

  let city = $state(null);
  let cityQuery = $state('');
  let cityOpen = $state(false);
  let tags = $state(['a11y']);
  let tagQuery = $state('');
</script>

<AesirAutocompleteBox options={cityOptions} bind:value={city} bind:query={cityQuery} bind:open={cityOpen} label="City" description="Choose a city" />
<output aria-label="City value">{city ?? 'none'}</output>
<output aria-label="City query">{cityQuery || 'empty'}</output>
<output aria-label="City open state">{cityOpen ? 'open' : 'closed'}</output>
<button type="button" onclick={() => (city = 'prague')}>Select Prague externally</button>
<button type="button" onclick={() => (city = null)}>Clear city externally</button>

<AesirTagInput options={tagOptions} bind:value={tags} bind:query={tagQuery} label="Topics" allowCustom closeOnSelect={false} max={3} />
<output aria-label="Tag values">{tags.join(',')}</output>
