import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import AesirButton from '../../src/components/aesir-button/aesir-button.svelte';

test('an empty href remains a link in the browser', async () => {
  await render(AesirButton, { href: '', 'aria-label': 'Current page' });

  await expect.element(page.getByRole('link', { name: 'Current page' })).toHaveAttribute('href', '');
});
