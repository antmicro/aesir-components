<script>
  import AesirSwitch from '../../src/components/aesir-switch/aesir-switch.svelte';
  let { changes } = $props();
</script>

<form aria-label="Settings">
  <AesirSwitch label="Vim mode" oncheckedchange={(checked) => changes.push(checked)} />
</form>
