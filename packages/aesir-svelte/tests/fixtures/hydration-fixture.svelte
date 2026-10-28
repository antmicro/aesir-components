<script>
  import { AesirButton, AesirCheckbox, AesirCollapsible, AesirTabs } from '../../src/index.js';

  let activations = $state(0);
  let checked = $state(false);
  let expanded = $state(false);
  let tab = $state('overview');

  const tabs = [
    { value: 'overview', label: 'Overview', content: 'Overview panel' },
    { value: 'activity', label: 'Activity', content: 'Activity panel' }
  ];
</script>

<AesirButton onclick={() => (activations += 1)}>Hydrated action</AesirButton>
<AesirCheckbox bind:checked label="Hydrated checkbox" />
<AesirCollapsible bind:open={expanded} title="Hydrated disclosure">Hydrated content</AesirCollapsible>
<AesirTabs bind:value={tab} items={tabs} label="Hydrated tabs" />

<output aria-label="Hydrated activations">{activations}</output>
<output aria-label="Hydrated checkbox state">{checked ? 'checked' : 'unchecked'}</output>
<output aria-label="Hydrated disclosure state">{expanded ? 'open' : 'closed'}</output>
<output aria-label="Hydrated tab state">{tab}</output>
