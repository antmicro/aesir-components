import { expect, vi } from 'vitest';
import { settleCustomElement } from './setup.js';

export async function checkModalMenus() {
  for (const tag of ['aesir-dropdown', 'aesir-context-menu']) {
    for (const mode of ['default', 'attribute', 'property']) {
      const element = document.createElement(tag);
      element.items = [{ label: 'Inspect', value: 'inspect' }];
      element.innerHTML = '<button type="button">Menu trigger</button>';
      if (mode === 'attribute') element.setAttribute('modal', 'false');
      if (mode === 'property') element.modal = false;
      await settleCustomElement(element);
      if (tag === 'aesir-dropdown') element.shadowRoot.querySelector('.aesir-dropdown__anchor').getBoundingClientRect = () => new DOMRect(0, 0, 100, 36);
      const outside = document.createElement('button');
      let clicks = 0;
      outside.addEventListener('click', () => clicks++);
      document.body.append(outside);
      if (tag === 'aesir-dropdown') element.querySelector('button').click();
      else element.querySelector('button').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true }));
      await vi.waitFor(() => expect(element.shadowRoot.querySelector('[role="menu"]')).toBeTruthy());
      const modal = mode === 'default';
      await vi.waitFor(() => expect(Boolean(element.shadowRoot.querySelector('[data-aesir-menu-backdrop]'))).toBe(modal));
      outside.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true, cancelable: true }));
      await vi.waitFor(() => expect(element.open).toBe(false));
      outside.click();
      expect(clicks).toBe(modal ? 0 : 1);
      outside.click();
      expect(clicks).toBe(modal ? 1 : 2);
      element.remove();
      outside.remove();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
}

export async function checkDropdownFocusReturn() {
  for (const tag of ['button', 'aesir-button']) {
    const dropdown = document.createElement('aesir-dropdown');
    dropdown.items = [{ label: 'Edit', value: 'edit' }];
    dropdown.innerHTML = `<${tag}>Settings</${tag}>`;
    await settleCustomElement(dropdown);
    const host = dropdown.querySelector(tag);
    let button;
    await vi.waitFor(() => {
      button = tag === 'button' ? host : host.shadowRoot?.querySelector('button');
      expect(button).toBeTruthy();
    });
    dropdown.shadowRoot.querySelector('span').getBoundingClientRect = () => new DOMRect(0, 0, 100, 36);
    button.focus();
    button.click();
    await vi.waitFor(() => expect(dropdown.shadowRoot.activeElement?.getAttribute('role')).toBe('menuitem'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => {
      expect(dropdown.open).toBe(false);
      expect(button.getRootNode().activeElement).toBe(button);
    });
    dropdown.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

export async function checkTriggerStates() {
  for (const [tag, role] of [
    ['aesir-popover', 'dialog'],
    ['aesir-dropdown', 'menu']
  ]) {
    const element = document.createElement(tag);
    element.innerHTML = '<button aria-label="Open settings">Settings</button><span slot="content">Panel</span>';
    if (tag === 'aesir-dropdown') element.items = [{ label: 'Edit', value: 'edit' }];
    await settleCustomElement(element);
    const button = element.querySelector('button');
    await vi.waitFor(() => expect(button.getAttribute('aria-expanded')).toBe('false'));
    // jsdom has no layout; Dropdown closes automatically when its anchor has no width.
    if (tag === 'aesir-dropdown') element.shadowRoot.querySelector('span').getBoundingClientRect = () => new DOMRect(0, 0, 100, 36);
    expect(button.getAttribute('aria-haspopup')).toBe(role);
    expect(button.getAttribute('aria-label')).toBe('Open settings');
    button.click();
    await vi.waitFor(() => expect(button.getAttribute('aria-expanded'), `${tag}: open=${element.open}`).toBe('true'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(button.getAttribute('aria-expanded')).toBe('false'));
    element.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(button.hasAttribute('aria-expanded')).toBe(false);
    expect(button.hasAttribute('aria-haspopup')).toBe(false);
  }
}

export async function checkSlottedDialogAndTooltip() {
  const dialog = document.createElement('aesir-dialog');
  dialog.open = true;
  dialog.innerHTML =
    '<input aria-label="Name"><aesir-input label="Nested input"></aesir-input><aesir-tooltip content="Help text" delay="0"><button aria-describedby="existing-help">Help</button><span id="existing-help" hidden>Existing description</span></aesir-tooltip>';
  await settleCustomElement(dialog);
  const tooltip = dialog.querySelector('aesir-tooltip');
  await vi.waitFor(() => expect(tooltip.shadowRoot?.querySelector('slot')).toBeTruthy());
  const close = dialog.shadowRoot.querySelector('button');
  close.focus();
  const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, composed: true, cancelable: true });
  close.dispatchEvent(tab);
  expect(tab.defaultPrevented).toBe(false);
  const nested = dialog.querySelector('aesir-input');
  await vi.waitFor(() => expect(nested.shadowRoot?.querySelector('input')).toBeTruthy());
  nested.shadowRoot.querySelector('input').focus();
  const previous = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, composed: true, cancelable: true });
  nested.shadowRoot.querySelector('input').dispatchEvent(previous);
  expect(previous.defaultPrevented).toBe(false);
  const trigger = tooltip.querySelector('button');
  trigger.focus();
  await vi.waitFor(() => expect(tooltip.shadowRoot.querySelector('[role="tooltip"][data-state="open"]')).toBeTruthy());
  const ids = trigger.getAttribute('aria-describedby').split(' ');
  expect(ids).toContain('existing-help');
  expect(ids.map((id) => document.getElementById(id)?.textContent)).toContain('Help text');
  const wrap = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, composed: true, cancelable: true });
  trigger.dispatchEvent(wrap);
  expect(wrap.defaultPrevented).toBe(true);
  expect(dialog.shadowRoot.activeElement).toBe(close);
}
