<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import AesirIcon from '../aesir-icon/aesir-icon.svelte';

  type IconSwapProps = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'style'> & {
    name: string;
    activeName: string;
    active?: boolean;
    size?: string | number;
    class?: string;
    style?: string;
  };
  let { name, activeName, active = false, size = 16, class: className = '', style: rootStyle = '', ...restProps }: IconSwapProps = $props();
</script>

<span
  class={`aesir-icon-swap ${className}`.trim()}
  data-active={active || undefined}
  style={`--aesir-icon-swap-size: ${typeof size === 'number' ? `${size}px` : size}; ${rootStyle}`}
  aria-hidden="true"
  {...restProps}
>
  <AesirIcon {name} />
  <AesirIcon name={activeName} />
</span>

<style>
  :global {
    .aesir-icon-swap {
      position: relative;
      display: inline-flex;
      width: var(--aesir-icon-swap-size);
      height: var(--aesir-icon-swap-size);
      flex: none;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .aesir-icon-swap > svg {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0;
      transform: scale(0.5) rotate(90deg);
      transition:
        opacity var(--ds-motion-duration-fast) var(--ds-motion-easing-subtle),
        transform var(--ds-motion-duration-fast) var(--ds-motion-easing-out);
    }

    .aesir-icon-swap > svg:first-child {
      opacity: 1;
      transform: scale(1) rotate(0);
    }

    .aesir-icon-swap[data-active] > svg:first-child {
      opacity: 0;
      transform: scale(0.5) rotate(-90deg);
    }

    .aesir-icon-swap[data-active] > svg:last-child {
      opacity: 1;
      transform: scale(1) rotate(0);
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-icon-swap > svg {
        transition-duration: var(--ds-motion-duration-instant);
        transform: none;
      }
    }
  }
</style>
