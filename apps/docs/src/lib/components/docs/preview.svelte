<script>
  import { AesirComponentPreview } from '@aesir/svelte';
  let { children, class: className = '', className: legacyClassName = '', contentClassName = '', contentless = false } = $props();
  const rootClass = $derived(`${className} ${legacyClassName}`.trim());
</script>

<AesirComponentPreview class={`docs-preview ${rootClass}`.trim()} {contentless} contentClass={`docs-preview__content ${contentClassName}`.trim()}>
  {@render children?.()}
</AesirComponentPreview>
