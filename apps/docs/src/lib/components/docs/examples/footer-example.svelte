<script>
  import { AesirFooter, AesirIcon } from '@aesir/svelte';

  const columns = [
    {
      label: 'Product',
      id: 'footer-product',
      links: [
        { label: 'Components', href: '/docs/' },
        { label: 'Patterns', href: '/docs/' },
        { label: 'Tokens', href: '/docs/' }
      ]
    },
    {
      label: 'Resources',
      id: 'footer-resources',
      links: [
        { label: 'Documentation', href: '/docs/' },
        { label: 'Examples', href: '/docs/' },
        { label: 'Releases', href: '/docs/' }
      ]
    },
    {
      label: 'Company',
      id: 'footer-company',
      links: [
        { label: 'About', href: '/docs/' },
        { label: 'Careers', href: '/docs/' },
        { label: 'Contact', href: '/docs/' }
      ]
    }
  ];
  const socials = [
    { label: 'Source code', href: 'https://github.com/', icon: 'git-pull-request', external: true },
    { label: 'Community', href: '/docs/', icon: 'users' },
    { label: 'Email', href: 'mailto:hello@example.com', icon: 'mail' }
  ];
  const legalLinks = [
    { label: 'Privacy', href: '/docs/' },
    { label: 'Terms', href: '/docs/' }
  ];
</script>

<div class="footer-examples">
  <AesirFooter brand="Aesir" description="Interfaces for products built with care." {columns} {socials} {legalLinks} copyright="© 2026 Aesir">
    {#snippet brandContent()}<span class="brand"><AesirIcon name="hexagon" />Aesir</span>{/snippet}
  </AesirFooter>
  <AesirFooter variant="compact" brand="Aesir" description="A tighter version of grouped navigation." {columns} copyright="© 2026 Aesir" />
  <AesirFooter variant="minimal" brand="Aesir" {socials} {legalLinks} copyright="© 2026 Aesir" />
</div>

<style>
  .footer-examples {
    display: grid;
    width: 100%;
    gap: var(--ds-spacing-8);
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-spacing-2);
    font-weight: var(--ds-font-weight-medium);
  }
  .brand :global(svg) {
    width: var(--ds-spacing-5);
    height: var(--ds-spacing-5);
  }
</style>
