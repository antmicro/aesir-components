<script>
  import { AesirPortal } from '../../src/index.js';

  let disabled = $state(false);
  let target = $state('#first-target');
</script>

<button onclick={() => (disabled = !disabled)}>Toggle portal</button>
<button onclick={() => (target = '#second-target')}>Change target</button>

<div data-testid="origin">
  <AesirPortal to={target} {disabled}>
    <span>Portalled content</span>
  </AesirPortal>
</div>

<div id="first-target" data-testid="first-target"></div>
<div id="second-target" data-testid="second-target"></div>
