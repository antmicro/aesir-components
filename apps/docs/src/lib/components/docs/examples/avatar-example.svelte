<script>
  import { AesirAvatar } from '@aesir/svelte';
</script>

<div class="avatar-example">
  <AesirAvatar fallback="XS" aria-label="Gradient avatar" size="2xs" gradient />
  <AesirAvatar fallback="AV" aria-label="Small fallback" size="xs" />
  <AesirAvatar src="/images/avatars/john-doe.png" alt="John Doe" fallback="JD" size="sm" />
  <AesirAvatar src="/images/avatars/jane-smith.png" alt="Jane Smith" fallback="JS" />
  <AesirAvatar src="/images/avatars/olivia-smith.png" alt="Olivia Smith" fallback="OS" size="lg" />
  <AesirAvatar src="/missing-avatar.png" fallback="FB" aria-label="Fallback example" />
</div>

<style>
  .avatar-example {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-4);
  }
</style>
