import '../../dist/aesir-html.min.js';
import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, test } from 'vitest';
import { mount } from './test-utils.js';

afterEach(() => document.body.replaceChildren());

describe('HTML overlay contracts', () => {
  test('opening another non-modal context menu closes the previous instance', async () => {
    await mount(
      `<div style="display: flex; gap: 24rem">
        <aesir-context-menu modal="false" style="display: inline-block" label="First actions" items='[{"label":"Copy","value":"copy"}]'>
          <button type="button">First surface</button>
        </aesir-context-menu>
        <aesir-context-menu modal="false" style="display: inline-block" label="Second actions" items='[{"label":"Inspect","value":"inspect"}]'>
          <button type="button">Second surface</button>
        </aesir-context-menu>
      </div>`
    );
    const [firstMenu, secondMenu] = document.querySelectorAll('aesir-context-menu');

    await page.getByRole('button', { name: 'First surface' }).click({ button: 'right' });
    expect(firstMenu.open).toBe(true);
    await page.getByRole('button', { name: 'Second surface' }).click({ button: 'right' });

    expect(firstMenu.open).toBe(false);
    expect(secondMenu.open).toBe(true);
    await expect.element(page.getByRole('menu', { name: 'Second actions' })).toBeInTheDocument();
  });

  test.each(['aesir-context-menu', 'aesir-dropdown'])('%s blocks the background and consumes the dismissal click by default', async (tag) => {
    await mount(
      `<${tag} style="display: inline-block" label="Actions" items='[{"label":"Inspect","value":"inspect"}]'>
        <button type="button">Menu trigger</button>
      </${tag}>
      <button type="button" style="margin-left: 16rem">Outside</button>
      <output aria-label="Outside clicks">0</output>`
    );
    const host = document.querySelector(tag);
    const trigger = page.getByRole('button', { name: 'Menu trigger' });
    const outside = page.getByRole('button', { name: 'Outside' });
    const output = page.getByRole('status', { name: 'Outside clicks' });
    let outsideClicks = 0;
    outside.element().addEventListener('click', () => (output.element().textContent = String(++outsideClicks)));

    await trigger.click(tag === 'aesir-context-menu' ? { button: 'right' } : {});
    const menu = page.getByRole('menu', { name: 'Actions' });
    await expect.element(menu).toBeInTheDocument();
    const inspect = page.getByRole('menuitem', { name: 'Inspect' });
    await expect.poll(() => host.shadowRoot.activeElement).toBe(inspect.element());
    expect(document.documentElement.style.overflow).toBe('hidden');
    await userEvent.keyboard('{Tab}{Shift>}{Tab}{/Shift}');
    await expect.poll(() => host.shadowRoot.activeElement).toBe(inspect.element());
    outside.element().focus();
    await expect.poll(() => host.shadowRoot.activeElement).toBe(inspect.element());

    const rect = outside.element().getBoundingClientRect();
    const position = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const backdrop = page.elementLocator(host.shadowRoot.querySelector('[data-aesir-menu-backdrop]'));
    await backdrop.click({ button: 'right', position: { ...position } });
    expect(host.open).toBe(true);
    await expect.element(output).toHaveTextContent('0');
    await backdrop.click({ position: { ...position } });

    await expect.poll(() => host.open).toBe(false);
    await expect.element(menu).not.toBeInTheDocument();
    await expect.element(output).toHaveTextContent('0');
    await expect.element(trigger).toHaveFocus();
    expect(host.shadowRoot.querySelector('[data-aesir-menu-backdrop]')).toBeNull();
    expect(document.documentElement.style.overflow).toBe('');
    await outside.click();
    await expect.element(output).toHaveTextContent('1');
  });

  test('context menu exposes nested items with the same keyboard model as Svelte', async () => {
    await mount(
      `<aesir-context-menu label="Requirement actions" items='[{"label":"Status","value":"status","items":[{"label":"Done","value":"done"},{"label":"Todo","value":"todo"}]}]'>
        <button type="button">Requirement</button>
      </aesir-context-menu>`
    );

    const contextMenu = document.querySelector('aesir-context-menu');
    const status = page.getByRole('menuitem', { name: 'Status' });
    await page.getByRole('button', { name: 'Requirement' }).click({ button: 'right' });
    expect(contextMenu.shadowRoot.activeElement).toBe(status.element());
    await userEvent.keyboard('{ArrowRight}');

    await expect.element(page.getByRole('menu', { name: 'Status' })).toBeInTheDocument();
    await expect.poll(() => contextMenu.shadowRoot.activeElement).toBe(page.getByRole('menuitem', { name: 'Done' }).element());
  });

  test('popover exposes trigger state, closes with Escape, and restores focus', async () => {
    await mount(
      `<aesir-popover>
        <button type="button">Open details</button>
        <div slot="content">Deployment details</div>
      </aesir-popover>`
    );
    const popover = document.querySelector('aesir-popover');
    const trigger = page.getByRole('button', { name: 'Open details' });

    await trigger.click();
    expect(popover.open).toBe(true);
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect.element(page.getByText('Deployment details', { exact: true })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');

    expect(popover.open).toBe(false);
    await expect.element(trigger).toHaveFocus();
  });

  test('drawer renders slotted regions and closes with Escape', async () => {
    await mount(
      `<button type="button" id="open-drawer">Open navigation</button>
      <aesir-drawer label="Navigation" has-header has-footer>
        <strong slot="header">Workspace</strong>
        <a href="#projects">Projects</a>
        <button slot="footer" type="button">Sign out</button>
      </aesir-drawer>`
    );
    const drawer = document.querySelector('aesir-drawer');
    const trigger = page.getByRole('button', { name: 'Open navigation' });
    trigger.element().addEventListener('click', () => (drawer.open = true));

    await trigger.click();
    await expect.element(page.getByRole('dialog', { name: 'Navigation' })).toBeInTheDocument();
    await expect.element(page.getByText('Workspace', { exact: true })).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');

    expect(drawer.open).toBe(false);
    await expect.element(trigger).toHaveFocus();
  });
});
