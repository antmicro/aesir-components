<script>
  import Radio from '../../src/components/aesir-radio/aesir-radio.svelte';

  let plan = $state('free');
</script>

<form aria-label="Plan form">
  <Radio name="plan" value="free" label="Free" bind:group={plan} />
  <Radio name="plan" value="pro" label="Pro" readonly bind:group={plan} />
  <output aria-label="Plan value">{plan}</output>
</form>
