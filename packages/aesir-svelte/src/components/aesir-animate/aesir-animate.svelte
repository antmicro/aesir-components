<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  type AnimateProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'class' | 'style'> & {
    class?: string;
    as?: keyof HTMLElementTagNameMap;
    animation?: string;
    duration?: string | number;
    delay?: string | number;
    easing?: keyof typeof easings | string;
    distance?: string;
    threshold?: number;
    rootMargin?: string;
    once?: boolean;
    style?: string;
    children?: Snippet;
  };

  let {
    class: className = '',
    as = 'div',
    animation = 'fade-up',
    duration = 240,
    delay = 0,
    easing = 'out',
    distance = 'var(--ds-spacing-2)',
    threshold = 0.15,
    rootMargin = '0px 0px -10% 0px',
    once = true,
    style: styleProp = '',
    children,
    ...restProps
  }: AnimateProps = $props();

  const easings: Record<string, string> = {
    subtle: 'var(--ds-motion-easing-subtle)',
    out: 'var(--ds-motion-easing-out)',
    'in-out': 'var(--ds-motion-easing-in-out)',
    drawer: 'var(--ds-motion-easing-drawer)',
    linear: 'var(--ds-motion-easing-linear)'
  };

  let visible = $state(false);
  let observedElement: HTMLElement | undefined;
  let currentlyVisible = false;

  const toTime = (value: string | number) => (typeof value === 'number' ? `${value}ms` : value);
  const animationStyle = $derived(
    [
      `--aesir-animate-duration: ${toTime(duration)}`,
      `--aesir-animate-delay: ${toTime(delay)}`,
      `--aesir-animate-easing: ${easings[easing] ?? easing}`,
      `--aesir-animate-distance: ${distance}`,
      styleProp
    ]
      .filter(Boolean)
      .join('; ')
  );

  const observeIntersection = (element: HTMLElement) => {
    if (observedElement !== element) {
      observedElement = element;
      currentlyVisible = false;
      visible = false;
    }

    const observeOnce = once;
    const observeThreshold = threshold;
    const observeRootMargin = rootMargin;
    if (typeof IntersectionObserver === 'undefined') {
      currentlyVisible = true;
      visible = true;
      return;
    }

    if (observeOnce && currentlyVisible) return;

    let active = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!active) return;
        if (entry?.isIntersecting && entry.intersectionRatio >= observeThreshold) {
          currentlyVisible = true;
          visible = true;
          if (observeOnce) {
            active = false;
            observer.disconnect();
          }
        } else if (!observeOnce) {
          currentlyVisible = false;
          visible = false;
        }
      },
      { threshold: observeThreshold, rootMargin: observeRootMargin }
    );

    observer.observe(element);

    return () => {
      active = false;
      observer.disconnect();
    };
  };
</script>

<svelte:element this={as} {@attach observeIntersection} class={`aesir-animate ${className}`.trim()} data-animation={animation} data-visible={visible} style={animationStyle} {...restProps}>
  {@render children?.()}
</svelte:element>

<style>
  :global {
    @keyframes aesir-animate-fade {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }

    @keyframes aesir-animate-fade-up {
      from {
        opacity: 0;
        transform: translateY(var(--aesir-animate-distance));
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes aesir-animate-fade-down {
      from {
        opacity: 0;
        transform: translateY(calc(var(--aesir-animate-distance) * -1));
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes aesir-animate-fade-left {
      from {
        opacity: 0;
        transform: translateX(var(--aesir-animate-distance));
      }

      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes aesir-animate-fade-right {
      from {
        opacity: 0;
        transform: translateX(calc(var(--aesir-animate-distance) * -1));
      }

      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes aesir-animate-zoom {
      from {
        opacity: 0;
        transform: scale(0.97);
      }

      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes aesir-animate-blur {
      from {
        opacity: 0;
        filter: blur(var(--ds-spacing-2));
      }

      to {
        opacity: 1;
        filter: blur(0);
      }
    }

    .aesir-animate {
      --aesir-animate-delay: 0ms;
      --aesir-animate-distance: var(--ds-spacing-4);
      --aesir-animate-duration: var(--ds-motion-duration-slow);
      --aesir-animate-easing: var(--ds-motion-easing-out);

      opacity: 0;
      will-change: opacity, transform, filter;
    }

    .aesir-animate[data-visible='true'] {
      opacity: 1;
      animation-delay: var(--aesir-animate-delay);
      animation-duration: var(--aesir-animate-duration);
      animation-fill-mode: both;
      animation-timing-function: var(--aesir-animate-easing);
    }

    .aesir-animate[data-animation='fade'][data-visible='true'] {
      animation-name: aesir-animate-fade;
    }

    .aesir-animate[data-animation='fade-up'][data-visible='true'] {
      animation-name: aesir-animate-fade-up;
    }

    .aesir-animate[data-animation='fade-down'][data-visible='true'] {
      animation-name: aesir-animate-fade-down;
    }

    .aesir-animate[data-animation='fade-left'][data-visible='true'] {
      animation-name: aesir-animate-fade-left;
    }

    .aesir-animate[data-animation='fade-right'][data-visible='true'] {
      animation-name: aesir-animate-fade-right;
    }

    .aesir-animate[data-animation='zoom'][data-visible='true'] {
      animation-name: aesir-animate-zoom;
    }

    .aesir-animate[data-animation='blur'][data-visible='true'] {
      animation-name: aesir-animate-blur;
    }

    @media (prefers-reduced-motion: reduce) {
      .aesir-animate,
      .aesir-animate[data-visible='true'] {
        opacity: 1;
        animation: none;
        filter: none;
        transform: none;
        will-change: auto;
      }
    }
  }
</style>
