import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import DrawerFixture from '../fixtures/drawer-fixture.svelte';

test('drawer backdrop dismisses only on a primary press', async () => {
  await render(DrawerFixture);
  await page.getByRole('button', { name: 'Open details' }).click();
  await expect.element(page.getByRole('dialog', { name: 'Project details' })).toBeInTheDocument();

  const backdrop = page.getByRole('presentation');
  const position = { x: window.innerWidth - 2, y: 2 };
  await backdrop.click({ button: 'right', position });
  await expect.element(page.getByRole('dialog', { name: 'Project details' })).toBeInTheDocument();

  await backdrop.click({ position });
  await expect.element(page.getByRole('status', { name: 'Drawer state' })).toHaveTextContent('closed');
});
