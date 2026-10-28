<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  type LoaderProps = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'style'> & {
    class?: string;
    style?: string;
    size?: 'sm' | 'default' | 'lg';
    variant?: 'ring' | 'lines' | 'grid';
    pattern?: 'pulse' | 'wave' | 'orbit';
    label?: string;
    decorative?: boolean;
  };
  let { class: className = '', style: rootStyle, size = 'default', variant = 'ring', pattern = 'pulse', label = 'Loading', decorative = false, ...restProps }: LoaderProps = $props();
  const lines = Array.from({ length: 12 }, (_, index) => index);
  const dots = Array.from({ length: 9 }, (_, index) => index);
</script>

<span
  class={`aesir-loader ${className}`.trim()}
  data-size={size}
  data-variant={variant}
  data-pattern={variant === 'grid' ? pattern : undefined}
  style={rootStyle}
  role={decorative ? undefined : 'status'}
  aria-label={decorative ? undefined : label}
  aria-hidden={decorative || undefined}
  {...restProps}
>
  {#if variant === 'grid'}
    <span class="aesir-loader__grid" aria-hidden="true">
      {#each dots as index (index)}<span></span>{/each}
    </span>
  {:else if variant === 'lines'}
    <span class="aesir-loader__lines" aria-hidden="true">
      {#each lines as index (index)}<span style={`--aesir-loader-index: ${index}`}></span>{/each}
    </span>
  {:else}
    <svg class="aesir-loader__ring" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M21 12a9 9 0 0 0-9-9"></path>
    </svg>
  {/if}
</span>

<style>
  :global {
    .aesir-loader {
      display: inline-grid;
      width: var(--ds-spacing-5);
      height: var(--ds-spacing-5);
      flex: 0 0 auto;
      place-items: center;
      color: currentColor;
    }
    .aesir-loader[data-size='sm'] {
      width: var(--ds-spacing-4);
      height: var(--ds-spacing-4);
    }
    .aesir-loader[data-size='lg'] {
      width: var(--ds-spacing-6);
      height: var(--ds-spacing-6);
    }
    .aesir-loader svg {
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-width: 2;
    }
    .aesir-loader__ring {
      animation: aesir-loader-rotate 0.8s var(--ds-motion-easing-linear) infinite;
    }
    .aesir-loader__ring circle {
      opacity: 0.22;
    }
    .aesir-loader__lines {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .aesir-loader__lines span {
      position: absolute;
      top: 0;
      left: calc(50% - 4%);
      width: 8%;
      height: 28%;
      border-radius: var(--ds-radius-full);
      background: currentColor;
      opacity: 0.16;
      transform: rotate(calc(var(--aesir-loader-index) * 30deg));
      transform-origin: 50% 178.571%;
      animation: aesir-loader-line 1s var(--ds-motion-easing-linear) infinite;
      animation-delay: calc(var(--aesir-loader-index) * -83.333ms);
    }
    .aesir-loader__grid {
      display: grid;
      width: 100%;
      height: 100%;
      grid-template-columns: repeat(3, 1fr);
      gap: 12.5%;
      place-items: center;
    }
    .aesir-loader__grid span {
      width: 100%;
      aspect-ratio: 1;
      border-radius: var(--ds-radius-full);
      background: currentColor;
      opacity: 0.16;
      animation: aesir-loader-dot 1.05s var(--ds-motion-easing-linear) infinite;
    }
    .aesir-loader[data-pattern='pulse'] .aesir-loader__grid span:nth-child(1),
    .aesir-loader[data-pattern='wave'] .aesir-loader__grid span:nth-child(1),
    .aesir-loader[data-pattern='orbit'] .aesir-loader__grid span:nth-child(1) {
      animation-delay: -0.933s;
    }
    .aesir-loader[data-pattern='pulse'] .aesir-loader__grid span:nth-child(2),
    .aesir-loader[data-pattern='wave'] .aesir-loader__grid span:nth-child(2),
    .aesir-loader[data-pattern='orbit'] .aesir-loader__grid span:nth-child(2) {
      animation-delay: -0.816s;
    }
    .aesir-loader[data-pattern='pulse'] .aesir-loader__grid span:nth-child(3),
    .aesir-loader[data-pattern='wave'] .aesir-loader__grid span:nth-child(3),
    .aesir-loader[data-pattern='orbit'] .aesir-loader__grid span:nth-child(3) {
      animation-delay: -0.7s;
    }
    .aesir-loader[data-pattern='pulse'] .aesir-loader__grid span:nth-child(4) {
      animation-delay: -0.816s;
    }
    .aesir-loader[data-pattern='pulse'] .aesir-loader__grid span:nth-child(5) {
      animation-delay: -0.7s;
    }
    .aesir-loader[data-pattern='pulse'] .aesir-loader__grid span:nth-child(6) {
      animation-delay: -0.583s;
    }
    .aesir-loader[data-pattern='pulse'] .aesir-loader__grid span:nth-child(7) {
      animation-delay: -0.7s;
    }
    .aesir-loader[data-pattern='pulse'] .aesir-loader__grid span:nth-child(8) {
      animation-delay: -0.583s;
    }
    .aesir-loader[data-pattern='pulse'] .aesir-loader__grid span:nth-child(9) {
      animation-delay: -0.466s;
    }
    .aesir-loader[data-pattern='pulse'] .aesir-loader__grid span:nth-child(1),
    .aesir-loader[data-pattern='pulse'] .aesir-loader__grid span:nth-child(3),
    .aesir-loader[data-pattern='pulse'] .aesir-loader__grid span:nth-child(7),
    .aesir-loader[data-pattern='pulse'] .aesir-loader__grid span:nth-child(9) {
      animation-delay: -0.466s;
    }
    .aesir-loader[data-pattern='pulse'] .aesir-loader__grid span:nth-child(2),
    .aesir-loader[data-pattern='pulse'] .aesir-loader__grid span:nth-child(4),
    .aesir-loader[data-pattern='pulse'] .aesir-loader__grid span:nth-child(6),
    .aesir-loader[data-pattern='pulse'] .aesir-loader__grid span:nth-child(8) {
      animation-delay: -0.7s;
    }
    .aesir-loader[data-pattern='pulse'] .aesir-loader__grid span:nth-child(5) {
      animation-delay: -0.933s;
    }
    .aesir-loader[data-pattern='wave'] .aesir-loader__grid span:nth-child(4) {
      animation-delay: -0.583s;
    }
    .aesir-loader[data-pattern='wave'] .aesir-loader__grid span:nth-child(5) {
      animation-delay: -0.466s;
    }
    .aesir-loader[data-pattern='wave'] .aesir-loader__grid span:nth-child(6) {
      animation-delay: -0.35s;
    }
    .aesir-loader[data-pattern='wave'] .aesir-loader__grid span:nth-child(7) {
      animation-delay: -0.233s;
    }
    .aesir-loader[data-pattern='wave'] .aesir-loader__grid span:nth-child(8) {
      animation-delay: -0.116s;
    }
    .aesir-loader[data-pattern='wave'] .aesir-loader__grid span:nth-child(9) {
      animation-delay: 0s;
    }
    .aesir-loader[data-pattern='orbit'] .aesir-loader__grid span:nth-child(4) {
      animation-delay: 0s;
    }
    .aesir-loader[data-pattern='orbit'] .aesir-loader__grid span:nth-child(5) {
      animation-delay: -0.525s;
    }
    .aesir-loader[data-pattern='orbit'] .aesir-loader__grid span:nth-child(6) {
      animation-delay: -0.583s;
    }
    .aesir-loader[data-pattern='orbit'] .aesir-loader__grid span:nth-child(7) {
      animation-delay: -0.116s;
    }
    .aesir-loader[data-pattern='orbit'] .aesir-loader__grid span:nth-child(8) {
      animation-delay: -0.233s;
    }
    .aesir-loader[data-pattern='orbit'] .aesir-loader__grid span:nth-child(9) {
      animation-delay: -0.35s;
    }
    @keyframes aesir-loader-rotate {
      to {
        transform: rotate(360deg);
      }
    }
    @keyframes aesir-loader-line {
      0%,
      18% {
        opacity: 1;
      }
      68%,
      100% {
        opacity: 0.16;
      }
    }
    @keyframes aesir-loader-dot {
      0%,
      22% {
        opacity: 1;
        transform: scale(1);
      }
      55%,
      100% {
        opacity: 0.16;
        transform: scale(0.72);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .aesir-loader__ring,
      .aesir-loader__lines span,
      .aesir-loader__grid span {
        animation: aesir-loader-reduced var(--ds-motion-duration-slow) var(--ds-motion-easing-linear) infinite alternate;
      }
      @keyframes aesir-loader-reduced {
        to {
          opacity: 0.45;
        }
      }
    }
  }
</style>
