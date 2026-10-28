<svelte:options
  customElement={{
    tag: 'aesir-animate',
    props: {
      duration: { type: 'Number' },
      delay: { type: 'Number' },
      threshold: { type: 'Number' },
      once: { type: 'Boolean' },
      repeat: { type: 'Boolean' },
      rootMargin: { attribute: 'root-margin' }
    }
  }}
/>

<script>
  import { AesirAnimate } from '@aesir/svelte/components/aesir-animate';

  let {
    as = 'div',
    animation = 'fade-up',
    duration = 240,
    delay = 0,
    easing = 'out',
    distance = 'var(--ds-spacing-2)',
    threshold = 0.15,
    rootMargin = '0px 0px -10% 0px',
    once = true,
    repeat = false
  } = $props();
  const resolvedOnce = $derived(repeat ? false : once);
</script>

<AesirAnimate {as} {animation} {duration} {delay} {easing} {distance} {threshold} {rootMargin} once={resolvedOnce}>
  <slot></slot>
</AesirAnimate>
