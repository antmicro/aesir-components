<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  type AvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, 'aria-label' | 'class' | 'role'> & {
    class?: string;
    src?: string;
    alt?: string;
    'aria-label'?: string;
    role?: HTMLAttributes<HTMLSpanElement>['role'];
    fallback?: string;
    size?: '2xs' | 'xs' | 'sm' | 'default' | 'lg';
    gradient?: boolean;
    loading?: 'eager' | 'lazy';
    decoding?: 'async' | 'auto' | 'sync';
  };

  let {
    class: className = '',
    src = undefined,
    alt = '',
    'aria-label': ariaLabel = undefined,
    role: roleProp = undefined,
    fallback = '',
    size = 'default',
    gradient = false,
    loading = 'lazy',
    decoding = 'async',
    ...restProps
  }: AvatarProps = $props();
  let loadedImage = $state<HTMLImageElement>();
  let activeImage = $state<HTMLImageElement>();
  const pixelSize = $derived(size === '2xs' ? 20 : size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'lg' ? 48 : 40);
  const accessibleLabel = $derived(ariaLabel || alt || fallback || undefined);
  const role = $derived(roleProp ?? (accessibleLabel ? 'img' : undefined));
  const usesFallback = $derived(!src || !activeImage || loadedImage !== activeImage);
  const onImageLoad = (event: Event) => {
    if (event.currentTarget === activeImage) loadedImage = activeImage;
  };
  const onImageError = (event: Event) => {
    if (event.currentTarget === activeImage) loadedImage = undefined;
  };

  $effect(() => {
    const image = activeImage;
    if (src && image?.complete && image.naturalWidth > 0) loadedImage = image;
  });

  const hashSeed = (value: string) => {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };

  const fallbackGradient = $derived.by(() => {
    const hash = hashSeed(accessibleLabel || fallback || 'avatar');
    const startHue = hash % 360;
    const endHue = (startHue + 35 + ((hash >>> 8) % 56)) % 360;
    return {
      start: `hsl(${startHue} 72% 38%)`,
      end: `hsl(${endHue} 78% 46%)`
    };
  });
</script>

<span
  class={`aesir-avatar ${className}`.trim()}
  data-size={size}
  data-slot="avatar"
  data-gradient={usesFallback && gradient ? '' : undefined}
  style:--aesir-avatar-gradient-start={fallbackGradient.start}
  style:--aesir-avatar-gradient-end={fallbackGradient.end}
  {role}
  aria-label={accessibleLabel}
  {...restProps}
>
  {#if src}
    {#key src}
      <img bind:this={activeImage} {src} alt="" width={pixelSize} height={pixelSize} {loading} {decoding} data-loaded={!usesFallback || undefined} onload={onImageLoad} onerror={onImageError} />
    {/key}
  {/if}
  {#if usesFallback && !gradient}<span aria-hidden="true">{fallback}</span>{/if}
</span>

<style>
  :global {
    .aesir-avatar {
      display: inline-grid;
      width: var(--ds-spacing-10);
      height: var(--ds-spacing-10);
      overflow: hidden;
      place-items: center;
      flex-shrink: 0;
      border: var(--ds-spacing-px) solid var(--ds-border);
      border-radius: var(--ds-radius-full);
      background: var(--ds-surface);
      color: var(--ds-foreground-muted);
      font-size: var(--ds-font-size-sm);
      font-weight: var(--ds-font-weight-medium);
    }

    .aesir-avatar[data-size='sm'] {
      width: var(--ds-spacing-8);
      height: var(--ds-spacing-8);
      font-size: var(--ds-font-size-xs);
    }

    .aesir-avatar[data-size='xs'] {
      width: var(--ds-spacing-6);
      height: var(--ds-spacing-6);
      font-size: var(--ds-font-size-xs);
    }

    .aesir-avatar[data-size='2xs'] {
      width: var(--ds-spacing-5);
      height: var(--ds-spacing-5);
      font-size: var(--ds-font-size-xs);
      letter-spacing: -0.04em;
    }

    .aesir-avatar[data-size='lg'] {
      width: var(--ds-spacing-12);
      height: var(--ds-spacing-12);
      font-size: var(--ds-font-size-base);
    }

    .aesir-avatar img {
      grid-area: 1 / 1;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
    }

    .aesir-avatar img[data-loaded] {
      opacity: 1;
    }

    .aesir-avatar > span {
      grid-area: 1 / 1;
    }

    .aesir-avatar[data-gradient] {
      border-color: color-mix(in oklch, var(--aesir-avatar-gradient-end) 72%, var(--ds-border));
      background: linear-gradient(135deg, var(--aesir-avatar-gradient-start), var(--aesir-avatar-gradient-end));
    }
  }
</style>
