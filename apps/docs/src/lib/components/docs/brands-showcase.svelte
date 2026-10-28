<script>
  import { onDestroy } from 'svelte';
  import { AesirButton, AesirIcon, AesirIconSwap } from '@aesir/svelte';
  import { copyToClipboard } from './copy.js';
  import { brandSections } from './brands.data.js';

  let copiedId = $state(null);
  let resetCopiedStateTimeout = null;

  function getAsset(brand, type, theme) {
    return brand.assets.find((asset) => asset.type === type && asset.theme === theme) ?? null;
  }

  function getAssets(brand, type) {
    return ['light', 'dark'].map((theme) => getAsset(brand, type, theme)).filter(Boolean);
  }

  async function copySvg(asset) {
    const copied = await copyToClipboard(asset?.svg, {
      successLabel: `${asset?.copyLabel ?? 'Brand asset'} SVG copied`,
      showValue: false,
      emptyDescription: 'This SVG asset is not available.'
    });
    if (!copied) return;

    copiedId = asset.id;
    if (resetCopiedStateTimeout) {
      window.clearTimeout(resetCopiedStateTimeout);
    }
    resetCopiedStateTimeout = window.setTimeout(() => {
      copiedId = null;
    }, 1400);
  }

  function normalizeSvg(svg, type) {
    if (!svg) return '';

    const variant = type === 'logo' ? 'brand-svg--logo' : 'brand-svg--icon';
    return svg
      .replace(/\swidth="[^"]*"/gi, '')
      .replace(/\sheight="[^"]*"/gi, '')
      .replace('<svg', `<svg class="brand-svg ${variant}"`);
  }

  onDestroy(() => {
    if (resetCopiedStateTimeout) window.clearTimeout(resetCopiedStateTimeout);
  });
</script>

{#snippet preview(asset, type, brandName)}
  <div class="brand-preview" data-theme={asset.theme} data-copied={copiedId === asset.id || undefined}>
    <button type="button" class="brand-preview__button" aria-label={`Copy ${brandName} ${type} ${asset.theme} SVG`} onclick={() => copySvg(asset)}>
      <div class="brand-preview__frame" data-type={type}>
        <div class="brand-preview__artwork">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html normalizeSvg(asset.svg, type)}
        </div>
      </div>

      <div class="brand-preview__overlay">
        <span class="brand-copy-button">
          <AesirIconSwap name="copy" activeName="check" active={copiedId === asset.id} />
        </span>
      </div>
    </button>
  </div>
{/snippet}

<div class="brands-showcase">
  {#each brandSections as brand (brand.slug)}
    {@const logos = getAssets(brand, 'logo')}
    {@const icons = getAssets(brand, 'icon')}

    <section id={brand.slug} class="brand-section">
      <div class="brand-section__intro">
        <div class="brand-section__heading">
          <h2>{brand.name}</h2>
          <p>{brand.description}</p>
        </div>

        <AesirButton href={brand.downloadHref} download={brand.downloadName} variant="outline" class="brand-section__download">
          <AesirIcon name="download" />
          Download {brand.name} Assets
        </AesirButton>
      </div>

      <div class="brand-section__logos">
        {#each logos as asset (asset.id)}
          {@render preview(asset, 'logo', brand.name)}
        {/each}
      </div>

      <div class="brand-section__icons">
        <h3>{brand.name} Icon</h3>
        <div class="brand-section__icon-grid">
          {#each icons as asset (asset.id)}
            {@render preview(asset, 'icon', brand.name)}
          {/each}
        </div>
      </div>
    </section>
  {/each}
</div>

<style>
  .brands-showcase {
    display: grid;
    gap: var(--ds-spacing-14);
  }

  .brand-section {
    scroll-margin-top: calc(var(--ds-spacing-14) * 2);
    padding-top: var(--ds-spacing-10);
    border-top: var(--ds-spacing-px) solid var(--ds-border);
  }

  .brand-section:first-child {
    padding-top: 0;
    border-top: 0;
  }

  .brand-section__intro {
    display: grid;
    max-width: var(--ds-sizing-4xl);
    gap: var(--ds-spacing-5);
  }

  .brand-section__heading {
    display: grid;
    gap: var(--ds-spacing-3);
  }

  .brand-section__heading h2,
  .brand-section__heading p,
  .brand-section__icons h3 {
    margin: 0;
  }

  .brand-section__heading h2 {
    font-size: var(--ds-font-size-3xl);
    font-weight: var(--ds-font-weight-medium);
    letter-spacing: var(--ds-font-letter-spacing-tight);
  }

  .brand-section__heading p {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-lg);
  }

  :global(.brand-section__download) {
    width: 100%;
    border-radius: var(--ds-radius-full);
  }

  .brand-section__logos,
  .brand-section__icon-grid {
    overflow: hidden;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-2xl);
  }

  .brand-section__logos {
    display: flex;
    flex-direction: column;
    margin-top: var(--ds-spacing-8);
  }

  .brand-section__icons {
    margin-top: var(--ds-spacing-12);
  }

  .brand-section__icons h3 {
    margin-bottom: var(--ds-spacing-5);
    font-size: var(--ds-font-size-2xl);
    font-weight: var(--ds-font-weight-medium);
    letter-spacing: var(--ds-font-letter-spacing-tight);
  }

  .brand-section__icon-grid {
    display: grid;
    gap: var(--ds-spacing-px);
    background: var(--ds-border);
  }

  .brand-preview {
    position: relative;
    overflow: hidden;
    background: var(--ds-background);
  }

  .brand-preview__button {
    position: relative;
    display: block;
    width: 100%;
    height: auto;
    padding: 0;
    border: 0;
    border-radius: 0;
    color: inherit;
    font: inherit;
    cursor: pointer;
    appearance: none;
  }

  .brand-preview[data-theme='light'] .brand-preview__button {
    background: var(--ds-background-secondary);
    color: var(--ds-foreground);
  }

  .brand-preview[data-theme='dark'] .brand-preview__button {
    background: var(--ds-foreground);
    color: var(--ds-background);
  }

  :global(.dark .brand-preview[data-theme='light'] .brand-preview__button) {
    background: var(--ds-foreground);
    color: var(--ds-background);
  }

  :global(.dark .brand-preview[data-theme='dark'] .brand-preview__button) {
    background: var(--ds-background);
    color: var(--ds-foreground);
  }

  .brand-preview__button:hover {
    background-color: inherit;
  }

  .brand-preview__button:focus-visible {
    outline: 0;
    box-shadow: 0 0 0 var(--ds-spacing-0-5) var(--ds-accent-ring);
  }

  .brand-preview__frame {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--ds-spacing-14) var(--ds-spacing-8);
  }

  .brand-preview__frame[data-type='icon'] {
    min-height: var(--ds-spacing-64);
  }

  .brand-preview__overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in oklch, var(--ds-fixed-black) 20%, transparent);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle);
  }

  .brand-preview:focus-within .brand-preview__overlay,
  .brand-preview[data-copied] .brand-preview__overlay {
    opacity: 1;
  }

  .brand-copy-button {
    display: inline-flex;
    width: var(--ds-spacing-9);
    height: var(--ds-spacing-9);
    align-items: center;
    justify-content: center;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: color-mix(in oklch, var(--ds-background) 90%, transparent);
    color: var(--ds-foreground);
  }

  .brand-preview[data-copied] .brand-copy-button {
    border-color: var(--ds-border-hover);
    background: color-mix(in oklch, var(--ds-background) 96%, transparent);
  }

  :global(.brand-svg) {
    display: block;
    max-width: 100%;
    height: auto;
  }

  :global(.brand-svg--logo) {
    width: min(100%, 44rem);
    max-height: 6rem;
  }

  :global(.brand-svg--icon) {
    width: 5rem;
    height: 5rem;
  }

  @media (hover: hover) and (pointer: fine) {
    .brand-preview:hover .brand-preview__overlay {
      opacity: 1;
    }
  }

  @media (min-width: 768px) {
    .brand-section__heading h2 {
      font-size: var(--ds-font-size-4xl);
    }

    .brand-section__heading p {
      font-size: var(--ds-font-size-base);
    }

    :global(.brand-section__download) {
      width: fit-content;
    }

    .brand-section__icon-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .brand-preview__frame {
      padding: var(--ds-spacing-20) var(--ds-spacing-12);
    }

    .brand-preview__frame[data-type='icon'] {
      min-height: var(--ds-spacing-72);
      padding-block: var(--ds-spacing-16);
    }

    :global(.brand-svg--logo) {
      max-height: 7rem;
    }

    :global(.brand-svg--icon) {
      width: 6rem;
      height: 6rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .brand-preview__overlay {
      transition-duration: var(--ds-motion-duration-instant);
    }
  }
</style>
