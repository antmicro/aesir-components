import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, test } from 'vitest';
import ButtonFixture from '../fixtures/button-fixture.svelte';
import CompositeNavigationFixture from '../fixtures/composite-navigation-fixture.svelte';
import ContextMenuFixture from '../fixtures/context-menu-fixture.svelte';
import DatePickerContractsFixture from '../fixtures/date-picker-contracts-fixture.svelte';
import DisclosureNavigationFixture from '../fixtures/disclosure-navigation-fixture.svelte';
import FormControlsFixture from '../fixtures/form-controls-fixture.svelte';
import FormIntegrationFixture from '../fixtures/form-integration-fixture.svelte';
import OverlayCoordinationFixture from '../fixtures/overlay-coordination-fixture.svelte';
import RadioReadonlyFixture from '../fixtures/radio-readonly-fixture.svelte';

describe('component behavior in a browser', () => {
  test('non-modal top-level overlays dismiss each other instead of stacking', async () => {
    await render(OverlayCoordinationFixture, { modal: false });
    const dropdown = page.getByRole('button', { name: 'Open dropdown' });
    const popover = page.getByRole('button', { name: 'Open popover' });
    const contextSurface = page.getByRole('button', { name: 'Context surface' });

    await dropdown.click();
    await expect.element(dropdown).toHaveAttribute('aria-expanded', 'true');
    await contextSurface.click({ button: 'right' });
    await expect.element(dropdown).toHaveAttribute('aria-expanded', 'false');
    await expect.element(page.getByRole('menu', { name: 'Context actions' })).toBeInTheDocument();

    await popover.click();
    await expect.element(page.getByRole('menu', { name: 'Context actions' })).not.toBeInTheDocument();
    await expect.element(popover).toHaveAttribute('aria-expanded', 'true');

    await dropdown.click();
    await expect.element(popover).toHaveAttribute('aria-expanded', 'false');
    await expect.element(dropdown).toHaveAttribute('aria-expanded', 'true');
  });

  test('disabled buttons and links cannot be activated or focused', async () => {
    await render(ButtonFixture);
    const disabledButton = page.getByRole('button', { name: 'Disabled' });
    const disabledLink = page.getByRole('link', { name: 'Disabled link' });

    await disabledButton.click({ force: true });
    await disabledLink.click({ force: true });
    await expect.element(page.getByRole('status', { name: 'Activations' })).toHaveTextContent('0');

    await userEvent.keyboard('{Tab}');
    await expect.element(page.getByRole('button', { name: 'Save' })).toHaveFocus();
    await userEvent.keyboard('{Tab}');
    await expect.element(disabledButton).not.toHaveFocus();
    await expect.element(disabledLink).not.toHaveFocus();
  });

  test('clicking a radio description selects its control', async () => {
    await render(FormControlsFixture);

    await page.getByText('For production applications.').click();

    await expect.element(page.getByRole('radio', { name: 'Pro' })).toBeChecked();
    await expect.element(page.getByRole('status', { name: 'Plan value' })).toHaveTextContent('pro');
  });

  test('readonly radios preserve the selected native form option', async () => {
    await render(RadioReadonlyFixture);

    await page.getByText('Pro', { exact: true }).click();

    await expect.element(page.getByRole('radio', { name: 'Free' })).toBeChecked();
    await expect.element(page.getByRole('radio', { name: 'Pro' })).not.toBeChecked();
    await expect.element(page.getByRole('status', { name: 'Plan value' })).toHaveTextContent('free');
    expect(new FormData(page.getByRole('form', { name: 'Plan form' }).element()).get('plan')).toBe('free');
  });

  test('readonly radios preserve the selected option through native keyboard navigation', async () => {
    await render(RadioReadonlyFixture);
    const free = page.getByRole('radio', { name: 'Free' });
    const pro = page.getByRole('radio', { name: 'Pro' });

    pro.element().focus();
    await userEvent.keyboard(' ');
    await expect.element(free).toBeChecked();
    await expect.element(pro).not.toBeChecked();

    free.element().focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(pro).toHaveFocus();
    await expect.element(free).toBeChecked();
    await expect.element(pro).not.toBeChecked();
    await expect.element(page.getByRole('status', { name: 'Plan value' })).toHaveTextContent('free');
    expect(new FormData(page.getByRole('form', { name: 'Plan form' }).element()).get('plan')).toBe('free');
  });

  test('native FormData contains the values exposed by Aesir controls', async () => {
    await render(FormIntegrationFixture);
    const project = page.getByRole('textbox', { name: 'Project' });

    await project.fill('Example project');
    await page.getByText('Updates', { exact: true }).click();
    await page.getByText('Pro', { exact: true }).click();
    await page.getByText('Alerts', { exact: true }).click();
    await page.getByRole('combobox', { name: 'Region' }).selectOptions('us');
    await page.getByRole('button', { name: 'Increase seats' }).click();

    const form = page.getByRole('form', { name: 'Component form' }).element();
    expect(Object.fromEntries(new FormData(form))).toEqual({
      project: 'Example project',
      updates: 'yes',
      plan: 'pro',
      alerts: 'enabled',
      region: 'us',
      seats: '3'
    });
  });

  test('tabs use roving focus and skip disabled tabs', async () => {
    await render(DisclosureNavigationFixture);
    const overview = page.getByRole('tab', { name: 'Overview' });

    await overview.click();
    await userEvent.keyboard('{ArrowRight}');

    await expect.element(page.getByRole('tab', { name: 'Activity' })).toHaveFocus();
    await expect.element(page.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true');
  });

  test('menubar switches between open menus with horizontal arrows', async () => {
    await render(CompositeNavigationFixture);
    await page.getByRole('menuitem', { name: 'File' }).click();

    await userEvent.keyboard('{ArrowRight}');

    await expect.element(page.getByRole('menuitem', { name: 'View' })).toHaveAttribute('aria-expanded', 'true');
    await expect.element(page.getByRole('menuitemcheckbox', { name: 'Show sidebar' })).toHaveFocus();
  });

  test('tree view follows its hierarchical keyboard model', async () => {
    await render(CompositeNavigationFixture);
    const source = page.getByRole('treeitem', { name: /src/ });

    await source.click();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');

    await expect.element(source).toHaveAttribute('aria-expanded', 'true');
    await expect.element(page.getByRole('treeitem', { name: /components/ })).toHaveFocus();
  });

  test('date picker closes with Escape and restores trigger focus', async () => {
    await render(DatePickerContractsFixture);
    const trigger = page.getByRole('button', { name: /Release date/ });

    await trigger.click();
    await expect.element(page.getByRole('dialog', { name: 'Choose date' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');

    await expect.element(page.getByRole('dialog', { name: 'Choose date' })).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  test('context menu opens from a real secondary click and restores focus', async () => {
    await render(ContextMenuFixture);
    const trigger = page.getByRole('button', { name: 'File surface' });

    await trigger.click();
    await trigger.click({ button: 'right' });
    await expect.element(page.getByRole('menu', { name: 'File actions' })).toBeInTheDocument();
    await page.getByRole('menuitem', { name: 'Copy' }).click();

    await expect.element(page.getByRole('status', { name: 'Selected action' })).toHaveTextContent('copy');
    await expect.element(trigger).toHaveFocus();
  });

  test('opening another non-modal context menu closes the previous one', async () => {
    await render(ContextMenuFixture, { modal: false });
    const first = page.getByRole('button', { name: 'File surface' });
    const second = page.getByRole('button', { name: 'Second surface' });

    await first.click({ button: 'right' });
    await expect.element(page.getByRole('menu', { name: 'File actions' })).toBeInTheDocument();
    await second.click({ button: 'right' });

    await expect.element(page.getByRole('menu', { name: 'File actions' })).not.toBeInTheDocument();
    await expect.element(page.getByRole('menu', { name: 'Second actions' })).toBeInTheDocument();
    await expect.element(page.getByRole('menuitem', { name: 'Status' })).toHaveFocus();
  });

  test('default context menus block a second surface until the first menu is dismissed', async () => {
    await render(ContextMenuFixture);
    const first = page.getByRole('button', { name: 'File surface' });
    const second = page.getByRole('button', { name: 'Second surface' });

    await first.click({ button: 'right' });
    const menu = page.getByRole('menu', { name: 'File actions' });
    await expect.element(menu).toBeInTheDocument();
    const copy = page.getByRole('menuitem', { name: 'Copy' });
    await expect.element(copy).toHaveFocus();
    await userEvent.keyboard('{Tab}{Shift>}{Tab}{/Shift}');
    await expect.element(copy).toHaveFocus();
    second.element().focus();
    await expect.element(copy).toHaveFocus();

    const rect = second.element().getBoundingClientRect();
    const position = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const backdrop = page.elementLocator(document.querySelector('[data-aesir-menu-backdrop]'));
    await backdrop.click({ button: 'right', position });
    await expect.element(menu).toBeInTheDocument();
    await expect.element(page.getByRole('menu', { name: 'Second actions' })).not.toBeInTheDocument();

    await backdrop.click({ position });
    await expect.element(menu).not.toBeInTheDocument();
    await expect.element(first).toHaveFocus();
    expect(document.querySelector('[data-aesir-menu-backdrop]')).toBeNull();
    expect(document.documentElement.style.overflow).toBe('');

    await second.click({ button: 'right' });
    await expect.element(page.getByRole('menu', { name: 'Second actions' })).toBeInTheDocument();
  });

  test('context submenu keeps its safe triangle while crossing a sibling item', async () => {
    await render(ContextMenuFixture);
    await page.getByRole('button', { name: 'Second surface' }).click({ button: 'right' });

    const status = page.getByRole('menuitem', { name: 'Status' });
    const priority = page.getByRole('menuitem', { name: 'Priority' });
    const statusRect = status.element().getBoundingClientRect();
    status.element().dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, pointerType: 'mouse', clientX: statusRect.left + 8, clientY: statusRect.top + statusRect.height / 2 }));
    status.element().dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: statusRect.right - 24, clientY: statusRect.top + statusRect.height / 2 }));

    await expect.element(page.getByRole('menu', { name: 'Status' })).toBeInTheDocument();
    const rootMenuStyle = getComputedStyle(page.getByRole('menu', { name: 'Second actions' }).element());
    expect(rootMenuStyle.overflowX).toBe('visible');
    expect(rootMenuStyle.overflowY).toBe('visible');
    const statusMenuRect = page.getByRole('menu', { name: 'Status' }).element().getBoundingClientRect();
    status.element().dispatchEvent(
      new PointerEvent('pointerleave', {
        bubbles: true,
        pointerType: 'mouse',
        clientX: statusRect.right - 2,
        clientY: statusRect.top + statusRect.height / 2 + 1
      })
    );

    const priorityRect = priority.element().getBoundingClientRect();
    const crossingPoint = {
      x: statusMenuRect.left - 4,
      y: Math.min(statusMenuRect.bottom - 8, priorityRect.top + priorityRect.height / 2)
    };
    priority.element().dispatchEvent(
      new PointerEvent('pointerenter', {
        bubbles: true,
        pointerType: 'mouse',
        clientX: crossingPoint.x,
        clientY: crossingPoint.y
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 60));
    await expect.element(page.getByRole('menu', { name: 'Status' })).toBeInTheDocument();
    await expect.element(page.getByRole('menu', { name: 'Priority' })).not.toBeInTheDocument();

    priority.element().dispatchEvent(new PointerEvent('pointerleave', { bubbles: true, pointerType: 'mouse', clientX: statusMenuRect.left - 3, clientY: statusMenuRect.bottom - 8 }));
    page
      .getByRole('menu', { name: 'Status' })
      .element()
      .dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, pointerType: 'mouse', clientX: statusMenuRect.left + 4, clientY: statusMenuRect.bottom - 8 }));
    await expect.element(page.getByRole('menu', { name: 'Status' })).toBeInTheDocument();
  });
});
