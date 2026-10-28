import '../../dist/aesir-html.min.js';
import { page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, test } from 'vitest';
import { mount } from './test-utils.js';

afterEach(() => document.body.replaceChildren());

describe('HTML Custom Elements in a browser', () => {
  test.each(['mega', 'compact'])('navbar keeps its %s hover menu open and allows switching triggers', async (menu) => {
    await page.viewport(1024, 768);
    await mount('<aesir-navbar layout="full" style="display:block;width:800px"></aesir-navbar><button type="button" style="position:fixed;bottom:32px;right:32px">Outside navigation</button>');
    const navbar = document.querySelector('aesir-navbar');
    navbar.menuTrigger = 'hover';
    navbar.menuOpenDelay = 20;
    navbar.menuCloseDelay = 60;
    navbar.items = [
      { label: 'Products', menu, items: [{ label: 'Platform' }] },
      { label: 'Resources', menu, items: [{ label: 'Guides' }] }
    ];

    const products = page.getByRole('button', { name: 'Products' });
    await products.hover();
    await expect.element(products).toHaveAttribute('aria-expanded', 'true');
    await new Promise((resolve) => setTimeout(resolve, 250));
    await expect.element(products).toHaveAttribute('aria-expanded', 'true');
    expect(navbar.shadowRoot.querySelector('[data-aesir-menu-backdrop]')).toBeNull();
    expect(document.documentElement.dataset.overlayOpen).toBeUndefined();

    await page.getByRole('menuitem', { name: 'Platform' }).hover();
    await new Promise((resolve) => setTimeout(resolve, 150));
    await expect.element(products).toHaveAttribute('aria-expanded', 'true');
    const resources = page.getByRole('button', { name: 'Resources' });
    await resources.hover();
    await expect.element(resources).toHaveAttribute('aria-expanded', 'true');
    await expect.element(products).toHaveAttribute('aria-expanded', 'false');
    await expect.element(page.getByRole('menuitem', { name: 'Guides' })).toBeVisible();

    await page.getByRole('button', { name: 'Outside navigation' }).hover();
    await expect.element(resources).toHaveAttribute('aria-expanded', 'false');
  });

  test('menubar keeps a hovered panel open while switching triggers and entering its items', async () => {
    await mount(`<aesir-menubar menus='[{"label":"File","value":"file","items":[{"label":"New file"}]},{"label":"View","value":"view","items":[{"label":"Show sidebar"}]}]'></aesir-menubar>`);
    const menubar = document.querySelector('aesir-menubar');
    const file = page.getByRole('menuitem', { name: 'File', exact: true });
    const view = page.getByRole('menuitem', { name: 'View', exact: true });
    await file.click();
    await view.hover();
    await expect.element(view).toHaveAttribute('aria-expanded', 'true');
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect.element(view).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('menuitem', { name: 'Show sidebar' }).hover();
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect.element(view).toHaveAttribute('aria-expanded', 'true');
    expect(menubar.shadowRoot.querySelector('[data-aesir-menu-backdrop]')).toBeNull();

    await file.hover();
    await expect.element(page.getByRole('menuitem', { name: 'New file' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect.element(file).toHaveAttribute('aria-expanded', 'false');
    expect(menubar.shadowRoot.activeElement).toBe(file.element());
  });

  test('disabled buttons are skipped and resume interaction after enabling', async () => {
    await mount('<aesir-button disabled>Save</aesir-button><button type="button">After</button><output aria-label="Activations">0</output>');
    const host = document.querySelector('aesir-button');
    const button = page.getByRole('button', { name: 'Save' });
    const output = document.querySelector('output');
    host.addEventListener('click', () => (output.textContent = String(Number(output.textContent) + 1)));

    await expect.element(button).toBeDisabled();
    await userEvent.keyboard('{Tab}');
    await expect.element(page.getByRole('button', { name: 'After' })).toHaveFocus();

    host.disabled = false;
    await expect.element(button).toBeEnabled();
    await button.click();
    await expect.element(page.getByRole('status', { name: 'Activations' })).toHaveTextContent('1');
  });

  test('property updates after mount reach native controls and reflected state', async () => {
    await mount('<aesir-input label="Repository"></aesir-input><aesir-checkbox label="Archived"></aesir-checkbox><aesir-toggle>Pin</aesir-toggle>');
    const input = document.querySelector('aesir-input');
    const checkbox = document.querySelector('aesir-checkbox');
    const toggle = document.querySelector('aesir-toggle');

    input.value = 'aesir';
    checkbox.checked = true;
    toggle.pressed = true;

    await expect.element(page.getByRole('textbox', { name: 'Repository' })).toHaveValue('aesir');
    await expect.element(page.getByRole('checkbox', { name: 'Archived' })).toBeChecked();
    await expect.element(page.getByRole('button', { name: 'Pin' })).toHaveAttribute('aria-pressed', 'true');
    expect(checkbox.hasAttribute('checked')).toBe(true);
    expect(toggle.hasAttribute('pressed')).toBe(true);
  });

  test('input values stay synchronized across the Custom Element boundary', async () => {
    await mount('<aesir-input label="Project name" value="Aesir"></aesir-input>');
    const host = document.querySelector('aesir-input');
    const input = page.getByRole('textbox', { name: 'Project name' });

    await input.fill('Example project');

    await expect.element(input).toHaveValue('Example project');
    expect(host.value).toBe('Example project');
  });

  test('clicking a checkbox label reflects state on the host', async () => {
    await mount('<aesir-checkbox label="Product updates"></aesir-checkbox>');
    const host = document.querySelector('aesir-checkbox');

    await page.getByText('Product updates', { exact: true }).click();

    await expect.element(page.getByRole('checkbox', { name: 'Product updates' })).toBeChecked();
    expect(host.checked).toBe(true);
    expect(host.hasAttribute('checked')).toBe(true);
  });

  test('dropdown uses the slotted trigger and restores its focus', async () => {
    await mount(
      `<aesir-dropdown label="Project actions" items='[{"label":"Edit","value":"edit"},{"label":"Archive","value":"archive","disabled":true}]'>
        <button type="button">Actions</button>
      </aesir-dropdown>`
    );
    const dropdown = document.querySelector('aesir-dropdown');
    const trigger = page.getByRole('button', { name: 'Actions' });

    await trigger.click();
    await expect.element(page.getByRole('menu', { name: 'Project actions' })).toBeInTheDocument();
    await expect.poll(() => dropdown.shadowRoot.activeElement?.textContent.trim()).toBe('Edit');
    await userEvent.keyboard('{Escape}');

    await expect.element(page.getByRole('menu', { name: 'Project actions' })).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  test('compact mobile dropdown stays aligned with its slotted trigger', async () => {
    await mount(
      `<div style="padding-left: 24px">
        <aesir-dropdown
          align="start"
          label="Editor actions"
          mobile-breakpoint="2000"
          content-style="width: 20rem"
          items='[{"label":"Document","value":"document"},{"label":"Templates","value":"templates"}]'
        >
          <button type="button">Editing</button>
        </aesir-dropdown>
      </div>`
    );
    const trigger = page.getByRole('button', { name: 'Editing' });

    await trigger.click();

    await expect
      .poll(() => {
        const triggerLeft = trigger.element().getBoundingClientRect().left;
        const menuLeft = page.getByRole('menu', { name: 'Editor actions' }).element().getBoundingClientRect().left;
        return Math.abs(menuLeft - triggerLeft);
      })
      .toBeLessThan(10);
  });

  test('dialog includes slotted controls in its native Tab order', async () => {
    await mount(
      `<button type="button" id="open-dialog">Open settings</button>
      <aesir-dialog dialog-title="Settings" description="Manage workspace settings.">
        <input aria-label="Workspace name">
        <button type="button">Save settings</button>
      </aesir-dialog>`
    );
    const dialog = document.querySelector('aesir-dialog');
    document.querySelector('#open-dialog').addEventListener('click', () => (dialog.open = true));
    const trigger = page.getByRole('button', { name: 'Open settings' });

    await trigger.click();
    await expect.poll(() => dialog.shadowRoot.activeElement?.getAttribute('aria-label')).toBe('Close dialog');
    await userEvent.keyboard('{Tab}');
    await expect.element(page.getByRole('textbox', { name: 'Workspace name' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');

    await expect.element(page.getByRole('dialog', { name: 'Settings' })).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  test.each(['Preview', 'Copy URL'])('tooltip describes the slotted trigger and keeps "%s" on one line', async (content) => {
    await mount(`<aesir-tooltip content="${content}" delay="0"><button type="button">Copy</button></aesir-tooltip>`);
    const trigger = page.getByRole('button', { name: 'Copy' });

    await trigger.hover();
    const tooltip = page.getByRole('tooltip');

    await expect.element(tooltip).toHaveTextContent(content);
    await expect.element(tooltip).toHaveAttribute('data-positioned');
    await expect
      .poll(() => {
        const range = document.createRange();
        range.selectNodeContents(tooltip.element());
        return range.getClientRects().length;
      })
      .toBe(1);
    await expect.element(trigger).toHaveAttribute('aria-describedby');
    await userEvent.keyboard('{Escape}');
    await expect.element(tooltip).not.toBeInTheDocument();
  });

  test('tooltip stays closed on devices without hover or a fine pointer', async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (query) =>
      query === '(hover: none), (pointer: coarse)'
        ? {
            matches: true,
            media: query,
            onchange: null,
            addEventListener() {},
            removeEventListener() {},
            addListener() {},
            removeListener() {},
            dispatchEvent() {
              return true;
            }
          }
        : originalMatchMedia.call(window, query);

    try {
      await mount('<aesir-tooltip content="Copy URL" delay="0"><button type="button">Copy</button></aesir-tooltip>');
      const trigger = page.getByRole('button', { name: 'Copy' });

      await trigger.hover();
      trigger.element().focus();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      await expect.element(page.getByRole('tooltip')).not.toBeInTheDocument();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  test('field keeps a slotted native input integrated with FormData', async () => {
    await mount('<form aria-label="Project form"><aesir-field label="Project"><input name="project" value="Aesir"></aesir-field></form>');
    const field = document.querySelector('aesir-field');
    const form = page.getByRole('form', { name: 'Project form' }).element();

    expect(Object.fromEntries(new FormData(form))).toEqual({ project: 'Aesir' });
    field.disabled = true;
    await expect.element(page.getByRole('textbox')).toBeDisabled();
    expect(Object.fromEntries(new FormData(form))).toEqual({});
  });
});
