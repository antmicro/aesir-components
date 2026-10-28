import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test, vi } from 'vitest';
import Pagination from '../../src/components/aesir-pagination/aesir-pagination.svelte';
import { applyTheme } from './setup.js';

test('keeps the selected page button focused when its list position changes', async () => {
  await render(Pagination, { page: 4, totalPages: 10, siblingCount: 1 });
  const lastPage = page.getByRole('button', { name: 'Page 10' });
  const originalElement = lastPage.element();

  await lastPage.click();

  expect(lastPage.element()).toBe(originalElement);
  await expect.element(lastPage).toHaveAttribute('aria-current', 'page');
  await expect.element(lastPage).toHaveFocus();
});

test('fits large page numbers inside their controls after the range grows', async () => {
  applyTheme('light');
  const rendered = await render(Pagination, { page: 9, totalPages: 9 });

  await rendered.rerender({ page: 99999, totalPages: 100000 });

  for (const button of page.getByRole('navigation', { name: 'Pagination' }).element().querySelectorAll('.aesir-pagination__pages button')) {
    expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth);
  }
});

test('keeps navigation and the current page visible in a narrow container after the range grows', async () => {
  applyTheme('light');
  const rendered = await render(Pagination, { page: 2, totalPages: 3, siblingCount: 2 });
  rendered.container.style.width = '240px';

  await rendered.rerender({ page: 10, totalPages: 20, siblingCount: 2 });

  const navigation = page.getByRole('navigation', { name: 'Pagination' }).element();
  const pages = navigation.querySelector('.aesir-pagination__pages');
  const expectCurrentVisible = () => {
    const current = navigation.querySelector('[aria-current="page"]');
    const containerBounds = rendered.container.getBoundingClientRect();
    const navigationBounds = navigation.getBoundingClientRect();
    const pagesBounds = pages.getBoundingClientRect();
    const currentBounds = current.getBoundingClientRect();

    expect(navigationBounds.right).toBeLessThanOrEqual(containerBounds.right + 1);
    expect(pages.scrollWidth).toBeGreaterThan(pages.clientWidth);
    expect(currentBounds.left).toBeGreaterThanOrEqual(pagesBounds.left - 1);
    expect(currentBounds.right).toBeLessThanOrEqual(pagesBounds.right + 1);
    expect(navigation.lastElementChild.getBoundingClientRect().right).toBeLessThanOrEqual(containerBounds.right + 1);
  };

  await vi.waitFor(expectCurrentVisible);
  rendered.container.style.width = '180px';
  await vi.waitFor(expectCurrentVisible);
});
