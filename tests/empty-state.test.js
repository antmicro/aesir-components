import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import EmptyState from '../src/components/aesir-empty-state/aesir-empty-state.svelte';
import EmptyStateFixture from './fixtures/empty-state-fixture.svelte';

describe('AesirEmptyState', () => {
  test('only renders the copy region while it has content', async () => {
    const { rerender } = render(EmptyState, {
      title: 'No results',
      description: 'Try another search.',
      'data-testid': 'empty-state'
    });
    const emptyState = screen.getByTestId('empty-state');

    expect(emptyState.querySelector('.aesir-empty-state__copy')?.textContent).toContain('No results');

    await rerender({ title: undefined, description: undefined, 'data-testid': 'empty-state' });
    expect(emptyState.querySelector('.aesir-empty-state__copy')).toBeNull();

    await rerender({ description: 'Try another search.', 'data-testid': 'empty-state' });
    expect(emptyState.querySelector('.aesir-empty-state__copy')?.textContent).toContain('Try another search.');
  });

  test('keeps actions independent from copy and renders custom children without title text', () => {
    render(EmptyStateFixture);

    const actionsOnly = screen.getByTestId('actions-only');
    expect(actionsOnly.querySelector('.aesir-empty-state__copy')).toBeNull();
    expect(screen.getByRole('button', { name: 'Create project' })).toBeTruthy();

    const customCopy = screen.getByTestId('custom-copy');
    expect(customCopy.querySelector('.aesir-empty-state__copy')?.textContent).toContain('Nothing here yet');
  });
});
