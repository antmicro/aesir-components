<script>
  import { AesirPagination, AesirSlider, AesirStepper } from '../../src/index.js';

  let page = $state(2);
  let pageChanges = $state(0);
  let step = $state('configure');
  let stepChanges = $state(0);
  let volume = $state(4);

  const steps = [
    { value: 'create', label: 'Create project' },
    { value: 'configure', label: 'Configure project' },
    { value: 'deploy', label: 'Deploy project' }
  ];
</script>

<AesirPagination bind:page totalPages={5} data-testid="pagination" class="consumer-pagination" onpagechange={() => (pageChanges += 1)} />
<output aria-label="Current page">{page}</output>
<output aria-label="Page changes">{pageChanges}</output>

<AesirPagination page={2} totalPages={3} disabled label="Disabled pagination" onpagechange={() => (pageChanges += 1)} />

<AesirStepper bind:value={step} items={steps} linear orientation="vertical" data-testid="stepper" onchange={() => (stepChanges += 1)} />
<output aria-label="Current step">{step}</output>
<output aria-label="Step changes">{stepChanges}</output>

<AesirSlider bind:value={volume} min={0} max={10} step={2} label="Volume" data-testid="slider" />
<output aria-label="Volume value">{volume}</output>
<AesirSlider value={4} label="Disabled volume" disabled />
