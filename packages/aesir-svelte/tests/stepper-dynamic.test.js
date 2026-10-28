import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import Stepper from '../src/components/aesir-stepper/aesir-stepper.svelte';

const steps = [
  { value: 'intro', label: 'Introduction', disabled: true },
  { value: 'configure', label: 'Configure' },
  { value: 'review', label: 'Review' }
];

test('starts a linear flow at the first enabled step', async () => {
  const user = userEvent.setup();
  const onchange = vi.fn();
  render(Stepper, { items: steps, linear: true, onchange });

  const intro = screen.getByRole('button', { name: /Introduction/ });
  const configure = screen.getByRole('button', { name: /Configure/ });
  const review = screen.getByRole('button', { name: /Review/ });

  expect(intro.disabled).toBe(true);
  expect(intro.closest('li').dataset.state).toBe('upcoming');
  expect(intro.textContent).toContain('Pending');
  expect(configure.disabled).toBe(false);
  expect(configure.getAttribute('aria-current')).toBe('step');
  expect(review.disabled).toBe(true);

  await user.click(configure);
  expect(onchange).toHaveBeenCalledExactlyOnceWith(steps[1]);
});

test('moves the visual current step when the selected step is disabled or removed', async () => {
  const { rerender } = render(Stepper, { items: steps, value: 'review' });
  expect(screen.getByRole('button', { name: /Review/ }).getAttribute('aria-current')).toBe('step');

  await rerender({ items: [{ ...steps[0] }, steps[1], { ...steps[2], disabled: true }], value: 'review' });
  expect(screen.getByRole('button', { name: /Configure/ }).getAttribute('aria-current')).toBe('step');
  expect(screen.getByRole('button', { name: /Review/ }).getAttribute('aria-current')).toBeNull();

  await rerender({ items: steps.filter((step) => step.value !== 'review'), value: 'review' });
  expect(screen.getByRole('button', { name: /Configure/ }).getAttribute('aria-current')).toBe('step');
});

test('marks no disabled step as current when none can be selected', () => {
  render(Stepper, { items: steps.map((step) => ({ ...step, disabled: true })), linear: true });

  expect(screen.getAllByRole('button').every((button) => button.disabled)).toBe(true);
  expect(screen.getAllByRole('button').every((button) => !button.hasAttribute('aria-current'))).toBe(true);
});

test('still marks preceding steps complete when the selected value exists', () => {
  render(Stepper, { items: steps.map((step) => ({ ...step, disabled: false })), value: 'review' });

  const intro = screen.getByRole('button', { name: /Introduction/ });
  const configure = screen.getByRole('button', { name: /Configure/ });
  const review = screen.getByRole('button', { name: /Review/ });
  expect(intro.closest('li').dataset.state).toBe('complete');
  expect(configure.closest('li').dataset.state).toBe('complete');
  expect(review.getAttribute('aria-current')).toBe('step');
});

test('removes completed state when an earlier step becomes disabled', async () => {
  const { rerender } = render(Stepper, { items: steps.map((step) => ({ ...step, disabled: false })), value: 'review' });

  const intro = screen.getByRole('button', { name: /Introduction/ });
  const configure = screen.getByRole('button', { name: /Configure/ });
  expect(intro.closest('li').dataset.state).toBe('complete');

  await rerender({ items: steps, value: 'review' });
  expect(intro.disabled).toBe(true);
  expect(intro.closest('li').dataset.state).toBe('upcoming');
  expect(intro.textContent).toContain('Pending');
  expect(configure.closest('li').dataset.state).toBe('complete');
});
