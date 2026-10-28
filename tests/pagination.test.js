import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import Pagination from '../src/components/aesir-pagination/aesir-pagination.svelte';
import PaginationDynamicFixture from './fixtures/pagination-dynamic-fixture.svelte';

describe('AesirPagination', () => {
  test('shows a single skipped page as a button at either end', async () => {
    const onpagechange = vi.fn();
    const { rerender } = render(Pagination, { page: 4, totalPages: 7, siblingCount: 1, onpagechange });
    const navigation = screen.getByRole('navigation', { name: 'Pagination' });

    expect(screen.getByRole('button', { name: 'Page 2' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Page 6' })).toBeTruthy();
    expect(navigation.querySelectorAll('.aesir-pagination__ellipsis')).toHaveLength(0);

    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(onpagechange).toHaveBeenCalledExactlyOnceWith(2);

    await rerender({ page: 3, totalPages: 7, siblingCount: 1, onpagechange });
    expect(navigation.querySelectorAll('.aesir-pagination__ellipsis')).toHaveLength(1);
  });

  test('keeps a visible page button mounted when its position in the list changes', async () => {
    render(Pagination, { page: 4, totalPages: 10, siblingCount: 1 });
    const lastPage = screen.getByRole('button', { name: 'Page 10' });

    await userEvent.click(lastPage);

    expect(screen.getByRole('button', { name: 'Page 10' })).toBe(lastPage);
    expect(document.activeElement).toBe(lastPage);
    expect(lastPage.getAttribute('aria-current')).toBe('page');
  });

  test('clamps the bound page when the total shrinks and does not jump back after it grows', async () => {
    const user = userEvent.setup();
    render(PaginationDynamicFixture);

    await user.click(screen.getByRole('button', { name: 'Shrink to five pages' }));
    expect(screen.getByRole('button', { name: 'Page 5' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('status', { name: 'Bound page' }).textContent).toBe('5');

    await user.click(screen.getByRole('button', { name: 'Grow to ten pages' }));
    expect(screen.getByRole('button', { name: 'Page 5' }).getAttribute('aria-current')).toBe('page');
  });
});
