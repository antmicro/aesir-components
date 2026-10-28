import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import Breadcrumb from '../src/components/aesir-breadcrumb/aesir-breadcrumb.svelte';

describe('AesirBreadcrumb', () => {
  test('links intermediate items and marks the final item as current', () => {
    render(Breadcrumb, { label: 'Project path', items: [{ label: 'Projects', href: '/projects' }, { label: 'Aesir' }] });
    expect(screen.getByRole('navigation', { name: 'Project path' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Projects' }).getAttribute('href')).toBe('/projects');
    expect(screen.getByText('Aesir').getAttribute('aria-current')).toBe('page');
  });

  test('marks only the final item as current when an intermediate item has no link', () => {
    const { container } = render(Breadcrumb, { items: [{ label: 'Projects' }, { label: 'Workspace', href: '/workspace' }, { label: 'Overview' }] });

    expect(screen.getByText('Projects').hasAttribute('aria-current')).toBe(false);
    expect(screen.getByText('Overview').getAttribute('aria-current')).toBe('page');
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });
});
