import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, test } from 'vitest';
import ComboboxInputsFixture from '../fixtures/combobox-inputs-fixture.svelte';
import CommandMenuFixture from '../fixtures/command-menu-fixture.svelte';
import DialogFixture from '../fixtures/dialog-fixture.svelte';
import DrawerFixture from '../fixtures/drawer-fixture.svelte';
import DropdownFixture from '../fixtures/dropdown-fixture.svelte';
import MobileDropdownFixture from '../fixtures/mobile-dropdown-fixture.svelte';
import PopoverFixture from '../fixtures/popover-fixture.svelte';
import TooltipModalFixture from '../fixtures/tooltip-modal-fixture.svelte';
import AesirResizablePanels from '../../src/components/aesir-resizable-panels/aesir-resizable-panels.svelte';

describe('critical interactions in a browser', () => {
  test('non-modal dropdown follows native Tab order after keyboard navigation', async () => {
    await render(DropdownFixture, { modal: false });
    const trigger = page.getByRole('button', { name: 'Actions' });

    await trigger.click();
    await userEvent.keyboard('{ArrowDown}{Tab}');

    await expect.element(page.getByRole('menu', { name: 'Project actions' })).not.toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Outside' })).toHaveFocus();
  });

  test('default dropdown contains focus and consumes the outside dismissal click', async () => {
    await render(DropdownFixture);
    const trigger = page.getByRole('button', { name: 'Actions' });
    const outside = page.getByRole('button', { name: 'Outside' });

    await trigger.click();
    await expect.element(page.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    expect(document.documentElement.style.overflow).toBe('hidden');
    await userEvent.keyboard('{ArrowDown}{Tab}{Shift>}{Tab}{/Shift}');
    const duplicate = page.getByRole('menuitem', { name: 'Duplicate' });
    await expect.element(duplicate).toHaveFocus();
    outside.element().focus();
    await expect.element(duplicate).toHaveFocus();

    const rect = outside.element().getBoundingClientRect();
    await page.elementLocator(document.querySelector('[data-aesir-menu-backdrop]')).click({ position: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } });
    await expect.element(page.getByRole('menu', { name: 'Project actions' })).not.toBeInTheDocument();
    await expect.element(page.getByRole('status', { name: 'Outside clicks' })).toHaveTextContent('0');
    await expect.element(trigger).toHaveFocus();
    expect(document.querySelector('[data-aesir-menu-backdrop]')).toBeNull();
    expect(document.documentElement.style.overflow).toBe('');

    await outside.click();
    await expect.element(page.getByRole('status', { name: 'Outside clicks' })).toHaveTextContent('1');
  });

  test('compact mobile dropdown stays aligned with its trigger', async () => {
    await render(MobileDropdownFixture);
    const trigger = page.getByRole('button', { name: 'Editing' });

    await trigger.click();

    await expect
      .poll(() => {
        const triggerLeft = trigger.element().getBoundingClientRect().left;
        const menuLeft = page.getByRole('menu', { name: 'Editor actions' }).element().getBoundingClientRect().left;
        return Math.abs(menuLeft - triggerLeft);
      })
      .toBeLessThan(2);
  });

  test('dialog traps Tab and restores focus after Escape', async () => {
    await render(DialogFixture);
    const trigger = page.getByRole('button', { name: 'Open settings' });

    await trigger.click();
    const close = page.getByRole('button', { name: 'Close dialog' });
    await expect.element(close).toHaveFocus();

    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    await expect.element(page.getByRole('button', { name: 'Open nested commands' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');

    await expect.element(page.getByRole('dialog', { name: 'Settings' })).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  test('command menu skips disabled commands and selects from a nested page', async () => {
    await render(CommandMenuFixture);
    await page.getByRole('button', { name: 'Open commands' }).click();
    const search = page.getByRole('combobox', { name: 'Search commands' });

    await expect.element(search).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{Enter}{Enter}');

    await expect.element(page.getByRole('status', { name: 'Selected command' })).toHaveTextContent('aesir');
    await expect.element(page.getByRole('dialog', { name: 'Command menu' })).not.toBeInTheDocument();
  });

  test('tooltip inside a modal receives focus and consumes Escape first', async () => {
    await render(TooltipModalFixture);
    await page.getByRole('button', { name: 'Open modal' }).click();
    await expect.element(page.getByRole('button', { name: 'Close dialog' })).toHaveFocus();

    await userEvent.keyboard('{Tab}');
    const help = page.getByRole('button', { name: 'Help' });
    await expect.element(help).toHaveFocus();
    await expect.element(page.getByRole('tooltip')).toHaveTextContent('Modal help');

    await userEvent.keyboard('{Escape}');
    await expect.element(page.getByRole('tooltip')).not.toBeInTheDocument();
    await expect.element(page.getByRole('dialog', { name: 'Tooltip modal' })).toBeInTheDocument();
  });

  test('popover closes after a real pointer click outside', async () => {
    await render(PopoverFixture);
    const trigger = page.getByRole('button', { name: 'Display options' });

    await trigger.click();
    await expect.element(page.getByText('Popover content')).toBeInTheDocument();
    await page.getByRole('button', { name: 'Outside' }).click();

    await expect.element(page.getByText('Popover content')).not.toBeInTheDocument();
  });

  test('autocomplete performs keyboard selection in a native input', async () => {
    await render(ComboboxInputsFixture);
    const input = page.getByRole('combobox', { name: 'City' });

    await input.click();
    await userEvent.keyboard('{ArrowDown}{Enter}');

    await expect.element(input).toHaveValue('Prague');
    await expect.element(page.getByRole('status', { name: 'City value' })).toHaveTextContent('prague');
    await expect.element(input).toHaveFocus();
  });

  test('drawer locks page scrolling and releases it after dismissal', async () => {
    await render(DrawerFixture);
    const trigger = page.getByRole('button', { name: 'Open details' });

    await trigger.click();
    await expect.element(page.getByRole('dialog', { name: 'Project details' })).toBeInTheDocument();
    expect(document.documentElement.style.overflow).toBe('hidden');
    await userEvent.keyboard('{Escape}');

    await expect.element(page.getByRole('dialog', { name: 'Project details' })).not.toBeInTheDocument();
    expect(document.documentElement.style.overflow).toBe('');
    await expect.element(trigger).toHaveFocus();
  });

  test('popover ignores a real secondary click outside', async () => {
    await render(PopoverFixture);
    const trigger = page.getByRole('button', { name: 'Display options' });

    await trigger.click();
    await page.getByRole('button', { name: 'Outside' }).click({ button: 'right' });

    await expect.element(page.getByText('Popover content')).toBeInTheDocument();
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('resizable separator responds to native keyboard events and clamps at its limits', async () => {
    await render(AesirResizablePanels, { size: 50, min: 40, max: 60, label: 'Resize workspace' });
    const separator = page.getByRole('separator', { name: 'Resize workspace' });

    separator.element().focus();
    await expect.element(separator).toHaveFocus();
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}{ArrowRight}{End}{ArrowRight}');

    await expect.element(separator).toHaveAttribute('aria-valuenow', '60');
    await expect.element(separator).toHaveAttribute('aria-valuemin', '40');
    await expect.element(separator).toHaveAttribute('aria-valuemax', '60');
  });
});
