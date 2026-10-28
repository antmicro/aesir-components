import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import Stepper from '../src/components/aesir-stepper/aesir-stepper.svelte';

test('reports only changes to the selected step', async () => {
  const user = userEvent.setup();
  const onchange = vi.fn();
  const items = [
    { value: 'intro', label: 'Introduction' },
    { value: 'review', label: 'Review' }
  ];

  render(Stepper, { items, value: 'review', onchange });

  await user.click(screen.getByRole('button', { name: /Review/ }));
  expect(onchange).not.toHaveBeenCalled();

  await user.click(screen.getByRole('button', { name: /Introduction/ }));
  expect(onchange).toHaveBeenCalledExactlyOnceWith(items[0]);

  await user.click(screen.getByRole('button', { name: /Introduction/ }));
  expect(onchange).toHaveBeenCalledExactlyOnceWith(items[0]);
});
