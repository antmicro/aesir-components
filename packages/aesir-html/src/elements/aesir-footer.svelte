<svelte:options
  customElement={{
    tag: 'aesir-footer',
    props: {
      hasBrandContent: { type: 'Boolean', attribute: 'has-brand-content', reflect: true }
    }
  }}
/>

<script>
  import { AesirFooter } from '@aesir/svelte/components/aesir-footer';

  let { variant = 'columns', label = 'Footer', brand = 'Aesir', description, columns = [], socials = [], legalLinks = [], copyright, hasBrandContent = false } = $props();
  const parse = (value) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  };
  const parsedColumns = $derived(parse(columns));
  const parsedSocials = $derived(parse(socials));
  const parsedLegalLinks = $derived(parse(legalLinks));
</script>

{#if hasBrandContent}
  <AesirFooter {variant} {label} {brand} {description} columns={parsedColumns} socials={parsedSocials} legalLinks={parsedLegalLinks} {copyright}>
    {#snippet brandContent()}<slot name="brand"></slot>{/snippet}
    <slot></slot>
  </AesirFooter>
{:else}
  <AesirFooter {variant} {label} {brand} {description} columns={parsedColumns} socials={parsedSocials} legalLinks={parsedLegalLinks} {copyright}>
    <slot></slot>
  </AesirFooter>
{/if}
