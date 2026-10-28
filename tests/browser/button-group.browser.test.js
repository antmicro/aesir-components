import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import Fixture from '../fixtures/presentational-components-fixture.svelte';
import { applyTheme } from './setup.js';

test('group size normalizes the height of its default-sized buttons', async () => {
  applyTheme('light');
  await render(Fixture);

  const group = page.getByRole('group', { name: 'Actions' }).element();
  const buttons = [...group.querySelectorAll('button')];
  const targetHeight = Number.parseFloat(getComputedStyle(group).getPropertyValue('--aesir-button-group-height'));

  expect(targetHeight).toBeGreaterThan(0);
  expect(buttons).toHaveLength(2);
  for (const button of buttons) {
    expect(button.getBoundingClientRect().height).toBe(targetHeight);
  }
});
