import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { settleCustomElement } from './setup.js';
import { checkDropdownFocusReturn, checkModalMenus, checkSlottedDialogAndTooltip, checkTriggerStates } from './overlay-accessibility.js';
import { checkDisabledClickContract, disabledElementTags } from './disabled-contract.js';
import {
  checkAttributeTypesAndUpdates,
  checkCustomEventDetail,
  checkIndependentInstances,
  checkKebabCaseAttributes,
  checkNativeFormIntegration,
  checkPublicElementLifecycles,
  checkRepresentativeFlows,
  checkUnmountCleanup
} from './public-boundary-contracts.js';

const componentDirectory = resolve(process.cwd(), 'dist/components');
const elementsUrl = resolve(process.cwd(), 'src/elements');
const componentUrl = (name) => pathToFileURL(resolve(componentDirectory, `${name}.min.js`)).href;
const importComponent = (name) => import(/* @vite-ignore */ componentUrl(name));

beforeAll(async () => {
  await Promise.all(['aesir-button', 'aesir-checkbox', 'aesir-dialog', 'aesir-dropdown', 'aesir-field', 'aesir-input', 'aesir-native-select', 'aesir-quantity-stepper'].map(importComponent));
});

describe('modular HTML distribution', () => {
  test('registers only the imported component', () => {
    expect(customElements.get('aesir-button')).toBeTypeOf('function');
    expect(customElements.get('aesir-empty-state')).toBeUndefined();
  });

  test('loads every component against the shared runtime', async () => {
    const components = (await readdir(componentDirectory)).filter((file) => file.endsWith('.min.js')).map((file) => file.replace(/\.min\.js$/, ''));

    await Promise.all(components.map(importComponent));

    expect(customElements.get('aesir-checkbox')).toBeTypeOf('function');
    expect(customElements.get('aesir-empty-state')).toBeTypeOf('function');
    for (const tag of components) expect(customElements.get(tag), `${tag} is not registered`).toBeTypeOf('function');
  });

  test('mounts, disconnects, and reconnects every modular component', async () => {
    const components = (await readdir(componentDirectory)).filter((file) => file.endsWith('.min.js')).map((file) => file.replace(/\.min\.js$/, ''));
    await Promise.all(components.map(importComponent));
    await checkPublicElementLifecycles(components);
  });

  test('maps typed attributes and reacts to updates after mount', checkAttributeTypesAndUpdates);
  test('maps multi-word properties from kebab-case HTML attributes', checkKebabCaseAttributes);
  test('emits public Custom Events with useful detail', checkCustomEventDetail);
  test('keeps slotted native controls integrated with forms', checkNativeFormIntegration);
  test('keeps multiple component instances independent', checkIndependentInstances);
  test('supports representative input, select, and dialog flows', checkRepresentativeFlows);
  test('cleans up overlays and trigger attributes when unmounted', checkUnmountCleanup);

  test('renders a standalone modular component', async () => {
    const button = document.createElement('aesir-button');
    button.setAttribute('variant', 'accent');
    button.textContent = 'Continue';
    await settleCustomElement(button);

    const nativeButton = button.shadowRoot?.querySelector('button');
    expect(nativeButton?.querySelector('slot')).not.toBeNull();
    expect(button.textContent).toBe('Continue');
    expect(nativeButton?.dataset.variant).toBe('accent');
  });

  test('does not programmatically activate disabled components', async () => {
    const button = document.createElement('aesir-button');
    button.disabled = true;
    await settleCustomElement(button);

    const onClick = vi.fn();
    button.addEventListener('click', onClick);
    button.click();

    expect(onClick).not.toHaveBeenCalled();
  });

  test('enforces disabled click behavior in every protected component module', async () => {
    const tags = await disabledElementTags(elementsUrl);
    await Promise.all(tags.map(importComponent));
    await checkDisabledClickContract(tags);
  });

  test('keeps a toggle disabled if it is re-enabled while its group is disabled', async () => {
    await importComponent('aesir-toggle-group');
    await importComponent('aesir-toggle');
    const group = document.createElement('aesir-toggle-group');
    group.innerHTML = '<aesir-toggle value="one">One</aesir-toggle>';
    group.disabled = true;
    await settleCustomElement(group);
    const toggle = group.querySelector('aesir-toggle');

    await vi.waitFor(() => expect(toggle.disabled).toBe(true));
    toggle.disabled = false;
    await vi.waitFor(() => expect(toggle.disabled).toBe(true));
    toggle.click();
    expect(toggle.pressed).toBe(false);

    group.disabled = false;
    await vi.waitFor(() => expect(toggle.disabled).toBe(false));
    toggle.shadowRoot.querySelector('button').click();
    await vi.waitFor(() => expect(group.value).toBe('one'));
  });

  test('preserves slotted modal tab order and names the actual tooltip trigger', checkSlottedDialogAndTooltip);
  test('forwards popup states to the slotted controls', checkTriggerStates);
  test('returns dropdown focus to native and shadow-DOM triggers on Escape', checkDropdownFocusReturn);
  test('blocks modal menu clicks by default and supports HTML and JavaScript opt-outs', checkModalMenus);

  test('coordinates tooltip and dialog layers across independent component bundles', async () => {
    const dialog = document.createElement('aesir-dialog');
    dialog.open = true;
    dialog.innerHTML = '<aesir-tooltip content="Dialog help" delay="0"><button>Help</button></aesir-tooltip>';
    await settleCustomElement(dialog);
    const tooltip = dialog.querySelector('aesir-tooltip');
    await vi.waitFor(() => expect(tooltip.shadowRoot?.querySelector('.aesir-tooltip__anchor > span')).toBeTruthy());
    tooltip.shadowRoot.querySelector('.aesir-tooltip__anchor > span').dispatchEvent(new MouseEvent('mouseenter'));
    await vi.waitFor(() => expect(tooltip.shadowRoot.querySelector('[role="tooltip"]')?.textContent).toBe('Dialog help'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(tooltip.shadowRoot.querySelector('[role="tooltip"][data-state="open"]')).toBeNull());
    expect(dialog.open).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(dialog.open).toBe(false));
  });
});
