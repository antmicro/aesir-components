import '../../dist/aesir-html.min.js';
import { page } from 'vitest/browser';
import { afterEach, expect, test, vi } from 'vitest';
import { mount } from './test-utils.js';

afterEach(() => document.body.replaceChildren());

test.each(['single', 'multiple'])('toggle group synchronizes slotted toggles in %s mode', async (type) => {
  await mount(`
    <aesir-toggle-group type="${type}" value="one" variant="outline" size="sm">
      <aesir-toggle value="one">One</aesir-toggle>
      <aesir-toggle value="two">Two</aesir-toggle>
    </aesir-toggle-group>
  `);
  const group = document.querySelector('aesir-toggle-group');
  const [one, two] = group.querySelectorAll('aesir-toggle');
  const onChange = vi.fn();
  group.addEventListener('value-change', onChange);

  await expect.element(page.getByRole('button', { name: 'One', exact: true })).toHaveAttribute('aria-pressed', 'true');
  for (const toggle of [one, two]) {
    expect(toggle.variant).toBe('outline');
    expect(toggle.size).toBe('sm');
  }

  await page.getByRole('button', { name: 'Two', exact: true }).click();
  const selectedValue = type === 'single' ? 'two' : 'one,two';
  await expect.poll(() => group.value).toBe(selectedValue);
  expect(onChange).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ detail: { value: selectedValue } }));

  group.value = 'one';
  await expect.element(page.getByRole('button', { name: 'Two', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect.element(page.getByRole('button', { name: 'One', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(onChange).toHaveBeenCalledOnce();
});
