import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import DropdownFixture from './fixtures/dropdown-fixture.svelte';

describe('AesirDropdown', () => {
  test('blocks the background by default, contains focus, and consumes the dismissal click', async () => {
    const user = userEvent.setup();
    render(DropdownFixture);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    const outside = screen.getByRole('button', { name: 'Outside' });
    await user.click(trigger);
    const edit = await screen.findByRole('menuitem', { name: 'Edit' });
    await waitFor(() => expect(document.activeElement).toBe(edit));
    expect(document.querySelector('[data-aesir-menu-backdrop]')).toBeTruthy();
    expect(document.documentElement.style.overflow).toBe('hidden');
    outside.focus();
    expect(document.activeElement).toBe(edit);
    await user.keyboard('{Tab}');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(edit);
    await user.click(outside);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('status', { name: 'Outside clicks' }).textContent).toBe('0');
    expect(document.querySelector('[data-aesir-menu-backdrop]')).toBeNull();
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.activeElement).toBe(trigger);
    await user.click(outside);
    expect(screen.getByRole('status', { name: 'Outside clicks' }).textContent).toBe('1');
  });

  test('supports a non-modal dropdown that allows the outside click through', async () => {
    const user = userEvent.setup();
    render(DropdownFixture, { props: { modal: false } });
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(document.querySelector('[data-aesir-menu-backdrop]')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.getByRole('status', { name: 'Outside clicks' }).textContent).toBe('1');
  });
  test('opens through the keyboard, moves focus, selects, and restores focus', async () => {
    const user = userEvent.setup();
    render(DropdownFixture);
    const trigger = screen.getByRole('button', { name: 'Actions' });

    trigger.focus();
    await user.keyboard('{ArrowDown}');

    const menu = await screen.findByRole('menu', { name: 'Project actions' });
    const edit = screen.getByRole('menuitem', { name: 'Edit' });
    const duplicate = screen.getByRole('menuitem', { name: 'Duplicate' });

    expect(menu.parentElement).toBe(document.body);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    await waitFor(() => expect(document.activeElement).toBe(edit));

    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(duplicate);
    await user.keyboard('{Enter}');

    expect(screen.getByRole('status', { name: 'Selected action' }).textContent).toBe('duplicate');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  test('closes when a pointer press happens outside the trigger and menu', async () => {
    const user = userEvent.setup();
    render(DropdownFixture);
    const trigger = screen.getByRole('button', { name: 'Actions' });

    await user.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    await fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }));

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  test('the first outside click dismisses without opening a sibling dropdown', async () => {
    const user = userEvent.setup();
    render(DropdownFixture);
    const actions = screen.getByRole('button', { name: 'Actions' });
    const filters = screen.getByRole('button', { name: 'Filters' });

    await user.click(actions);
    expect(actions.getAttribute('aria-expanded')).toBe('true');
    await user.click(filters);

    expect(actions.getAttribute('aria-expanded')).toBe('false');
    expect(filters.getAttribute('aria-expanded')).toBe('false');
    await user.click(filters);
    expect(filters.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getAllByRole('menu').filter((menu) => !menu.inert)).toHaveLength(1);
  });

  test('navigates nested menus and returns focus to the parent item', async () => {
    const user = userEvent.setup();
    render(DropdownFixture);
    const trigger = screen.getByRole('button', { name: 'Actions' });

    trigger.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowRight}');

    const submenu = await screen.findByRole('menu', { name: 'More' });
    const submenuTrigger = screen.getByRole('menuitem', { name: 'More' });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Move' })));

    await user.keyboard('{Escape}');

    expect(submenu.isConnected).toBe(false);
    expect(document.activeElement).toBe(submenuTrigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  test('opens from the end with ArrowUp and supports Home, End, and typeahead', async () => {
    const user = userEvent.setup();
    render(DropdownFixture);
    const trigger = screen.getByRole('button', { name: 'Actions' });

    trigger.focus();
    await user.keyboard('{ArrowUp}');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'More' })));

    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Edit' }));
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'More' }));
    await user.keyboard('d');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Duplicate' }));
  });

  test('closes on Tab without stealing the browser focus order', async () => {
    const user = userEvent.setup();
    render(DropdownFixture, { props: { modal: false } });
    const trigger = screen.getByRole('button', { name: 'Actions' });

    trigger.focus();
    await user.keyboard('{ArrowDown}{Tab}');

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Outside' }));
  });

  test('can keep a multi-select menu open while toggling checkbox items', async () => {
    const user = userEvent.setup();
    render(DropdownFixture);
    const trigger = screen.getByRole('button', { name: 'Filters' });

    await user.click(trigger);
    const todo = screen.getByRole('menuitemcheckbox', { name: 'Todo' });
    await user.click(todo);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('status', { name: 'Selected filters' }).textContent).toBe('Todo');
    expect(screen.getByRole('menuitemcheckbox', { name: 'Todo' }).getAttribute('aria-checked')).toBe('true');
  });

  test('skips disabled items for arrow navigation and typeahead', async () => {
    const user = userEvent.setup();
    render(DropdownFixture);
    const trigger = screen.getByRole('button', { name: 'Actions' });

    trigger.focus();
    await user.keyboard('{ArrowUp}');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'More' })));
    await user.keyboard('{ArrowDown}');

    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Edit' }));
    await user.keyboard('a');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Edit' }));
  });

  test('does not select a disabled item after a synthetic click', async () => {
    const user = userEvent.setup();
    render(DropdownFixture);

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    const archive = screen.getByRole('menuitem', { name: 'Archive' });
    await fireEvent.click(archive);

    expect(screen.getByRole('status', { name: 'Selected action' }).textContent).toBe('none');
    expect(screen.getByRole('button', { name: 'Actions' }).getAttribute('aria-expanded')).toBe('true');
  });

  test('closes the root menu with Escape and restores trigger focus', async () => {
    const user = userEvent.setup();
    render(DropdownFixture);
    const trigger = screen.getByRole('button', { name: 'Actions' });

    await user.click(trigger);
    await screen.findByRole('menu', { name: 'Project actions' });
    await user.keyboard('{Escape}');

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  test('does not retain an open submenu after closing and reopening', async () => {
    const user = userEvent.setup();
    render(DropdownFixture);
    const trigger = screen.getByRole('button', { name: 'Actions' });

    trigger.focus();
    await user.keyboard('{ArrowDown}{End}{ArrowRight}');
    await screen.findByRole('menu', { name: 'More' });
    await user.keyboard('{Escape}{Escape}');
    await user.click(trigger);

    expect(screen.queryByRole('menu', { name: 'More' })).toBeNull();
    expect(screen.getByRole('menu', { name: 'Project actions' })).toBeTruthy();
  });
});
