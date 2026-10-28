import { readdir } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
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

const bundlePath = resolve(process.cwd(), 'dist/aesir-html.min.js');
const elementsUrl = resolve(process.cwd(), 'src/elements');

beforeAll(async () => {
  const source = await readFile(bundlePath, 'utf8');
  await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
});

describe('all-in-one HTML bundle', () => {
  test('maps typed attributes and reacts to updates after mount', checkAttributeTypesAndUpdates);
  test('maps multi-word properties from kebab-case HTML attributes', checkKebabCaseAttributes);
  test('emits public Custom Events with useful detail', checkCustomEventDetail);
  test('keeps slotted native controls integrated with forms', checkNativeFormIntegration);
  test('keeps multiple component instances independent', checkIndependentInstances);
  test('supports representative input, select, and dialog flows', checkRepresentativeFlows);
  test('cleans up overlays and trigger attributes when unmounted', checkUnmountCleanup);
  test('returns dropdown focus to native and shadow-DOM triggers on Escape', checkDropdownFocusReturn);
  test('blocks modal menu clicks by default and supports HTML and JavaScript opt-outs', checkModalMenus);
  test('forwards popup states to the slotted controls', checkTriggerStates);
  test('preserves slotted modal tab order and names the actual tooltip trigger', checkSlottedDialogAndTooltip);
  test('opens slotted tooltips inside dialogs and dismisses them before the dialog', async () => {
    const dialog = document.createElement('aesir-dialog');
    dialog.title = 'Help dialog';
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

  test('registers every public Custom Element', async () => {
    const tags = (await readdir(elementsUrl)).filter((file) => file.endsWith('.svelte')).map((file) => file.replace(/\.svelte$/, ''));

    expect(tags.length).toBeGreaterThan(50);
    for (const tag of tags) expect(customElements.get(tag), `${tag} is not registered`).toBeTypeOf('function');
  });

  test('mounts, disconnects, and reconnects every public Custom Element', async () => {
    const tags = (await readdir(elementsUrl)).filter((file) => file.endsWith('.svelte')).map((file) => file.replace(/\.svelte$/, ''));
    await checkPublicElementLifecycles(tags);
  });

  test('renders attributes and slots through the Custom Element boundary', async () => {
    const element = document.createElement('aesir-empty-state');
    element.setAttribute('empty-state-title', 'No projects yet');
    element.setAttribute('description', 'Create your first project.');
    element.innerHTML = '<span slot="icon">+</span><button slot="actions">Create project</button>';

    await settleCustomElement(element);

    expect(element.shadowRoot?.querySelector('h3')?.textContent).toBe('No projects yet');
    expect(element.shadowRoot?.querySelector('p')?.textContent).toBe('Create your first project.');
    expect(element.querySelector('[slot="icon"]')).not.toBeNull();
    expect(element.querySelector('[slot="actions"]')).not.toBeNull();
  });

  test('reflects boolean properties and forwards interaction events', async () => {
    const button = document.createElement('aesir-button');
    button.textContent = 'Save';
    button.disabled = true;
    await settleCustomElement(button);

    expect(button.hasAttribute('disabled')).toBe(true);
    const nativeButton = button.shadowRoot?.querySelector('button');
    expect(nativeButton?.disabled).toBe(true);

    const onDisabledClick = vi.fn();
    button.addEventListener('click', onDisabledClick);
    button.click();
    expect(onDisabledClick).not.toHaveBeenCalled();

    button.disabled = false;
    await Promise.resolve();
    const onClick = vi.fn();
    button.addEventListener('click', onClick);
    nativeButton?.click();

    expect(button.hasAttribute('disabled')).toBe(false);
    expect(onClick).toHaveBeenCalledOnce();
  });

  test('blocks direct clicks on other disabled controls and resumes after enabling', async () => {
    const toggle = document.createElement('aesir-toggle');
    toggle.disabled = true;
    await settleCustomElement(toggle);

    const onClick = vi.fn();
    toggle.addEventListener('click', onClick);
    toggle.click();
    expect(onClick).not.toHaveBeenCalled();

    toggle.disabled = false;
    await Promise.resolve();
    toggle.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  test('enforces disabled click behavior for every protected Custom Element', async () => {
    await checkDisabledClickContract(await disabledElementTags(elementsUrl));
  });

  test('keeps a field child disabled if it is re-enabled while the field is disabled', async () => {
    const field = document.createElement('aesir-field');
    const button = document.createElement('button');
    field.append(button);
    field.disabled = true;
    await settleCustomElement(field);

    await vi.waitFor(() => expect(button.disabled).toBe(true));
    button.disabled = false;
    await vi.waitFor(() => expect(button.disabled).toBe(true));

    const onClick = vi.fn();
    button.addEventListener('click', onClick);
    button.click();
    expect(onClick).not.toHaveBeenCalled();

    field.disabled = false;
    await vi.waitFor(() => expect(button.disabled).toBe(false));
    button.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  test('does not forward clicks from a disabled button rendered as a link', async () => {
    const button = document.createElement('aesir-button');
    button.href = '/settings';
    button.disabled = true;
    await settleCustomElement(button);

    const onClick = vi.fn();
    button.addEventListener('click', onClick);
    button.shadowRoot.querySelector('a').click();
    expect(onClick).not.toHaveBeenCalled();
  });

  test('keeps checkbox state synchronized across the Custom Element boundary', async () => {
    const checkbox = document.createElement('aesir-checkbox');
    checkbox.setAttribute('label', 'Product updates');
    await settleCustomElement(checkbox);

    const input = checkbox.shadowRoot?.querySelector('input[type="checkbox"]');
    expect(input?.checked).toBe(false);
    input?.click();
    await Promise.resolve();

    expect(checkbox.checked).toBe(true);
    expect(checkbox.hasAttribute('checked')).toBe(true);
    expect(checkbox.shadowRoot?.querySelector('[data-state]')?.dataset.state).toBe('checked');
  });

  test('selects a radio when its description is clicked', async () => {
    const radio = document.createElement('aesir-radio');
    radio.setAttribute('label', 'Pro');
    radio.setAttribute('description', 'For production applications.');
    radio.setAttribute('value', 'pro');
    await settleCustomElement(radio);

    radio.shadowRoot.querySelector('.aesir-radio__description').click();
    await Promise.resolve();

    expect(radio.group).toBe('pro');
    expect(radio.shadowRoot.querySelector('input[type="radio"]').checked).toBe(true);
  });

  test('keeps text input values synchronized across the Custom Element boundary', async () => {
    const field = document.createElement('aesir-input');
    field.setAttribute('label', 'Project name');
    field.setAttribute('value', 'Aesir');
    await settleCustomElement(field);

    const input = field.shadowRoot?.querySelector('input');
    expect(input?.value).toBe('Aesir');
    input.value = 'Example project';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
    await Promise.resolve();

    expect(field.value).toBe('Example project');
  });

  test('reflects collapsible interaction state and accessibility attributes', async () => {
    const collapsible = document.createElement('aesir-collapsible');
    collapsible.setAttribute('collapsible-title', 'Build details');
    await settleCustomElement(collapsible);

    const trigger = collapsible.shadowRoot?.querySelector('button');
    const content = collapsible.shadowRoot?.querySelector('.aesir-collapsible__content');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(content?.getAttribute('aria-hidden')).toBe('true');

    trigger?.click();
    await Promise.resolve();

    expect(collapsible.open).toBe(true);
    expect(collapsible.hasAttribute('open')).toBe(true);
    expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    expect(content?.getAttribute('aria-hidden')).toBe('false');
  });

  test('closes an open dialog with Escape and restores reflected state', async () => {
    const dialog = document.createElement('aesir-dialog');
    dialog.setAttribute('dialog-title', 'Delete project');
    dialog.open = true;
    await settleCustomElement(dialog);

    expect(dialog.shadowRoot?.querySelector('[role="dialog"]') ?? document.querySelector('[role="dialog"]')).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await Promise.resolve();

    expect(dialog.open).toBe(false);
    expect(dialog.hasAttribute('open')).toBe(false);
  });
});
