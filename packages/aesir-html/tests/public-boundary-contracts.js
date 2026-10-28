import { expect, vi } from 'vitest';
import { settleCustomElement } from './setup.js';

export async function checkPublicElementLifecycles(tags) {
  expect(tags.length).toBeGreaterThan(50);

  for (const tag of tags) {
    const element = document.createElement(tag);
    await settleCustomElement(element);
    expect(element.shadowRoot, `${tag} did not render a Shadow Root`).not.toBeNull();

    element.remove();
    document.body.append(element);
    await Promise.resolve();
    expect(element.isConnected, `${tag} could not be reconnected`).toBe(true);
    expect(element.shadowRoot, `${tag} lost its Shadow Root after reconnecting`).not.toBeNull();

    element.remove();
  }
}

export async function checkAttributeTypesAndUpdates() {
  const stepper = document.createElement('aesir-quantity-stepper');
  stepper.setAttribute('value', '3');
  stepper.setAttribute('min', '1');
  stepper.setAttribute('max', '7');
  stepper.setAttribute('step', '2');
  stepper.setAttribute('disabled', '');
  await settleCustomElement(stepper);

  expect(stepper.value).toBe(3);
  expect(stepper.min).toBe(1);
  expect(stepper.max).toBe(7);
  expect(stepper.step).toBe(2);
  expect(stepper.disabled).toBe(true);

  stepper.removeAttribute('disabled');
  stepper.setAttribute('value', '5');
  stepper.setAttribute('max', '5');
  await vi.waitFor(() => {
    expect(stepper.disabled).toBe(false);
    expect(stepper.value).toBe(5);
    expect(stepper.shadowRoot.querySelector('[aria-label="Increase quantity"]').disabled).toBe(true);
  });
}

export async function checkKebabCaseAttributes() {
  const pagination = document.createElement('aesir-pagination');
  pagination.setAttribute('page', '2');
  pagination.setAttribute('total-pages', '5');
  pagination.setAttribute('sibling-count', '2');
  await settleCustomElement(pagination);

  expect(pagination.page).toBe(2);
  expect(pagination.totalPages).toBe(5);
  expect(pagination.siblingCount).toBe(2);
  expect(pagination.shadowRoot.querySelector('[aria-label="Next page"]').disabled).toBe(false);
}

export async function checkCustomEventDetail() {
  const dropdown = document.createElement('aesir-dropdown');
  dropdown.items = [{ label: 'Rename', value: 'rename', disabled: false }];
  dropdown.innerHTML = '<button>Actions</button>';
  const onSelect = vi.fn();
  dropdown.addEventListener('select', onSelect);
  await settleCustomElement(dropdown);
  dropdown.shadowRoot.querySelector('span').getBoundingClientRect = () => new DOMRect(0, 0, 100, 36);

  dropdown.querySelector('button').click();
  await vi.waitFor(() => expect(dropdown.shadowRoot.querySelector('[role="menuitem"]')).toBeTruthy());
  dropdown.shadowRoot.querySelector('[role="menuitem"]').click();

  expect(onSelect).toHaveBeenCalledOnce();
  expect(onSelect.mock.calls[0][0]).toBeInstanceOf(CustomEvent);
  expect(onSelect.mock.calls[0][0].detail).toEqual({ label: 'Rename', value: 'rename', disabled: false });
  expect(onSelect.mock.calls[0][0].bubbles).toBe(true);
  expect(onSelect.mock.calls[0][0].composed).toBe(true);
}

export async function checkNativeFormIntegration() {
  const form = document.createElement('form');
  const field = document.createElement('aesir-field');
  field.label = 'Project name';
  const input = document.createElement('input');
  input.name = 'project';
  input.value = 'Aesir';
  field.append(input);
  form.append(field);
  await settleCustomElement(form);

  expect(new FormData(form).get('project')).toBe('Aesir');
  field.disabled = true;
  await vi.waitFor(() => expect(input.disabled).toBe(true));
  expect(new FormData(form).has('project')).toBe(false);
  field.disabled = false;
  await vi.waitFor(() => expect(input.disabled).toBe(false));
  expect(new FormData(form).get('project')).toBe('Aesir');
}

export async function checkIndependentInstances() {
  const first = document.createElement('aesir-checkbox');
  const second = document.createElement('aesir-checkbox');
  first.label = 'First option';
  second.label = 'Second option';
  await settleCustomElement(first);
  await settleCustomElement(second);

  first.shadowRoot.querySelector('input').click();
  await vi.waitFor(() => expect(first.checked).toBe(true));
  expect(second.checked).toBe(false);
  expect(second.shadowRoot.querySelector('input').checked).toBe(false);
}

export async function checkRepresentativeFlows() {
  const input = document.createElement('aesir-input');
  input.label = 'Repository';
  input.required = true;
  input.setAttribute('data-consumer', 'input');
  await settleCustomElement(input);
  const nativeInput = input.shadowRoot.querySelector('input');
  expect(nativeInput.required).toBe(true);
  expect(input.getAttribute('data-consumer')).toBe('input');
  nativeInput.value = 'aesir';
  nativeInput.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
  await vi.waitFor(() => expect(input.value).toBe('aesir'));

  const select = document.createElement('aesir-native-select');
  select.label = 'Environment';
  select.options = [
    { label: 'Development', value: 'dev' },
    { label: 'Production', value: 'prod' }
  ];
  await settleCustomElement(select);
  const nativeSelect = select.shadowRoot.querySelector('select');
  nativeSelect.value = 'prod';
  nativeSelect.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  await vi.waitFor(() => expect(select.value).toBe('prod'));

  const dialog = document.createElement('aesir-dialog');
  dialog.title = 'Settings';
  dialog.open = true;
  await settleCustomElement(dialog);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(dialog.open).toBe(false));
}

export async function checkUnmountCleanup() {
  const dropdown = document.createElement('aesir-dropdown');
  dropdown.items = [{ label: 'Edit', value: 'edit' }];
  dropdown.innerHTML = '<button>Menu</button>';
  await settleCustomElement(dropdown);
  const trigger = dropdown.querySelector('button');
  dropdown.shadowRoot.querySelector('span').getBoundingClientRect = () => new DOMRect(0, 0, 100, 36);
  trigger.click();
  await vi.waitFor(() => expect(dropdown.open).toBe(true));

  dropdown.remove();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(trigger.hasAttribute('aria-expanded')).toBe(false);
  expect(trigger.hasAttribute('aria-haspopup')).toBe(false);
  expect(document.querySelector('[role="menu"]')).toBeNull();
  expect(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))).not.toThrow();
}
