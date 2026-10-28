import axe from 'axe-core';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { describe, expect, test } from 'vitest';
import CommandMenuFixture from '../fixtures/command-menu-fixture.svelte';
import ComboboxInputsFixture from '../fixtures/combobox-inputs-fixture.svelte';
import CompositeNavigationFixture from '../fixtures/composite-navigation-fixture.svelte';
import ContextMenuFixture from '../fixtures/context-menu-fixture.svelte';
import DatePickerContractsFixture from '../fixtures/date-picker-contracts-fixture.svelte';
import DialogFixture from '../fixtures/dialog-fixture.svelte';
import DrawerFixture from '../fixtures/drawer-fixture.svelte';
import DropdownFixture from '../fixtures/dropdown-fixture.svelte';
import FormControlsFixture from '../fixtures/form-controls-fixture.svelte';
import VisualRegressionFixture from '../fixtures/visual-regression-fixture.svelte';
import AdvancedFormFixture from '../fixtures/advanced-form-fixture.svelte';
import AlertDialogFixture from '../fixtures/alert-dialog-fixture.svelte';
import SelectFixture from '../fixtures/select-fixture.svelte';
import { applyTheme } from './setup.js';

const expectNoA11yViolations = async () => {
  const results = await axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    rules: { 'color-contrast': { enabled: false } }
  });
  expect(
    results.violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      targets: nodes.map((node) => node.target.join(' '))
    }))
  ).toEqual([]);
};

describe('automated accessibility audits', () => {
  test('form controls have no WCAG A/AA violations', async () => {
    await render(FormControlsFixture);
    await expectNoA11yViolations();
  });

  test('segmented fields and an open hover card have no WCAG A/AA violations', async () => {
    await render(AdvancedFormFixture);
    page.getByRole('button', { name: 'Preview item' }).element().focus();
    await expect.element(page.getByRole('group', { name: 'Preview' })).toBeInTheDocument();
    await expectNoA11yViolations();
  });

  test('composite navigation has no WCAG A/AA violations', async () => {
    await render(CompositeNavigationFixture);
    await expectNoA11yViolations();
  });

  test('an open dropdown has no WCAG A/AA violations', async () => {
    await render(DropdownFixture);
    await page.getByRole('button', { name: 'Actions' }).click();
    await expect.element(page.getByRole('menu', { name: 'Project actions' })).toBeInTheDocument();
    await expectNoA11yViolations();
  });

  test('an open dialog has no WCAG A/AA violations', async () => {
    await render(DialogFixture);
    await page.getByRole('button', { name: 'Open settings' }).click();
    await expect.element(page.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    await expectNoA11yViolations();
  });

  test('an open alert dialog has no WCAG A/AA violations', async () => {
    await render(AlertDialogFixture);
    await page.getByRole('button', { name: 'Delete project' }).click();
    await expect.element(page.getByRole('alertdialog', { name: 'Delete project?' })).toBeInTheDocument();
    await expectNoA11yViolations();
  });

  test('an open command menu has no WCAG A/AA violations', async () => {
    await render(CommandMenuFixture);
    await page.getByRole('button', { name: 'Open commands' }).click();
    await expect.element(page.getByRole('dialog', { name: 'Command menu' })).toBeInTheDocument();
    await expectNoA11yViolations();
  });

  test('an open autocomplete has no WCAG A/AA violations', async () => {
    await render(ComboboxInputsFixture);
    await page.getByRole('combobox', { name: 'City' }).click();
    await expect.element(page.getByRole('listbox')).toBeInTheDocument();
    await expectNoA11yViolations();
  });

  test('an open grouped select has no WCAG A/AA violations', async () => {
    await render(SelectFixture);
    await page.getByRole('combobox', { name: 'Region', exact: true }).click();
    await expect.element(page.getByRole('listbox', { name: 'Region', exact: true })).toBeInTheDocument();
    await expectNoA11yViolations();
  });

  test('an open date picker has no WCAG A/AA violations', async () => {
    await render(DatePickerContractsFixture);
    await page.getByRole('button', { name: /Release date/ }).click();
    await expect.element(page.getByRole('dialog', { name: 'Choose date' })).toBeInTheDocument();
    await expectNoA11yViolations();
  });

  test('an open drawer has no WCAG A/AA violations', async () => {
    await render(DrawerFixture);
    await page.getByRole('button', { name: 'Open details' }).click();
    await expect.element(page.getByRole('dialog', { name: 'Project details' })).toBeInTheDocument();
    await expectNoA11yViolations();
  });

  test('an open context menu has no WCAG A/AA violations', async () => {
    await render(ContextMenuFixture);
    await page.getByRole('button', { name: 'File surface' }).click({ button: 'right' });
    await expect.element(page.getByRole('menu', { name: 'File actions' })).toBeInTheDocument();
    await expectNoA11yViolations();
  });

  test.each(['light', 'dark'])('%s theme maintains text contrast in the visual fixture', async (theme) => {
    applyTheme(theme);
    await render(VisualRegressionFixture, { width: 360 });
    const results = await axe.run(page.getByTestId('visual-surface').element(), {
      runOnly: { type: 'rule', values: ['color-contrast'] }
    });

    expect(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target.join(' ')) }))).toEqual([]);
  });
});
