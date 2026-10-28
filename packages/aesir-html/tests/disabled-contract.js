import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, vi } from 'vitest';
import { settleCustomElement } from './setup.js';

export async function disabledElementTags(sourceDirectory) {
  const sources = await Promise.all(
    (await readdir(sourceDirectory))
      .filter((file) => file.endsWith('.svelte'))
      .map(async (file) => ({
        tag: file.replace(/\.svelte$/, ''),
        source: await readFile(resolve(sourceDirectory, file), 'utf8')
      }))
  );

  const protectedTags = sources.filter(({ source }) => source.includes('blockDisabledClick(')).map(({ tag }) => tag);
  const nonInteractiveDisabledProps = new Set([
    'aesir-field', // Propagates disabled to its slotted form controls.
    'aesir-portal', // Uses disabled to control portalling, not interaction.
    'aesir-tooltip' // Disables the hint, not the action owned by its slotted trigger.
  ]);
  const unprotectedTags = sources
    .filter(({ tag, source }) => {
      const options = source.match(/<svelte:options[\s\S]*?<\/svelte:options>/)?.[0] ?? source.match(/<svelte:options[^>]*\/>/)?.[0] ?? '';
      return /disabled\s*:/.test(options) && !protectedTags.includes(tag) && !nonInteractiveDisabledProps.has(tag);
    })
    .map(({ tag }) => tag);

  expect(unprotectedTags, 'interactive Custom Elements with a reflected disabled prop must block host and Shadow DOM clicks').toEqual([]);
  return protectedTags;
}

export async function checkDisabledClickContract(tags) {
  expect(tags.length).toBeGreaterThan(15);

  for (const tag of tags) {
    const element = document.createElement(tag);
    element.disabled = true;
    await settleCustomElement(element);

    const onClick = vi.fn();
    element.addEventListener('click', onClick);
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));

    const shadowControl = element.shadowRoot?.querySelector('button, a, input, select, textarea, [role="button"]');
    shadowControl?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
    expect(onClick, `${tag} forwarded a click while disabled`).not.toHaveBeenCalled();

    element.disabled = false;
    await Promise.resolve();
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
    expect(onClick, `${tag} stayed inert after being enabled`).toHaveBeenCalledOnce();

    element.remove();
  }
}
