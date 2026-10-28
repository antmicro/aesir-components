<script>
  import { AesirAccordion } from '@aesir/svelte';

  const items = [
    { value: 'overview', title: 'What is Aesir?', content: 'A component system for building precise, accessible product interfaces.' },
    { value: 'accessibility', title: 'Is it accessible?', content: 'Yes. The accordion supports semantic headings, ARIA relationships, focus management, and keyboard navigation.' },
    { value: 'control', title: 'Can I control its state?', content: 'Bind value to open, close, or observe an item from anywhere in your interface.' }
  ];
</script>

<div class="example"><AesirAccordion {items} /></div>

<style>
  .example {
    width: min(100%, var(--ds-sizing-xl));
  }
</style>
