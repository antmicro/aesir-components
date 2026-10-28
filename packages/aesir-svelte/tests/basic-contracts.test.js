import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import Alert from '../src/components/aesir-alert/aesir-alert.svelte';
import EmptyState from '../src/components/aesir-empty-state/aesir-empty-state.svelte';
import Loader from '../src/components/aesir-loader/aesir-loader.svelte';
import Pagination from '../src/components/aesir-pagination/aesir-pagination.svelte';
import Progress from '../src/components/aesir-progress/aesir-progress.svelte';
import BasicContractsFixture from './fixtures/basic-contracts-fixture.svelte';

describe('Aesir basic component contracts', () => {
  test('renders alert defaults, destructive announcements, and forwarded attributes', () => {
    const { rerender } = render(Alert, { title: 'Saved', description: 'Your changes are live.', class: 'consumer-alert', 'data-testid': 'alert' });
    const alert = screen.getByTestId('alert');

    expect(alert.getAttribute('role')).toBe('status');
    expect(alert.classList.contains('consumer-alert')).toBe(true);
    expect(screen.getByText('Saved')).toBeTruthy();
    expect(screen.getByText('Your changes are live.')).toBeTruthy();

    rerender({ title: 'Save failed', description: undefined, variant: 'destructive', 'data-testid': 'alert' });
    expect(screen.getByTestId('alert').getAttribute('role')).toBe('alert');
    expect(screen.queryByText('Your changes are live.')).toBeNull();
  });

  test('allows an empty state to omit every optional region', () => {
    render(EmptyState, { size: 'sm', class: 'consumer-empty-state', 'data-testid': 'empty-state', 'aria-label': 'No results' });
    const emptyState = screen.getByRole('region', { name: 'No results' });

    expect(emptyState.classList.contains('consumer-empty-state')).toBe(true);
    expect(emptyState.dataset.size).toBe('sm');
    expect(emptyState.querySelector('h3')).toBeNull();
    expect(emptyState.querySelector('p')).toBeNull();
  });

  test('exposes loading status unless the loader is decorative', () => {
    const { rerender } = render(Loader, { label: 'Saving changes', size: 'sm', 'data-testid': 'loader' });
    expect(screen.getByRole('status', { name: 'Saving changes' })).toBeTruthy();
    expect(screen.getByTestId('loader').dataset.size).toBe('sm');

    rerender({ decorative: true, label: 'Ignored label', 'data-testid': 'loader' });
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByTestId('loader').getAttribute('aria-hidden')).toBe('true');
  });

  test('bounds progress values and omits determinate values while loading', () => {
    const formatter = vi.fn((value, max) => `${value} of ${max}`);
    const { rerender } = render(Progress, { value: 120, max: 80, label: 'Upload', showValue: true, formatValue: formatter, 'data-testid': 'progress' });
    const progress = screen.getByRole('progressbar', { name: 'Upload' });

    expect(progress.getAttribute('aria-valuenow')).toBe('80');
    expect(progress.getAttribute('aria-valuemax')).toBe('80');
    expect(progress.getAttribute('aria-valuetext')).toBe('80 of 80');
    expect(formatter).toHaveBeenCalledWith(80, 80);

    rerender({ label: 'Loading', indeterminate: true, 'data-testid': 'progress' });
    const loading = screen.getByRole('progressbar', { name: 'Loading' });
    expect(loading.hasAttribute('aria-valuenow')).toBe(false);
    expect(loading.hasAttribute('aria-valuetext')).toBe(false);
  });

  test('does not display a percentage while progress is indeterminate', async () => {
    const { rerender } = render(Progress, { value: 40, label: 'Upload', showValue: true });
    expect(screen.getByText('40%')).toBeTruthy();

    await rerender({ value: 40, label: 'Upload', showValue: true, indeterminate: true });
    expect(screen.queryByText('40%')).toBeNull();
    expect(screen.getByRole('progressbar', { name: 'Upload' }).hasAttribute('aria-valuenow')).toBe(false);

    await rerender({ value: 40, label: 'Upload', showValue: true, indeterminate: false });
    expect(screen.getByText('40%')).toBeTruthy();
  });

  test('passes the effective maximum to the progress formatter as props change', async () => {
    const formatter = vi.fn((value, max) => `${value} of ${max}`);
    const { rerender } = render(Progress, { value: 50, max: 0, label: 'Upload', showValue: true, formatValue: formatter });
    const progress = screen.getByRole('progressbar', { name: 'Upload' });

    expect(progress.getAttribute('aria-valuemax')).toBe('100');
    expect(progress.getAttribute('aria-valuenow')).toBe('50');
    expect(progress.getAttribute('aria-valuetext')).toBe('50 of 100');
    expect(formatter).toHaveBeenCalledWith(50, 100);

    await rerender({ value: 50, max: 40, label: 'Upload', showValue: true, formatValue: formatter });
    expect(progress.getAttribute('aria-valuemax')).toBe('40');
    expect(progress.getAttribute('aria-valuenow')).toBe('40');
    expect(progress.getAttribute('aria-valuetext')).toBe('40 of 40');
    expect(formatter).toHaveBeenLastCalledWith(40, 40);
  });

  test('treats non-finite progress values as zero', async () => {
    const { rerender } = render(Progress, { value: Infinity, label: 'Upload', showValue: true });
    const progress = screen.getByRole('progressbar', { name: 'Upload' });

    expect(progress.getAttribute('aria-valuenow')).toBe('0');
    expect(progress.getAttribute('aria-valuetext')).toBe('0%');

    await rerender({ value: NaN, label: 'Upload', showValue: true });
    expect(progress.getAttribute('aria-valuenow')).toBe('0');
  });

  test('forwards explicit accessibility labels and descriptions to the progressbar', async () => {
    const { rerender } = render(Progress, {
      value: 25,
      'aria-label': 'Background upload',
      'aria-describedby': 'upload-details'
    });
    const progress = screen.getByRole('progressbar', { name: 'Background upload' });

    expect(progress.getAttribute('aria-describedby')).toBe('upload-details');

    await rerender({ value: 50, 'aria-label': 'Document upload', 'aria-describedby': 'document-details' });
    expect(screen.getByRole('progressbar', { name: 'Document upload' })).toBe(progress);
    expect(progress.getAttribute('aria-describedby')).toBe('document-details');
  });

  test('changes pages once, ignores the current page, and disables all pagination controls when requested', async () => {
    const user = userEvent.setup();
    render(BasicContractsFixture);

    expect(screen.getByTestId('pagination').classList.contains('consumer-pagination')).toBe(true);
    const pagination = screen.getByRole('navigation', { name: 'Pagination' });
    await user.click(pagination.querySelector('[aria-label="Next page"]'));
    expect(screen.getByRole('status', { name: 'Current page' }).textContent).toBe('3');
    expect(screen.getByRole('status', { name: 'Page changes' }).textContent).toBe('1');

    await user.click(pagination.querySelector('[aria-label="Page 3"]'));
    expect(screen.getByRole('status', { name: 'Page changes' }).textContent).toBe('1');

    const disabledPagination = screen.getByRole('navigation', { name: 'Disabled pagination' });
    expect([...disabledPagination.querySelectorAll('button')].every((button) => button.disabled)).toBe(true);
  });

  test('clamps pagination display when total pages shrink and handles the single-page boundary', async () => {
    const { rerender } = render(Pagination, { page: 5, totalPages: 8, label: 'Dynamic pagination' });
    expect(screen.getByRole('button', { name: 'Page 5' }).getAttribute('aria-current')).toBe('page');

    await rerender({ page: 5, totalPages: 2, label: 'Dynamic pagination' });
    expect(screen.getByRole('button', { name: 'Page 2' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: 'Next page' }).disabled).toBe(true);

    await rerender({ page: 1, totalPages: 0, label: 'Dynamic pagination' });
    expect(screen.getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: 'Previous page' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Next page' }).disabled).toBe(true);
  });

  test('keeps the current page visible when sibling count is fractional or negative', async () => {
    const { rerender } = render(Pagination, { page: 5, totalPages: 10, siblingCount: 1.5 });
    expect(screen.getByRole('button', { name: 'Page 5' }).getAttribute('aria-current')).toBe('page');
    expect(screen.queryByRole('button', { name: 'Page 4.5' })).toBeNull();

    await rerender({ page: 5, totalPages: 10, siblingCount: -2 });
    expect(screen.getByRole('button', { name: 'Page 5' }).getAttribute('aria-current')).toBe('page');
  });

  test('falls back to finite page bounds and sibling count', async () => {
    const { rerender } = render(Pagination, { page: Infinity, totalPages: Infinity, siblingCount: Infinity });
    expect(screen.getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: 'Next page' }).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Page Infinity' })).toBeNull();

    await rerender({ page: 5, totalPages: 8, siblingCount: Infinity });
    expect(screen.getByRole('button', { name: 'Page 5' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: 'Page 4' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Page 6' })).toBeTruthy();
  });

  test('keeps linear stepper choices within the allowed range and reports real changes only', async () => {
    const user = userEvent.setup();
    render(BasicContractsFixture);
    const stepper = screen.getByTestId('stepper');

    expect(stepper.dataset.orientation).toBe('vertical');
    expect(screen.getByRole('button', { name: /Configure project/ }).getAttribute('aria-current')).toBe('step');
    expect(screen.getByRole('button', { name: /Deploy project/ }).disabled).toBe(true);

    await user.click(screen.getByRole('button', { name: /Deploy project/ }));
    expect(screen.getByRole('status', { name: 'Current step' }).textContent).toBe('configure');
    expect(screen.getByRole('status', { name: 'Step changes' }).textContent).toBe('0');

    await user.click(screen.getByRole('button', { name: /Create project/ }));
    expect(screen.getByRole('status', { name: 'Current step' }).textContent).toBe('create');
    expect(screen.getByRole('status', { name: 'Step changes' }).textContent).toBe('1');
  });

  test('binds valid slider input and keeps disabled sliders out of interaction', async () => {
    const user = userEvent.setup();
    render(BasicContractsFixture);
    const slider = screen.getByRole('slider', { name: /^Volume/ });
    const disabledSlider = screen.getByRole('slider', { name: /^Disabled volume/ });

    expect(slider.getAttribute('min')).toBe('0');
    expect(slider.getAttribute('max')).toBe('10');
    expect(slider.getAttribute('step')).toBe('2');
    await fireEvent.input(slider, { target: { value: '8' } });
    expect(screen.getByRole('status', { name: 'Volume value' }).textContent).toBe('8');

    expect(disabledSlider.disabled).toBe(true);
    await user.tab();
    expect(document.activeElement).not.toBe(disabledSlider);
  });
});
