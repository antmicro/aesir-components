import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import ToggleGroupRequiredFixture from '../fixtures/toggle-group-required-fixture.svelte';

test('a required toggle group keeps its selection on a repeated click', async () => {
  await render(ToggleGroupRequiredFixture);
  const alpha = page.getByRole('button', { name: 'Alpha' });
  const beta = page.getByRole('button', { name: 'Beta' });
  const changes = page.getByRole('status', { name: 'Selection changes' });

  await alpha.click();
  await expect.element(alpha).toHaveAttribute('aria-pressed', 'true');
  await expect.element(changes).toHaveTextContent('0');

  await beta.click();
  await expect.element(beta).toHaveAttribute('aria-pressed', 'true');
  await expect.element(alpha).toHaveAttribute('aria-pressed', 'false');
  await expect.element(changes).toHaveTextContent('1');
});

test('a CSS length passed as spacing sets the group gap', async () => {
  await render(ToggleGroupRequiredFixture, { spacing: '1rem' });
  const group = page.getByRole('group', { name: 'Required choice' }).element();

  expect(getComputedStyle(group).gap).toBe(getComputedStyle(document.documentElement).fontSize);
});
