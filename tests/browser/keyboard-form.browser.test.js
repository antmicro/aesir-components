import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, test } from 'vitest';
import KeyboardFormFixture from '../fixtures/keyboard-form-fixture.svelte';

describe('keyboard navigation across a mixed form', () => {
  test('follows native Tab order, skips disabled controls, and preserves form values', async () => {
    await render(KeyboardFormFixture);
    const project = page.getByRole('textbox', { name: 'Project' });
    project.element().focus();

    await userEvent.keyboard('{Tab}');
    await expect.element(page.getByRole('checkbox', { name: 'Updates' })).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect.element(page.getByRole('checkbox', { name: 'Updates' })).toBeChecked();

    await userEvent.keyboard('{Tab}');
    await expect.element(page.getByRole('radio', { name: 'Free' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(page.getByRole('radio', { name: 'Pro' })).toBeChecked();

    await userEvent.keyboard('{Tab}');
    await expect.element(page.getByRole('switch', { name: 'Alerts' })).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect.element(page.getByRole('switch', { name: 'Alerts' })).toBeChecked();

    await userEvent.keyboard('{Tab}');
    await expect.element(page.getByRole('combobox', { name: 'Region' })).toHaveFocus();
    await userEvent.keyboard('u');
    await expect.element(page.getByRole('combobox', { name: 'Region' })).toHaveValue('us');

    const values = Object.fromEntries(new FormData(page.getByRole('form', { name: 'Keyboard workflow' }).element()));
    expect(values).toMatchObject({ project: 'Aesir', updates: 'yes', plan: 'pro', alerts: 'enabled', region: 'us' });
    expect(values).not.toHaveProperty('locked');
  });

  test('returns focus from a menu, then continues through autocomplete to submit', async () => {
    await render(KeyboardFormFixture);
    const actions = page.getByRole('button', { name: 'Actions' });
    actions.element().focus();
    await userEvent.keyboard('{Enter}');
    await expect.element(page.getByRole('menu', { name: 'Workflow actions' })).toBeInTheDocument();
    await expect.element(page.getByRole('menuitem', { name: 'Save draft' })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}{Escape}');
    await expect.element(actions).toHaveFocus();
    await userEvent.keyboard('{Tab}');
    const city = page.getByRole('combobox', { name: 'City' });
    await expect.element(city).toHaveFocus();
    await userEvent.keyboard('Pra{Enter}');
    await expect.element(city).toHaveValue('Prague');

    await userEvent.keyboard('{Tab}');
    await expect.element(page.getByRole('button', { name: 'Clear' })).toHaveFocus();
    await userEvent.keyboard('{Tab}');
    const submit = page.getByRole('button', { name: 'Submit workflow' });
    await expect.element(submit).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect.element(page.getByRole('status', { name: 'Submit count' })).toHaveTextContent('1');
  });

  test('Shift+Tab reverses across the menu trigger and native select', async () => {
    await render(KeyboardFormFixture);
    const city = page.getByRole('combobox', { name: 'City' });
    city.element().focus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    await expect.element(page.getByRole('button', { name: 'Actions' })).toHaveFocus();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    await expect.element(page.getByRole('combobox', { name: 'Region' })).toHaveFocus();
  });
});
