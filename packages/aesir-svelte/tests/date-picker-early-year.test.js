import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { AesirDatePicker } from '../src/index.js';

test.each(['0001-03-15', '0099-03-15'])('opens the calendar at the selected early-year date %s', async (value) => {
  const user = userEvent.setup();
  render(AesirDatePicker, { label: 'Historical date', value, locale: 'en-US' });

  await user.click(screen.getByRole('button', { name: 'Historical date' }));

  const calendar = screen.getByRole('dialog', { name: 'Choose date' });
  const selectedDate = calendar.querySelector(`[data-date="${value}"]`);
  expect(selectedDate).toBeTruthy();
  expect(selectedDate.getAttribute('aria-pressed')).toBe('true');
});
