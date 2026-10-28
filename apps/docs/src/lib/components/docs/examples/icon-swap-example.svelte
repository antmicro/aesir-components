<script lang="ts">
  import { AesirButton, AesirIconSwap } from '@aesir/svelte';

  let copied = $state(false);
</script>

<AesirButton variant="outline" size="icon-sm" aria-label={copied ? 'Copied' : 'Copy'} onclick={() => (copied = !copied)}>
  <AesirIconSwap name="copy" activeName="check" active={copied} />
</AesirButton>
