<script>
  import Radio from '../../src/components/aesir-radio/aesir-radio.svelte';

  let plan = $state('free');
  let showTeam = $state(false);
  let changes = $state(0);
  let region = $state('north');
</script>

<form aria-label="Dynamic plan form">
  <Radio name="plan" value="free" label="Free" bind:group={plan} />
  <Radio name="plan" value="pro" label="Pro" bind:group={plan} onchange={() => (changes += 1)} />
  {#if showTeam}<Radio name="plan" value="team" label="Team" bind:group={plan} />{/if}
  <button type="button" onclick={() => (showTeam = true)}>Add team option</button>
  <button
    type="button"
    onclick={() => {
      showTeam = true;
      plan = 'team';
    }}
  >
    Select team
  </button>
  <button type="reset">Reset plan</button>
  <output aria-label="Current plan">{plan}</output>
  <output aria-label="Plan changes">{changes}</output>
</form>

<form aria-label="Region form">
  <Radio name="plan" value="north" label="North" bind:group={region} />
  <Radio name="plan" value="south" label="South" bind:group={region} />
  <button type="reset">Reset region</button>
  <output aria-label="Current region">{region}</output>
</form>
