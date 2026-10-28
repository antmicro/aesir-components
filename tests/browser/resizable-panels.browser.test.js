import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import AesirResizablePanels from '../../src/components/aesir-resizable-panels/aesir-resizable-panels.svelte';

test('resizable panels use the current container width during a drag', async () => {
  await render(AesirResizablePanels, { size: 50, label: 'Resize workspace' });
  const separator = page.getByRole('separator', { name: 'Resize workspace' });
  const handle = separator.element();
  const root = handle.closest('.aesir-resizable-panels');
  root.style.width = '200px';
  root.style.height = '100px';
  handle.setPointerCapture = () => {};
  const pointer = (type, clientX) => handle.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, clientX, button: 0 }));

  pointer('pointerdown', 100);
  pointer('pointermove', 120);
  await expect.element(separator).toHaveAttribute('aria-valuenow', '60');

  root.style.width = '400px';
  expect(root.getBoundingClientRect().width).toBe(400);
  pointer('pointermove', 140);
  await expect.element(separator).toHaveAttribute('aria-valuenow', '65');
});
