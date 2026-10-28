<script lang="ts">
  import AesirCheckbox from '../../src/components/aesir-checkbox/aesir-checkbox.svelte';
  import AesirInput from '../../src/components/aesir-input/aesir-input.svelte';
  import AesirNativeSelect from '../../src/components/aesir-native-select/aesir-native-select.svelte';
  import AesirRadio from '../../src/components/aesir-radio/aesir-radio.svelte';
  import AesirSwitch from '../../src/components/aesir-switch/aesir-switch.svelte';
  import AesirTextarea from '../../src/components/aesir-textarea/aesir-textarea.svelte';

  let name = $state('');
  let replicas = $state(1);
  let notes = $state('');
  let updates = $state(false);
  let plan = $state<string | number>('free');
  let alerts = $state(false);
  let region = $state<string | number | undefined>();

  const regions = [
    { value: 'eu', label: 'Europe' },
    { value: 'us', label: 'United States' },
    { value: 'legacy', label: 'Legacy', disabled: true }
  ];
</script>

<AesirInput bind:value={name} name="name" label="Project name" description="Shown to workspace members." required />
<AesirInput value="invalid" label="Repository" error="Use a full URL." aria-describedby="repository-help" />
<span id="repository-help">Include the protocol.</span>
<AesirInput bind:value={replicas} type="number" label="Replicas" min={1} max={2} />

<AesirTextarea bind:value={notes} name="notes" label="Notes" maxlength={12} showCount resize="auto" description="Short release notes." />

<AesirCheckbox bind:checked={updates} name="updates" label="Product updates" description="Receive release notes." />
<AesirCheckbox indeterminate label="Partial selection" />
<AesirCheckbox checked disabled label="Required policy" />

<AesirRadio bind:group={plan} name="plan" value="free" label="Free" />
<AesirRadio bind:group={plan} name="plan" value="pro" label="Pro" description="For production applications." />
<AesirRadio bind:group={plan} name="plan" value="enterprise" label="Enterprise" disabled />

<AesirSwitch bind:checked={alerts} name="alerts" label="Incident alerts" description="Notify the on-call team." />
<AesirSwitch checked disabled label="Security notifications" />

<AesirNativeSelect bind:value={region} name="region" label="Deployment region" description="Choose the closest region." placeholder="Select a region" options={regions} required />

<output aria-label="Name value">{name}</output>
<output aria-label="Replica value">{replicas}</output>
<output aria-label="Notes value">{notes}</output>
<output aria-label="Updates value">{updates}</output>
<output aria-label="Plan value">{plan}</output>
<output aria-label="Alerts value">{alerts}</output>
<output aria-label="Region value">{region ?? 'none'}</output>
