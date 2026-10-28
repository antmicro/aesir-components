<script>
  import { AesirAccordion, AesirCollapsible, AesirTabs } from '../../src/index.js';

  const tabs = [
    { value: 'overview', label: 'Overview', content: 'Overview panel' },
    { value: 'disabled', label: 'Disabled', content: 'Disabled panel', disabled: true },
    { value: 'activity', label: 'Activity', content: 'Activity panel' }
  ];

  const accordionItems = [
    { value: 'account', title: 'Account', content: 'Account settings' },
    { value: 'billing', title: 'Billing', content: 'Billing settings', disabled: true },
    { value: 'security', title: 'Security', content: 'Security settings' }
  ];

  let tab = $state('overview');
  let accordion = $state('account');
  let collapsibleOpen = $state(false);
</script>

<AesirTabs items={tabs} bind:value={tab} label="Workspace sections" />
<output aria-label="Selected tab">{tab}</output>

<AesirAccordion items={accordionItems} bind:value={accordion} />
<output aria-label="Selected accordion item">{accordion}</output>

<AesirCollapsible title="Advanced settings" bind:open={collapsibleOpen}>
  <button>Dangerous action</button>
</AesirCollapsible>
<output aria-label="Collapsible state">{collapsibleOpen ? 'open' : 'closed'}</output>
