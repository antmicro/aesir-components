<script>
  import Radio from '../../src/components/aesir-radio/aesir-radio.svelte';

  let selected = $state('production');
</script>

<div data-testid="radio-container" style="width: 160px">
  <Radio
    bind:group={selected}
    value="production"
    label="ProductionDeploymentWithAnExceptionallyLongUnbrokenEnvironmentIdentifier"
    description="DocumentationForThisParticularProductionDeploymentEnvironmentIdentifier"
  />
</div>
