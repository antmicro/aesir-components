<script>
  import { AesirAccordion } from '@aesir/svelte';

  let value = $state('build');
  const items = [
    {
      value: 'build',
      title: 'Built for complex products',
      content: 'Compose dense workflows without losing clarity or hierarchy.',
      image: 'https://placehold.co/800x600/171717/f5f5f5?text=Product+workflows',
      imageAlt: 'Product workflow placeholder'
    },
    {
      value: 'adapt',
      title: 'Adapts to every surface',
      content: 'The same foundations work across dashboards, documentation, and commerce.',
      image: 'https://placehold.co/800x600/1e293b/f5f5f5?text=Adaptive+layouts',
      imageAlt: 'Adaptive layouts placeholder'
    },
    {
      value: 'ship',
      title: 'Ready to ship',
      content: 'Accessible behavior and considered motion are included by default.',
      image: 'https://placehold.co/800x600/172554/f5f5f5?text=Ready+to+ship',
      imageAlt: 'Ready to ship placeholder'
    }
  ];
</script>

<AesirAccordion {items} bind:value />
