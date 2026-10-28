import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import CommandMenuFixture from './fixtures/command-menu-fixture.svelte';
import DynamicCommandMenuFixture from './fixtures/command-menu-dynamic-fixture.svelte';
import NestedDynamicCommandMenuFixture from './fixtures/command-menu-nested-dynamic-fixture.svelte';
import DuplicateLabelCommandMenuFixture from './fixtures/command-menu-duplicate-label-fixture.svelte';
import UnlabeledGroupsCommandMenuFixture from './fixtures/command-menu-unlabeled-groups-fixture.svelte';

describe('AesirCommandMenu', () => {
  test('renders and searches commands across groups with absent or repeated labels', async () => {
    const user = userEvent.setup();
    render(UnlabeledGroupsCommandMenuFixture);

    await user.click(screen.getByRole('button', { name: 'Open commands' }));
    expect(await screen.findByRole('option', { name: 'Alpha' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Beta' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Gamma' })).toBeTruthy();
    const search = screen.getByRole('combobox', { name: 'Search commands' });
    await user.type(search, 'del');
    await user.click(screen.getByRole('option', { name: 'Delta' }));
    expect(screen.getByRole('status', { name: 'Selected command' }).textContent).toBe('delta');
  });

  test('focuses search, navigates enabled commands, selects, and restores focus', async () => {
    const user = userEvent.setup();
    render(CommandMenuFixture);
    const trigger = screen.getByRole('button', { name: 'Open commands' });

    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Command menu' });
    const search = screen.getByRole('combobox', { name: 'Search commands' });

    expect(dialog.closest('body')).toBe(document.body);
    expect(document.documentElement.dataset.overlayOpen).toBe('true');
    expect(getComputedStyle(document.documentElement).overflow).toBe('hidden');
    await waitFor(() => expect(document.activeElement).toBe(search));
    expect(search.getAttribute('aria-activedescendant')).toContain('-item-0');

    await user.keyboard('{ArrowDown}{Enter}');

    expect(screen.getByRole('status', { name: 'Command menu state' }).textContent).toBe('open');
    expect(screen.getByRole('button', { name: 'Back to previous commands' })).toBeTruthy();
    expect(search.getAttribute('placeholder')).toBe('Type a command or search…');

    await user.keyboard('{Enter}');
    expect(screen.getByRole('status', { name: 'Selected command' }).textContent).toBe('aesir');
    expect(screen.getByRole('status', { name: 'Command menu state' }).textContent).toBe('closed');
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  test('filters commands and closes from the backdrop', async () => {
    const user = userEvent.setup();
    render(CommandMenuFixture);

    await user.click(screen.getByRole('button', { name: 'Open commands' }));
    const search = await screen.findByRole('combobox', { name: 'Search commands' });
    await user.type(search, 'create');

    expect(screen.getByRole('option', { name: 'Create issue' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'Delete project' })).toBeNull();

    const dialog = screen.getByRole('dialog', { name: 'Command menu' });
    await fireEvent.pointerDown(dialog.parentElement);
    expect(screen.getByRole('status', { name: 'Command menu state' }).textContent).toBe('closed');
  });

  test('skips disabled commands and supports Home and End navigation', async () => {
    const user = userEvent.setup();
    render(CommandMenuFixture);
    await user.click(screen.getByRole('button', { name: 'Open commands' }));
    const search = await screen.findByRole('combobox', { name: 'Search commands' });

    expect(screen.getByRole('option', { name: 'Delete project' }).hasAttribute('disabled')).toBe(true);
    await user.keyboard('{End}');
    expect(search.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'Switch project' }).id);
    await user.keyboard('{Home}');
    expect(search.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'Create issue' }).id);
  });

  test('shows the empty state and uses Escape to leave a nested page before closing', async () => {
    const user = userEvent.setup();
    render(CommandMenuFixture);
    await user.click(screen.getByRole('button', { name: 'Open commands' }));
    const search = await screen.findByRole('combobox', { name: 'Search commands' });

    await user.type(search, 'nothing matches');
    expect(screen.getByText('No commands found.')).toBeTruthy();
    expect(search.hasAttribute('aria-activedescendant')).toBe(false);

    await user.clear(search);
    await user.keyboard('{End}{Enter}');
    expect(screen.getByRole('button', { name: 'Back to previous commands' })).toBeTruthy();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('button', { name: 'Back to previous commands' })).toBeNull();
    expect(screen.getByRole('status', { name: 'Command menu state' }).textContent).toBe('open');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('status', { name: 'Command menu state' }).textContent).toBe('closed');
  });

  test('does not activate disabled commands through synthetic clicks', async () => {
    const user = userEvent.setup();
    render(CommandMenuFixture);

    await user.click(screen.getByRole('button', { name: 'Open commands' }));
    const disabled = await screen.findByRole('option', { name: 'Delete project' });
    disabled.click();

    expect(screen.getByRole('status', { name: 'Selected command' }).textContent).toBe('none');
    expect(screen.getByRole('status', { name: 'Command menu state' }).textContent).toBe('open');
  });

  test('keeps an empty result stable during keyboard navigation and submission', async () => {
    const user = userEvent.setup();
    render(CommandMenuFixture);

    await user.click(screen.getByRole('button', { name: 'Open commands' }));
    const search = await screen.findByRole('combobox', { name: 'Search commands' });
    await user.type(search, 'nothing matches');
    await user.keyboard('{ArrowDown}{ArrowUp}{Home}{End}{Enter}');

    expect(screen.getByText('No commands found.')).toBeTruthy();
    expect(search.hasAttribute('aria-activedescendant')).toBe(false);
    expect(screen.getByRole('status', { name: 'Selected command' }).textContent).toBe('none');
    expect(screen.getByRole('status', { name: 'Command menu state' }).textContent).toBe('open');
  });

  test('clears nested navigation and search state after closing and reopening', async () => {
    const user = userEvent.setup();
    render(CommandMenuFixture);
    const trigger = screen.getByRole('button', { name: 'Open commands' });

    await user.click(trigger);
    const search = await screen.findByRole('combobox', { name: 'Search commands' });
    await user.keyboard('{End}{Enter}');
    await user.type(search, 'Aes');
    await user.keyboard('{Escape}{Escape}');
    await user.click(trigger);

    expect(screen.getByRole('combobox', { name: 'Search commands' }).value).toBe('');
    expect(screen.queryByRole('button', { name: 'Back to previous commands' })).toBeNull();
    expect(screen.getByRole('option', { name: 'Create issue' })).toBeTruthy();
  });

  test('releases the modal lock and portal when unmounted open', async () => {
    const user = userEvent.setup();
    const { unmount } = render(CommandMenuFixture);

    await user.click(screen.getByRole('button', { name: 'Open commands' }));
    await screen.findByRole('dialog', { name: 'Command menu' });
    unmount();

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Command menu' })).toBeNull());
    expect(document.documentElement.dataset.overlayOpen).toBeUndefined();
    expect(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))).not.toThrow();
  });

  test('keeps the highlighted command when options reorder and falls back if it disappears', async () => {
    const user = userEvent.setup();
    render(DynamicCommandMenuFixture);

    await user.click(screen.getByRole('button', { name: 'Open commands' }));
    const search = await screen.findByRole('combobox', { name: 'Search commands' });
    await user.keyboard('{ArrowDown}');
    expect(search.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'Beta' }).id);

    await user.click(screen.getByRole('button', { name: 'Reorder commands' }));
    expect(search.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'Beta' }).id);
    search.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('status', { name: 'Selected command' }).textContent).toBe('beta');

    await user.click(screen.getByRole('button', { name: 'Open commands' }));
    const reopenedSearch = await screen.findByRole('combobox', { name: 'Search commands' });
    expect(reopenedSearch.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'Beta' }).id);

    await user.click(screen.getByRole('button', { name: 'Remove Beta' }));
    expect(reopenedSearch.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'Alpha' }).id);
    reopenedSearch.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('status', { name: 'Selected command' }).textContent).toBe('alpha');
  });

  test('updates a nested page when its parent supplies a new group tree', async () => {
    const user = userEvent.setup();
    render(NestedDynamicCommandMenuFixture);

    await user.click(screen.getByRole('button', { name: 'Open commands' }));
    await user.click(await screen.findByRole('option', { name: 'Nested commands' }));
    expect(screen.getByRole('option', { name: 'Old command' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Replace nested commands' }));
    expect(screen.queryByRole('option', { name: 'Old command' })).toBeNull();
    await user.click(screen.getByRole('option', { name: 'New command' }));
    expect(screen.getByRole('status', { name: 'Selected command' }).textContent).toBe('new');
  });

  test('keeps duplicate labels distinct across nested navigation and prop replacement', async () => {
    const user = userEvent.setup();
    render(DuplicateLabelCommandMenuFixture);

    await user.click(screen.getByRole('button', { name: 'Open commands' }));
    const matches = await screen.findAllByRole('option', { name: /Workspace/ });
    expect(matches).toHaveLength(2);
    await fireEvent.pointerMove(matches[1]);
    expect(screen.getByRole('combobox', { name: 'Search commands' }).getAttribute('aria-activedescendant')).toBe(matches[1].id);
    await user.click(matches[1]);
    expect(screen.getByRole('option', { name: 'Second child' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'First child' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Update second workspace' }));
    expect(screen.getByRole('option', { name: 'Updated second child' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'First child' })).toBeNull();
  });
});
