<script>
  import { AesirFileUpload } from '@aesir/svelte';
  let files = $state([]);
  let message = $state('PNG, JPG, or PDF up to 5 MB');
</script>

<AesirFileUpload
  bind:files
  accept="image/png,image/jpeg,.pdf"
  multiple
  maxFiles={3}
  maxSize={5 * 1024 * 1024}
  description={message}
  onreject={(rejected) => (message = `${rejected.length} file${rejected.length === 1 ? '' : 's'} could not be added`)}
/>
