import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import Footer from '../src/components/aesir-footer/aesir-footer.svelte';

describe('AesirFooter', () => {
  test('renders navigation, legal links, and safe external-link attributes', () => {
    render(Footer, {
      label: 'Site footer',
      brand: 'Aesir',
      columns: [{ label: 'Product', links: [{ label: 'Components', href: '/components' }] }],
      legalLinks: [{ label: 'License', href: 'https://example.com/license', external: true }]
    });
    expect(screen.getByRole('contentinfo', { name: 'Site footer' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Components' }).getAttribute('href')).toBe('/components');
    const external = screen.getByRole('link', { name: 'License' });
    expect(external.getAttribute('target')).toBe('_blank');
    expect(external.getAttribute('rel')).toBe('noreferrer');
  });

  test('renders repeated column labels and link destinations without key collisions', () => {
    render(Footer, {
      columns: [
        {
          label: 'Resources',
          links: [
            { label: 'Docs', href: '/docs' },
            { label: 'Docs', href: '/docs' }
          ]
        },
        { label: 'Resources', links: [{ label: 'Docs', href: '/docs' }] }
      ],
      legalLinks: [
        { label: 'Terms', href: '/terms' },
        { label: 'Terms', href: '/terms' }
      ],
      socials: [
        { label: 'Community', href: '/community' },
        { label: 'Community', href: '/community' }
      ]
    });

    expect(screen.getAllByRole('heading', { name: 'Resources' })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'Docs' })).toHaveLength(3);
    expect(screen.getAllByRole('link', { name: 'Terms' })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'Community' })).toHaveLength(2);
  });
});
