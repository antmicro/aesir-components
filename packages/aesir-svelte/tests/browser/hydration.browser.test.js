import { hydrate, unmount } from 'svelte';
import { page } from 'vitest/browser';
import { afterEach, describe, expect, test } from 'vitest';
import HydrationFixture from '../fixtures/hydration-fixture.svelte';
import { hydrationMarkup } from '../fixtures/hydration-markup.js';

let instance;
let target;

afterEach(async () => {
  if (instance) await unmount(instance);
  target?.remove();
  instance = undefined;
  target = undefined;
});

describe('server markup hydration in a browser', () => {
  test('reuses SSR nodes and attaches all component interactions', async () => {
    target = document.createElement('div');
    target.innerHTML = hydrationMarkup;
    document.body.append(target);
    const buttonBefore = target.querySelector('[data-slot="aesir-button"]');
    const checkboxBefore = target.querySelector('input[type="checkbox"]');

    instance = hydrate(HydrationFixture, { target });

    expect(target.querySelector('[data-slot="aesir-button"]')).toBe(buttonBefore);
    expect(target.querySelector('input[type="checkbox"]')).toBe(checkboxBefore);
    expect(target.querySelectorAll('[data-slot="aesir-button"]')).toHaveLength(1);

    await page.getByRole('button', { name: 'Hydrated action' }).click();
    await page.getByText('Hydrated checkbox', { exact: true }).click();
    await page.getByRole('button', { name: 'Hydrated disclosure' }).click();
    await page.getByRole('tab', { name: 'Activity' }).click();

    await expect.element(page.getByRole('status', { name: 'Hydrated activations' })).toHaveTextContent('1');
    await expect.element(page.getByRole('status', { name: 'Hydrated checkbox state' })).toHaveTextContent('checked');
    await expect.element(page.getByRole('status', { name: 'Hydrated disclosure state' })).toHaveTextContent('open');
    await expect.element(page.getByRole('status', { name: 'Hydrated tab state' })).toHaveTextContent('activity');
  });
});
