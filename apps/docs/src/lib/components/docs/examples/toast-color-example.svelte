<script>
  import { AesirButton, toast } from '@aesir/svelte';
</script>

<AesirButton variant="outline" onclick={() => toast.info('Project updated', undefined, { color: 'teal' })}>Teal toast</AesirButton>
