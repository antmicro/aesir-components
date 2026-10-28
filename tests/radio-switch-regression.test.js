import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import Switch from '../src/components/aesir-switch/aesir-switch.svelte';

test('clicking a switch description toggles the control without adding to its name', async () => {
  const user = userEvent.setup();
  render(Switch, { label: 'Incident alerts', description: 'Notify the on-call team.' });
  const control = screen.getByRole('switch', { name: 'Incident alerts', description: 'Notify the on-call team.' });
  const description = screen.getByText('Notify the on-call team.');

  expect(control.getAttribute('aria-describedby')).toBe(description.id);
  await user.click(description);

  expect(control.checked).toBe(true);
  expect(screen.getByRole('switch', { name: 'Incident alerts', description: 'Notify the on-call team.' })).toBe(control);
});
