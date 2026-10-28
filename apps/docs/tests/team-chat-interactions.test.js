import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import { compile } from 'svelte/compiler';
import { resolve } from 'node:path';
import workspaceSource from '../src/lib/components/docs/examples/team-chat/team-chat-pattern-example.svelte?raw';
import detailsSource from '../src/lib/components/docs/examples/team-chat/team-chat-channel-details.svelte?raw';
import addPeopleSource from '../src/lib/components/docs/examples/team-chat/team-chat-add-people.svelte?raw';
import scrollAreaSource from '../../../packages/aesir-svelte/src/components/aesir-scroll-area/aesir-scroll-area.svelte?raw';
import newMessageSource from '../src/lib/components/docs/examples/team-chat/team-chat-new-message.svelte?raw';
import personOptionSource from '../src/lib/components/docs/examples/team-chat/team-chat-person-option.svelte?raw';
import searchSource from '../src/lib/components/docs/examples/team-chat/team-chat-search.svelte?raw';
import highlightSource from '../src/lib/components/docs/examples/team-chat/team-chat-search-highlight.svelte?raw';
import mobileSource from '../src/lib/components/docs/examples/team-chat/team-chat-mobile.svelte?raw';
import sidebarHeaderSource from '../src/lib/components/docs/examples/team-chat/team-chat-sidebar-header.svelte?raw';
import sidebarSource from '../../../packages/aesir-svelte/src/components/aesir-sidebar/aesir-sidebar.svelte?raw';
import composerSource from '../src/lib/components/docs/examples/team-chat/team-chat-composer.svelte?raw';
import messageSource from '../src/lib/components/docs/examples/team-chat/team-chat-message.svelte?raw';
import buttonSource from '../../../packages/aesir-svelte/src/components/aesir-button/aesir-button.svelte?raw';
import buttonGroupSource from '../../../packages/aesir-svelte/src/components/aesir-button-group/aesir-button-group.svelte?raw';
import draftsSource from '../src/lib/components/docs/examples/team-chat/team-chat-drafts.svelte?raw';
import toggleSource from '../../../packages/aesir-svelte/src/components/aesir-toggle/aesir-toggle.svelte?raw';
import commandMenuSource from '../../../packages/aesir-svelte/src/components/aesir-command-menu/aesir-command-menu.svelte?raw';
import { createStorage } from './storage.js';
import { conversations as demoConversations, people as demoPeople, initialMessages as demoMessages } from '../src/lib/components/docs/examples/team-chat/team-chat-demo.js';

let component;
let target;
let resizeWorkspace;
let layoutStyles;
const button = (label, root = document) => [...root.querySelectorAll('button')].find((node) => node.getAttribute('aria-label') === label);
const message = (id) => document.querySelector(`[data-message-id="${id}"]`);
async function click(node) {
  expect(node).toBeTruthy();
  node.click();
  await tick();
}
async function type(input, value) {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await tick();
}
const accountTrigger = () => [...target.querySelectorAll('.team-chat__topbar button')].find((node) => node.getAttribute('aria-label')?.endsWith("'s account menu"));
const menuItem = (name) => [...document.querySelectorAll('[role^="menuitem"]')].find((node) => node.textContent.trim() === name);
async function openOwnProfile() {
  const trigger = accountTrigger();
  await click(trigger);
  await click([...document.querySelectorAll('[role="menuitem"]')].find((node) => node.textContent.includes('· Profile')));
  await vi.waitFor(() => expect(document.querySelector('.chat-profile')).toBeTruthy());
  await vi.waitFor(() => expect(document.querySelector('[role="menu"][aria-label="Account options"]')).toBeNull());
  return trigger;
}

beforeEach(async () => {
  vi.stubGlobal('localStorage', createStorage());
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback) {
        this.callback = callback;
      }
      observe(node) {
        if (node.matches('.team-chat')) resizeWorkspace = (width) => this.callback([{ contentRect: { width } }]);
      }
      disconnect() {}
      unobserve() {}
    }
  );
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 160, 40));
  HTMLElement.prototype.scrollIntoView = vi.fn();
  target = document.createElement('div');
  document.body.append(target);
  const { default: TeamChat } = await import('../src/lib/components/docs/examples/team-chat/team-chat-pattern-example.svelte');
  component = mount(TeamChat, { target });
  flushSync();
});

afterEach(async () => {
  if (component) await unmount(component);
  target?.remove();
  layoutStyles?.remove();
  layoutStyles = undefined;
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('team chat interactions', () => {
  const newMessageButton = () => button('New message', target.querySelector('.aesir-sidebar__desktop'));
  async function openNewMessage() {
    await click(newMessageButton());
    await vi.waitFor(() => expect(document.querySelector('.new-message-recipient-popover[data-state="open"]')).toBeTruthy());
  }
  const recipientInput = () => document.querySelector('[aria-label="Choose people or a channel"]');
  const recipientCheckbox = (name) =>
    [...document.querySelectorAll('.new-message-options input[type="checkbox"]')].find((node) => document.getElementById(node.getAttribute('aria-labelledby'))?.textContent === name);
  const sidebarConversation = (name) => [...target.querySelectorAll('.aesir-sidebar__desktop .aesir-sidebar__item')].find((node) => node.textContent.includes(name));
  const mobileTab = (name) => [...target.querySelectorAll('.mobile-tab')].find((node) => node.textContent.trim().endsWith(name));
  async function enterMobile(width = 390) {
    resizeWorkspace(width);
    await tick();
  }
  const desktopDestination = (name) => [...target.querySelectorAll('.desktop-navigation button')].find((node) => node.textContent.trim() === name);

  it('switches desktop sidebars from the navigation rail without replacing the open conversation', async () => {
    const rail = target.querySelector('[aria-label="Workspace navigation"]');
    expect([...rail.querySelectorAll('button')].map((node) => node.textContent.trim())).toEqual(['Home', 'DMs', 'Activity', 'More']);
    expect(desktopDestination('Home').getAttribute('aria-current')).toBe('page');
    expect(desktopDestination('DMs').querySelector('.destination-dot')).toBeTruthy();
    await click(desktopDestination('DMs'));
    expect(target.querySelector('.aesir-sidebar')).toBeNull();
    const panel = target.querySelector('[aria-label="DMs sidebar"]');
    expect(panel.querySelector('[aria-label="Quick direct messages"]')).toBeNull();
    expect(panel.querySelector('[aria-label="Search direct messages"]')).toBeTruthy();
    expect(panel.querySelector('.mobile-tabbar')).toBeNull();
    expect(document.activeElement).toBe(panel.querySelector('[data-mobile-heading]'));
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('design-system');
    await click(button('Open Morgan Chen', panel));
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('Morgan Chen');
    expect(button('Open Morgan Chen', panel).getAttribute('aria-current')).toBe('page');
    await type(target.querySelector('.conversation-composer textarea'), 'Keep this draft while switching views');
    await click(desktopDestination('Activity'));
    expect(target.querySelector('[aria-label="Activity sidebar"] [aria-label="Filter activity"]')).toBeTruthy();
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep this draft while switching views');
    await click(desktopDestination('More'));
    await click(button('Open drafts', target.querySelector('[aria-label="More sidebar"]')));
    expect(target.querySelector('[data-draft-id="dm-morgan"]').textContent).toContain('Keep this draft');
    await click(desktopDestination('Home'));
    expect(target.querySelector('.aesir-sidebar__desktop')).toBeTruthy();
    expect(document.activeElement).toBe(target.querySelector('.sidebar-header input'));
    expect(target.querySelector('.desktop-navigation-panel')).toBeNull();
  });

  it('keeps desktop navigation usable when the current sidebar is collapsed', async () => {
    await click(desktopDestination('DMs'));
    await click(button('Collapse conversations'));
    expect(target.querySelector('.desktop-navigation-panel').hidden).toBe(true);
    expect(target.querySelector('.desktop-navigation')).toBeTruthy();
    await click(desktopDestination('Activity'));
    expect(target.querySelector('.desktop-navigation-panel').hidden).toBe(false);
    const activity = target.querySelector('.mobile-row--activity');
    await click(activity);
    expect(target.querySelector('.chat-message.is-highlighted')).toBeTruthy();
    expect(desktopDestination('Activity').getAttribute('aria-current')).toBe('page');
    await click(button('Collapse conversations'));
    await click(button('Expand conversations'));
    expect(target.querySelector('.desktop-navigation-panel').hidden).toBe(false);
  });

  it.each([760, 1000, 1280])('shares desktop sidebar header geometry and retains resized widths between destinations at %ipx', async (width) => {
    layoutStyles = document.createElement('style');
    layoutStyles.textContent = [
      [workspaceSource, resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-pattern-example.svelte')],
      [mobileSource, resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-mobile.svelte')],
      [sidebarHeaderSource, resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-sidebar-header.svelte')],
      [sidebarSource, resolve(import.meta.dirname, '../../../packages/aesir-svelte/dist/components/aesir-sidebar/aesir-sidebar.svelte')]
    ]
      .map(([source, filename]) => compile(source, { filename, generate: 'client' }).css.code)
      .join('\n');
    document.head.append(layoutStyles);
    await enterMobile(width);
    const workspace = target.querySelector('.team-chat');
    expect(getComputedStyle(target.querySelector('.aesir-sidebar__desktop')).padding).toBe('0px');
    expect(getComputedStyle(target.querySelector('.aesir-sidebar__header')).padding).toBe('0px');
    expect(workspace.style.getPropertyValue('--chat-sidebar-width')).toBe('320px');
    const header = () => target.querySelector('.chat-sidebar-heading');
    const geometry = () => {
      const style = getComputedStyle(header());
      const title = getComputedStyle(header().querySelector('h2'));
      return [style.height, style.boxSizing, style.padding, style.alignItems, title.fontSize, title.fontWeight, title.lineHeight];
    };
    const originalGeometry = geometry();
    expect(originalGeometry[0]).toBe('var(--ds-spacing-14)');
    expect(originalGeometry[1]).toBe('border-box');
    const resizer = target.querySelector('[aria-label="Resize navigation"]');
    resizer.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
    resizer.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    await tick();
    const resizedWidth = resizer.getAttribute('aria-valuenow');
    expect(Number(resizedWidth)).toBeLessThan(320);
    for (const destination of ['DMs', 'Activity', 'More']) {
      await click(desktopDestination(destination));
      expect(header().querySelector('h2').textContent).toBe(destination);
      expect(geometry()).toEqual(originalGeometry);
      expect(header().querySelector('button svg').getAttribute('width')).toBe('16');
      expect(workspace.style.getPropertyValue('--chat-sidebar-width')).toBe(`${resizedWidth}px`);
      expect(getComputedStyle(target.querySelector('.desktop-navigation-panel')).width).toBe('var(--chat-sidebar-width)');
    }
    await click(desktopDestination('Home'));
    expect(header().querySelector('h2').textContent).toBe('Conversations');
    expect(geometry()).toEqual(originalGeometry);
    expect(target.querySelector('[aria-label="Resize navigation"]').getAttribute('aria-valuenow')).toBe(resizedWidth);
  });

  it('searches desktop DMs by conversation and participant names without a people strip or losing drafts', async () => {
    await type(target.querySelector('.conversation-composer textarea'), 'Keep this channel draft');
    await click(desktopDestination('DMs'));
    const panel = target.querySelector('[aria-label="DMs sidebar"]');
    let input = panel.querySelector('[aria-label="Search direct messages"]');
    expect(input.closest('.aesir-input')).toBeTruthy();
    expect(panel.querySelector('.dm-people')).toBeNull();
    expect(panel.querySelector('[aria-label="Order people"]')).toBeNull();
    expect(input.closest('.mobile-scroll')).toBeNull();
    await type(input, 'morgan');
    const results = [...panel.querySelectorAll('.mobile-row--preview')];
    expect(results.map((row) => row.getAttribute('aria-label'))).toEqual(['Open Morgan Chen', 'Open Casey Nguyen, Morgan Chen, Zoë Fischer']);
    expect(panel.querySelector('[role="status"]').textContent).toBe('2 conversations found');
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(results[0]);
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await tick();
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('Morgan Chen');
    await vi.waitFor(() => expect(document.activeElement).toBe(target.querySelector('.conversation-composer textarea')));
    expect(input.value).toBe('morgan');
    await type(target.querySelector('.conversation-composer textarea'), 'Keep this DM draft');
    await click(desktopDestination('Activity'));
    await click(desktopDestination('DMs'));
    input = panel.querySelector('[aria-label="Search direct messages"]');
    expect(input.value).toBe('morgan');
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep this DM draft');
    await click(button('Clear direct message search', panel));
    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);
    expect(panel.querySelectorAll('.mobile-row--preview')).toHaveLength(demoConversations.filter((room) => room.type !== 'channel').length);
    await type(input, 'quinn');
    expect(button('Open Support handoff', panel)).toBeTruthy();
    await type(input, 'no such conversation');
    expect(panel.querySelector('.mobile-empty h3').textContent).toBe('No conversations found');
    expect(panel.querySelectorAll('.mobile-row--preview')).toHaveLength(0);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await tick();
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('Morgan Chen');
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await tick();
    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);
    await click(desktopDestination('Home'));
    await click(sidebarConversation('# design-system'));
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep this channel draft');
  });

  it('shares the selected destination across desktop and mobile navigation', async () => {
    await click(desktopDestination('DMs'));
    await enterMobile();
    expect(target.querySelector('.desktop-navigation')).toBeNull();
    expect(mobileTab('DMs').getAttribute('aria-current')).toBe('page');
    await click(mobileTab('Activity'));
    await enterMobile(1000);
    expect(target.querySelector('.mobile-tabbar')).toBeNull();
    expect(desktopDestination('Activity').getAttribute('aria-current')).toBe('page');
    expect(target.querySelector('[aria-label="Activity sidebar"]')).toBeTruthy();
    expect(target.querySelector('.conversation')).toBeTruthy();
  });
  const addPeopleInput = () => document.querySelector('[aria-label="Find people to add"]');
  async function selectPersonToAdd(name) {
    await type(addPeopleInput(), name);
    await click(button(`Select ${name}`));
    await vi.waitFor(() => expect(document.activeElement).toBe(addPeopleInput()));
  }
  async function cancelAddPeople() {
    await click([...document.querySelectorAll('.chat-add-people-dialog .aesir-dialog__footer button')].find((node) => node.textContent.trim() === 'Cancel'));
    await vi.waitFor(() => expect(document.querySelector('.chat-add-people-dialog')).toBeNull());
  }

  it.each([320, 390, 600, 759])('replaces the sidebar with a four-tab capsule and separate search at %s px', async (width) => {
    await enterMobile(width);
    expect(target.querySelector('.aesir-sidebar')).toBeNull();
    expect(document.querySelector('.aesir-drawer')).toBeNull();
    expect(button('Open conversations')).toBeUndefined();
    expect(target.querySelector('.conversation')).toBeNull();
    expect([...target.querySelectorAll('.mobile-tab-pill .mobile-tab')].map((node) => node.lastElementChild.textContent)).toEqual(['Home', 'DMs', 'Activity', 'More']);
    expect(mobileTab('Search').parentElement).toBe(target.querySelector('.mobile-tabbar'));
    expect(mobileTab('Search').querySelector('.sr-only').textContent).toBe('Search');
    expect(mobileTab('Search').getAttribute('aria-label')).toBe('Search');
    expect(mobileTab('Home').getAttribute('aria-current')).toBe('page');
    expect(mobileTab('DMs').querySelector('.tab-dot').textContent).toBe('');
    expect(mobileTab('DMs').getAttribute('aria-label')).toBe('DMs, unread');
    expect(target.querySelector('.mobile-tabbar').textContent).not.toMatch(/\d/);
    for (const icon of target.querySelectorAll('.mobile-tabbar .mobile-tab svg')) {
      expect(icon.getAttribute('width')).toBe('16');
      expect(icon.getAttribute('height')).toBe('16');
    }
    expect(button('Open #design-system')).toBeTruthy();
    expect(target.querySelector('.team-chat__topbar h1').textContent).toBe('Home');
    expect(target.querySelector('.mobile-navigation button button')).toBeNull();
  });

  it('opens the More destination and returns to it from drafts, saved messages and scheduled messages', async () => {
    await enterMobile();
    await click(mobileTab('More'));
    expect(target.querySelector('.team-chat__topbar h1').textContent).toBe('More');
    expect(mobileTab('More').getAttribute('aria-current')).toBe('page');
    expect(target.querySelector('[aria-label="More options"]')).toBeTruthy();
    expect(target.querySelector('[aria-label="Search messages, people, and channels"]')).toBeNull();
    const shortcut = (name) => [...target.querySelectorAll('.more-shortcuts button')].find((node) => node.textContent.includes(name));
    for (const name of ['Drafts', 'Saved messages', 'Scheduled messages']) {
      await click(shortcut(name));
      expect(target.querySelector('[data-conversation-heading]').textContent).toContain(name);
      await click(button('Back to More'));
      expect(mobileTab('More').getAttribute('aria-current')).toBe('page');
    }
    const preferences = shortcut('Preferences');
    preferences.focus();
    await click(preferences);
    await vi.waitFor(() => expect(document.querySelector('.chat-preferences')).toBeTruthy());
    await click(button('Close preferences'));
    await vi.waitFor(() => expect(document.querySelector('.chat-preferences')).toBeNull());
    expect(mobileTab('More').getAttribute('aria-current')).toBe('page');
    await click(mobileTab('Search'));
    expect(mobileTab('Search').getAttribute('aria-current')).toBe('page');
    expect(mobileTab('More').getAttribute('aria-current')).toBeNull();
    expect(document.activeElement).toBe(target.querySelector('[aria-label="Search messages, people, and channels"]'));
  });

  it('clears the DM notification dot when its last unread conversation is opened, without clearing channel activity', async () => {
    await enterMobile();
    expect(mobileTab('Home').querySelector('.tab-dot')).toBeTruthy();
    expect(mobileTab('DMs').querySelector('.tab-dot')).toBeTruthy();
    await click(mobileTab('DMs'));
    await click(button('Open Morgan Chen'));
    await click(button('Back to DMs'));
    expect(mobileTab('DMs').querySelector('.tab-dot')).toBeTruthy();
    for (const room of demoConversations.filter((room) => room.type !== 'channel' && room.unread && room.id !== 'dm-morgan')) {
      await click(button(`Open ${room.name}`));
      await click(button('Back to DMs'));
    }
    expect(mobileTab('DMs').querySelector('.tab-dot')).toBeNull();
    expect(mobileTab('DMs').getAttribute('aria-label')).toBe('DMs');
    expect(mobileTab('Home').querySelector('.tab-dot')).toBeTruthy();
    expect(mobileTab('Activity').querySelector('.tab-dot')).toBeTruthy();
    expect(mobileTab('More').querySelector('.tab-dot')).toBeNull();
    expect(mobileTab('Search').querySelector('.tab-dot')).toBeNull();
  });

  it('keeps mobile draft and reply state through Home, DMs, and desktop resize', async () => {
    await enterMobile();
    await click(button('Open #design-system'));
    expect(target.querySelector('.mobile-screen').hidden).toBe(true);
    expect(target.querySelector('.conversation-header').textContent).toContain('design-system');
    await click(button('More message options', message('reply-1')));
    await click(menuItem('Reply'));
    await vi.waitFor(() => expect(target.querySelector('.conversation-composer .chat-quote')).toBeTruthy());
    await type(target.querySelector('.conversation-composer textarea'), 'A mobile reply draft');
    await click(button('Back to Home'));
    expect(target.querySelector('.mobile-screen').hidden).toBe(false);
    expect(button('Open drafts').textContent).toContain('1');
    await click(button('Open drafts'));
    expect(target.querySelector('[data-draft-id="design-system"]').textContent).toContain('A mobile reply draft');
    await click(button('Back to Home'));
    await click(mobileTab('DMs'));
    await click(button('Open Morgan Chen'));
    await type(target.querySelector('.conversation-composer textarea'), 'A DM draft');
    await click(button('Back to DMs'));
    expect(button('Open Morgan Chen').querySelector('.row-preview').textContent).toContain('Draft: A DM draft');
    await click(mobileTab('Home'));
    await click(button('Open #design-system'));
    expect(target.querySelector('.conversation-composer textarea').value).toBe('A mobile reply draft');
    expect(target.querySelector('.conversation-composer .chat-quote').textContent).toContain('Sam Rivera');
    await enterMobile(1000);
    expect(target.querySelector('.mobile-navigation')).toBeNull();
    expect(target.querySelector('.aesir-sidebar__desktop')).toBeTruthy();
    expect(target.querySelector('.conversation-composer textarea').value).toBe('A mobile reply draft');
    expect(target.querySelector('.conversation-composer .chat-quote').textContent).toContain('Sam Rivera');
    expect(target.querySelector('.conversation-composer .chat-composer__formatting')).toBeTruthy();
    await enterMobile();
    expect(target.querySelector('.conversation-composer textarea').value).toBe('A mobile reply draft');
    expect(target.querySelector('.conversation-composer .chat-composer__formatting')).toBeNull();
  });

  it('opens an empty dedicated Drafts screen from desktop and mobile without a message feed or composer', async () => {
    await click(sidebarConversation('Drafts'));
    expect(target.querySelector('.conversation[aria-label="Drafts"]')).toBeTruthy();
    expect(target.querySelector('.drafts-empty').textContent).toContain('No drafts yet');
    expect(target.querySelector('.conversation textarea')).toBeNull();
    expect(target.querySelector('.conversation .date-divider')).toBeNull();
    expect(document.activeElement).toBe(target.querySelector('[data-conversation-heading]'));
    await enterMobile();
    await click(button('Open drafts'));
    expect(target.querySelector('.drafts-empty')).toBeTruthy();
    expect(target.querySelector('.mobile-screen').hidden).toBe(true);
    await click(button('Back to Home'));
    expect(target.querySelector('.mobile-screen').hidden).toBe(false);
    expect(mobileTab('Home').getAttribute('aria-current')).toBe('page');
  });

  it('lists channel, direct and unsent group drafts with previews and restores text, quotes and recipients', async () => {
    await click(button('Reply to Sam Rivera', message('design-2')));
    await type(target.querySelector('.conversation-composer textarea'), '**Channel** reply draft');
    await click(sidebarConversation('Morgan Chen'));
    await type(target.querySelector('.conversation-composer textarea'), 'A private unfinished message');
    await openNewMessage();
    await click(recipientCheckbox('Sam Rivera'));
    await click(recipientCheckbox('Taylor Brooks'));
    await type(target.querySelector('.new-message textarea'), 'Unsent group draft');
    await click(button('Cancel new message'));
    await click(sidebarConversation('Drafts'));
    const rows = [...target.querySelectorAll('[data-draft-id]')];
    expect(rows).toHaveLength(3);
    expect(rows[0].dataset.draftId).toBe('new-message');
    expect(rows[0].textContent).toContain('Sam Rivera, Taylor Brooks');
    expect(rows[0].querySelectorAll('[data-gradient]')).toHaveLength(2);
    expect(sidebarConversation('Sam Rivera, Taylor Brooks')).toBeUndefined();
    expect(target.querySelector('[data-draft-id="dm-morgan"] [data-gradient]')).toBeTruthy();
    const channelDraft = target.querySelector('[data-draft-id="design-system"]');
    expect(channelDraft.querySelector('.draft-preview').textContent).toBe('Channel reply draft');
    expect(channelDraft.querySelector('.draft-reply').textContent).toContain('Replying to Sam Rivera:');
    expect(channelDraft.querySelector('.draft-reply [data-gradient]')).toBeTruthy();
    expect(target.querySelector('.drafts-list button button')).toBeNull();
    expect(target.querySelector('.drafts-list a')).toBeNull();
    expect(sidebarConversation('Drafts').textContent).toContain('3');
    await click(channelDraft);
    expect(target.querySelector('.conversation-composer textarea').value).toBe('**Channel** reply draft');
    expect(target.querySelector('.conversation-composer .chat-quote').textContent).toContain('Sam Rivera');
    expect(document.activeElement).toBe(target.querySelector('.conversation-composer textarea'));
    await click(sidebarConversation('Drafts'));
    await click(target.querySelector('[data-draft-id="new-message"]'));
    await vi.waitFor(() => expect(recipientCheckbox('Sam Rivera')?.checked).toBe(true));
    expect(recipientCheckbox('Taylor Brooks').checked).toBe(true);
    expect(target.querySelector('.new-message textarea').value).toBe('Unsent group draft');
    await click(button('Cancel new message'));
    expect(target.querySelector('.drafts-view')).toBeTruthy();
    expect(target.querySelectorAll('[data-draft-id]')).toHaveLength(3);
  });

  it('includes reply-only and recipient-only drafts, but excludes whitespace and removes cancelled empty replies', async () => {
    await type(target.querySelector('.conversation-composer textarea'), '   \n');
    await click(sidebarConversation('Drafts'));
    expect(target.querySelectorAll('[data-draft-id]')).toHaveLength(0);
    await click(sidebarConversation('# design-system'));
    await click(button('Reply to Sam Rivera', message('design-2')));
    await openNewMessage();
    await click(recipientCheckbox('Morgan Chen'));
    await click(button('Cancel new message'));
    await click(sidebarConversation('Drafts'));
    expect(target.querySelectorAll('[data-draft-id]')).toHaveLength(2);
    expect(target.querySelector('[data-draft-id="design-system"]').textContent).toContain('Write your reply…');
    expect(target.querySelector('[data-draft-id="new-message"]').textContent).toContain('Start your message…');
    await click(target.querySelector('[data-draft-id="design-system"]'));
    await click(button('Cancel reply'));
    await click(sidebarConversation('Drafts'));
    expect(target.querySelector('[data-draft-id="design-system"]')).toBeNull();
    expect(target.querySelector('[data-draft-id="new-message"]')).toBeTruthy();
  });

  it('removes sent and scheduled drafts without changing other unfinished messages', async () => {
    await type(target.querySelector('.conversation-composer textarea'), 'Send this draft');
    await click(sidebarConversation('Morgan Chen'));
    await type(target.querySelector('.conversation-composer textarea'), 'Keep my Morgan draft');
    await click(sidebarConversation('Drafts'));
    await click(target.querySelector('[data-draft-id="design-system"]'));
    await click(target.querySelector('.conversation-composer button[type="submit"]'));
    await click(sidebarConversation('Drafts'));
    expect(target.querySelectorAll('[data-draft-id]')).toHaveLength(1);
    expect(target.querySelector('[data-draft-id="dm-morgan"]').textContent).toContain('Keep my Morgan draft');
    await click(target.querySelector('[data-draft-id="dm-morgan"]'));
    await click(button('Schedule message'));
    await click([...document.querySelectorAll('[role="menuitem"]')].find((node) => node.textContent.includes('In 1 hour')));
    await click(sidebarConversation('Drafts'));
    expect(target.querySelector('.drafts-empty')).toBeTruthy();
    await openNewMessage();
    await click(recipientCheckbox('Sam Rivera'));
    await type(target.querySelector('.new-message textarea'), 'Send this new draft');
    await click(button('Cancel new message'));
    expect(target.querySelectorAll('[data-draft-id]')).toHaveLength(1);
    await click(target.querySelector('[data-draft-id="new-message"]'));
    await click(target.querySelector('.new-message button[type="submit"]'));
    await click(sidebarConversation('Drafts'));
    expect(target.querySelector('.drafts-empty')).toBeTruthy();
  });

  it('returns mobile resumed drafts to the list, preserving reply and new-conversation state', async () => {
    await enterMobile();
    await click(button('Open #design-system'));
    await click(button('More message options', message('design-2')));
    await click(menuItem('Reply'));
    await type(target.querySelector('.conversation-composer textarea'), 'Mobile unfinished reply');
    await click(button('Back to Home'));
    await click(button('New message', target.querySelector('.team-chat__topbar')));
    await vi.waitFor(() => expect(recipientCheckbox('Taylor Brooks')).toBeTruthy());
    await click(recipientCheckbox('Taylor Brooks'));
    await type(target.querySelector('.new-message textarea'), 'Mobile new draft');
    await click(button('Cancel new message'));
    expect(button('Open drafts').textContent).toContain('2');
    await click(button('Open drafts'));
    await click(target.querySelector('[data-draft-id="design-system"]'));
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Mobile unfinished reply');
    expect(target.querySelector('.chat-composer__reply').textContent).toContain('Sam Rivera');
    await click(button('Back to Drafts'));
    expect(target.querySelector('.drafts-view')).toBeTruthy();
    await click(target.querySelector('[data-draft-id="new-message"]'));
    await vi.waitFor(() => expect(recipientCheckbox('Taylor Brooks')?.checked).toBe(true));
    expect(target.querySelector('.new-message textarea').value).toBe('Mobile new draft');
    await click(button('Cancel new message'));
    expect(target.querySelector('.drafts-view')).toBeTruthy();
    await click(button('Back to Home'));
    expect(button('Open drafts').textContent).toContain('2');
  });

  it('keeps draft previews literal and clamps long content inside a flexible, scrollable mobile screen', async () => {
    layoutStyles = document.createElement('style');
    layoutStyles.textContent = compile(draftsSource, { filename: resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-drafts.svelte'), generate: 'client' }).css.code;
    document.head.append(layoutStyles);
    await type(target.querySelector('.conversation-composer textarea'), '<img src=x onerror=alert(1)> https://example.com ' + 'long draft '.repeat(100));
    await click(sidebarConversation('Drafts'));
    const view = target.querySelector('.drafts-view');
    expect(getComputedStyle(view).display).toBe('flex');
    expect(getComputedStyle(view).minHeight).toBe('0px');
    expect(getComputedStyle(view.querySelector('.drafts-scroll')).flex).toBe('1 1 0%');
    expect(view.querySelector('img')).toBeNull();
    expect(view.querySelector('a')).toBeNull();
    const preview = view.querySelector('.draft-preview');
    expect(preview.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(getComputedStyle(preview).overflowWrap).toBe('anywhere');
    expect(getComputedStyle(preview).getPropertyValue('-webkit-line-clamp')).toBe('2');
    await enterMobile();
    await click(button('Open drafts'));
    expect(getComputedStyle(target.querySelector('.drafts-new-message')).minHeight).toBe('var(--ds-spacing-12)');
  });

  it('shows only recent people above mobile DM previews without a duplicate search or ordering switch', async () => {
    await enterMobile();
    await click(mobileTab('DMs'));
    const previews = [...target.querySelectorAll('.mobile-row--preview')];
    expect(previews).toHaveLength(demoConversations.filter((room) => room.type !== 'channel').length);
    expect(previews[0].textContent).toContain('Sam Rivera');
    expect(previews[0].textContent).toContain('You: The updated spacing tokens');
    expect(button('Open Morgan Chen').querySelector('[data-gradient][data-size="sm"]')).toBeTruthy();
    expect(target.querySelector('[aria-label="Find a direct message"]')).toBeNull();
    expect(target.querySelector('.mobile-screen input')).toBeNull();
    const contacts = target.querySelector('.dm-people-strip');
    expect([...contacts.querySelectorAll('.dm-person')].map((node) => node.getAttribute('aria-label'))).toEqual([
      'Message Sam Rivera',
      'Message Morgan Chen',
      'Message Jules Martin',
      'Message Riley Park',
      'Message Nina Kowalska',
      'Message Taylor Brooks',
      'Message Casey Nguyen',
      'Message Avery Patel'
    ]);
    expect(contacts.querySelectorAll('[data-gradient][data-size="default"]')).toHaveLength(8);
    expect(contacts.querySelectorAll('.chat-avatar__presence')).toHaveLength(8);
    expect(target.querySelector('.dm-people').compareDocumentPosition(previews[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(target.querySelector('.dm-people-heading').textContent.trim()).toBe('Recent');
    expect(target.querySelector('[aria-label="Order people"]')).toBeNull();
    expect(target.querySelector('.dm-people-mode')).toBeNull();
    await click(button('Message Morgan Chen', contacts));
    expect(document.activeElement).toBe(target.querySelector('[data-conversation-heading]'));
    await click(button('Back to DMs'));
    expect(target.querySelector('.dm-people-strip').getAttribute('aria-label')).toBe('Recent people');
    expect(target.querySelectorAll('.mobile-row--preview')).toHaveLength(demoConversations.filter((room) => room.type !== 'channel').length);
    expect(target.querySelector('.mobile-navigation button button')).toBeNull();
    await click(mobileTab('Search'));
    await type(target.querySelector('[aria-label="Search messages, people, and channels"]'), 'morgan');
    expect(target.querySelector('[data-mobile-search-result="person:morgan"]')).toBeTruthy();
  });

  it.each([320, 390, 600, 759, 1000])('keeps DM headings stable when unread badges disappear and lets previews span the full text column at %ipx', async (width) => {
    layoutStyles = document.createElement('style');
    layoutStyles.textContent = compile(mobileSource, { filename: resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-mobile.svelte'), generate: 'client' }).css.code;
    document.head.append(layoutStyles);
    if (width < 760) {
      await enterMobile(width);
      await click(mobileTab('DMs'));
    } else await click(desktopDestination('DMs'));
    const row = button('Open Morgan Chen');
    const copy = row.querySelector('.row-copy');
    const heading = row.querySelector('.row-heading');
    const meta = row.querySelector('.row-meta');
    const badge = row.querySelector('.mobile-unread');
    const time = row.querySelector('.row-time');
    const preview = row.querySelector('.row-preview');
    expect(meta.children[0]).toBe(time);
    expect(meta.children[1]).toBe(badge);
    expect(getComputedStyle(meta).alignItems).toBe('center');
    expect(getComputedStyle(heading).alignItems).toBe('center');
    expect(getComputedStyle(heading).height).toBe('var(--ds-spacing-5)');
    expect(getComputedStyle(heading).lineHeight).toBe('var(--ds-font-line-height-sm)');
    expect(badge.dataset.size).toBe('sm');
    expect(getComputedStyle(badge).height).toBe('var(--ds-spacing-4)');
    expect(getComputedStyle(badge).minWidth).toBe('var(--ds-spacing-4)');
    expect(getComputedStyle(badge).lineHeight).toBe(getComputedStyle(time).lineHeight);
    expect(getComputedStyle(badge).borderTopWidth).toBe('0px');
    expect(getComputedStyle(badge).boxSizing).toBe('border-box');
    expect(getComputedStyle(meta).flexShrink).toBe('0');
    expect(getComputedStyle(meta).marginInlineStart).toBe('auto');
    expect(getComputedStyle(badge).marginInlineStart).toBe('0px');
    expect([...copy.children]).toEqual([heading, preview]);
    expect(row.children.length).toBe(2);
    expect(preview.textContent).toContain('Hey Alex!');
    expect(getComputedStyle(preview).textOverflow).toBe('ellipsis');
    await click(row);
    if (width < 760) await click(mobileTab('DMs'));
    expect(button('Open Morgan Chen').querySelector('.mobile-unread')).toBeNull();
    expect(button('Open Morgan Chen').querySelector('.row-preview').textContent).toContain('Hey Alex!');
    expect(getComputedStyle(button('Open Morgan Chen').querySelector('.row-heading')).height).toBe('var(--ds-spacing-5)');
    expect(getComputedStyle(button('Open Morgan Chen').querySelector('.row-heading')).lineHeight).toBe('var(--ds-font-line-height-sm)');
    await click(button('Open Support handoff'));
    if (width < 760) await click(mobileTab('DMs'));
    expect(button('Open Support handoff').querySelector('.mobile-unread')).toBeNull();
    expect(getComputedStyle(button('Open Support handoff').querySelector('.row-heading')).height).toBe('var(--ds-spacing-5)');
  });

  it('includes group participants in quick DMs and opens their private conversation without forwarding group messages', async () => {
    await openNewMessage();
    await click(recipientCheckbox('Taylor Brooks'));
    await click(recipientCheckbox('Sam Rivera'));
    await type(target.querySelector('.new-message textarea'), 'A group message');
    await click(target.querySelector('.new-message button[type="submit"]'));
    await enterMobile();
    await click(mobileTab('DMs'));
    expect(target.querySelector('.dm-people-strip').querySelectorAll('[aria-label="Message Sam Rivera"]')).toHaveLength(1);
    await click(button('Message Taylor Brooks', target.querySelector('.dm-people-strip')));
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('Taylor Brooks');
    expect(target.querySelector('.message-list').textContent).toContain('Start the conversation');
    expect(target.querySelector('.message-list').textContent).not.toContain('A group message');
    await type(target.querySelector('.conversation-composer textarea'), 'Keep this Taylor draft');
    await click(button('Back to DMs'));
    await click(button('Message Taylor Brooks', target.querySelector('.dm-people-strip')));
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep this Taylor draft');
  });

  it('keeps the quick people strip horizontal and the contact controls touch-sized on a narrow DM screen', async () => {
    layoutStyles = document.createElement('style');
    layoutStyles.textContent = compile(mobileSource, { filename: resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-mobile.svelte'), generate: 'client' }).css.code;
    document.head.append(layoutStyles);
    await enterMobile(320);
    await click(mobileTab('DMs'));
    const strip = target.querySelector('.dm-people-strip');
    expect(getComputedStyle(strip).display).toBe('flex');
    expect(getComputedStyle(strip).overflowX).toBe('auto');
    expect(getComputedStyle(strip).minWidth).toBe('0px');
    expect(getComputedStyle(strip.querySelector('button')).minHeight).toBe('var(--ds-spacing-20)');
    expect(getComputedStyle(strip.querySelector('.dm-person-name')).textOverflow).toBe('ellipsis');
    expect(target.querySelector('.dm-people').closest('.mobile-scroll')).toBeTruthy();
  });

  it.each([320, 390, 600, 759])('keeps one-line mobile conversation lists at 40px without shrinking message previews at %ipx', async (width) => {
    layoutStyles = document.createElement('style');
    layoutStyles.textContent = compile(mobileSource, { filename: resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-mobile.svelte'), generate: 'client' }).css.code;
    document.head.append(layoutStyles);
    await enterMobile(width);
    const channels = target.querySelector('[aria-label="Channels"]');
    const rows = [...channels.querySelectorAll('[data-mobile-channel]')];
    expect(rows).toHaveLength(demoConversations.filter((room) => room.type === 'channel').length);
    for (const row of rows) {
      expect(row.tagName).toBe('BUTTON');
      expect(row.querySelector('button')).toBeNull();
      expect(getComputedStyle(row).minHeight).toBe('var(--ds-spacing-10)');
      expect(row.querySelector('svg').getAttribute('width')).toBe('16');
      expect(getComputedStyle(row.querySelector('.room-icon')).height).toBe('var(--ds-spacing-5)');
    }
    const compactRule = [...layoutStyles.sheet.cssRules].find((rule) => rule.selectorText?.includes('.mobile-row--compact') && rule.style.getPropertyValue('padding-block'));
    expect(compactRule.style.getPropertyValue('padding-block')).toBe('var(--ds-spacing-1)');
    for (const shortcut of target.querySelectorAll('.home-shortcuts button')) {
      expect(getComputedStyle(shortcut).height).toBe('var(--ds-spacing-10)');
      expect(getComputedStyle(shortcut).minHeight).toBe('var(--ds-spacing-10)');
    }
    expect(button('Open #design-system').querySelector('.mobile-unread').textContent).toBe('3');
    await click(mobileTab('DMs'));
    expect(getComputedStyle(target.querySelector('.mobile-row--preview')).minHeight).toBe('var(--ds-spacing-20)');
    await click(mobileTab('Search'));
    await type(target.querySelector('[aria-label="Search messages, people, and channels"]'), 'Morgan');
    expect(getComputedStyle(target.querySelector('[data-mobile-search-result="person:morgan"]')).minHeight).toBe('var(--ds-spacing-10)');
    expect(getComputedStyle(target.querySelector('[data-mobile-search-result="message:morgan-1"]')).minHeight).toBe('var(--ds-spacing-20)');
    await type(target.querySelector('[aria-label="Search messages, people, and channels"]'), 'engineering');
    const result = target.querySelector('[data-mobile-search-result="room:engineering"]');
    expect(getComputedStyle(result).minHeight).toBe('var(--ds-spacing-10)');
    await click(result);
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('engineering');
  });

  it('uses inline mobile search with compact people and channel rows, and restores its query after a message jump', async () => {
    await enterMobile();
    await click(mobileTab('Search'));
    const input = target.querySelector('[aria-label="Search messages, people, and channels"]');
    expect(document.activeElement).toBe(input);
    expect(document.querySelector('.chat-search')).toBeNull();
    expect(target.querySelector('.mobile-screen').textContent).toContain('Recent conversations');
    await type(input, 'Morgan');
    const person = target.querySelector('[data-mobile-search-result="person:morgan"]');
    expect(person.classList.contains('mobile-row--compact')).toBe(true);
    expect(person.querySelector('[data-gradient][data-size="xs"]')).toBeTruthy();
    expect(person.querySelector('.row-details').textContent).toBe('Available');
    expect(person.querySelector('.row-preview')).toBeNull();
    expect(target.querySelector('[data-mobile-search-result="message:morgan-1"]').classList.contains('mobile-row--preview')).toBe(true);
    expect(person.querySelector('mark').textContent).toBe('Morgan');
    await type(input, 'engineering');
    const channel = target.querySelector('[data-mobile-search-result="room:engineering"]');
    expect(channel.classList.contains('mobile-row--compact')).toBe(true);
    expect(channel.querySelector('.row-details').textContent).toBe('3 members');
    expect(channel.querySelector('mark').textContent).toBe('engineering');
    await type(input, 'preview build');
    const result = target.querySelector('[data-mobile-search-result="message:engineering-1"]');
    expect(result.querySelector('mark').textContent).toBe('preview build');
    await click(result);
    expect(message('engineering-1').querySelector('.chat-message').classList.contains('is-highlighted')).toBe(true);
    expect(document.activeElement).toBe(message('engineering-1'));
    expect(message('engineering-1').scrollIntoView).toHaveBeenCalled();
    await click(button('Back to Search'));
    expect(target.querySelector('[aria-label="Search messages, people, and channels"]').value).toBe('preview build');
    await click(button('Clear mobile search'));
    expect(target.querySelectorAll('[data-mobile-search-result] mark')).toHaveLength(0);
  });

  it('supports mobile search keyboard navigation, literal text, empty states, and opening a new person', async () => {
    await enterMobile();
    await click(button('Search conversations and messages'));
    const input = target.querySelector('[aria-label="Search messages, people, and channels"]');
    expect(document.activeElement).toBe(input);
    await type(input, '<img src=x>');
    expect(target.querySelector('.mobile-empty').textContent).toContain('No results found');
    expect(target.querySelector('.mobile-screen img')).toBeNull();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await tick();
    expect(input.value).toBe('');
    await type(input, 'Taylor');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(target.querySelector('[data-mobile-search-result="person:taylor"]'));
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(target.querySelector('[data-conversation-heading]').textContent).toContain('Taylor Brooks'));
    expect(target.querySelector('.message-list').textContent).toContain('Start the conversation');
    expect(document.activeElement).toBe(target.querySelector('[data-conversation-heading]'));
  });

  it('opens and filters real activity, jumps to messages, and clears notifications', async () => {
    await enterMobile();
    await click(mobileTab('Activity'));
    const activityButton = (label) => [...target.querySelectorAll('.activity-tools button')].find((node) => node.textContent.trim() === label);
    expect(target.querySelectorAll('.mobile-row--activity').length).toBeGreaterThan(0);
    await click(activityButton('Replies'));
    expect(target.querySelectorAll('.mobile-row--activity')).toHaveLength(demoMessages.filter((message) => message.author !== 'you' && message.replyToId).length);
    expect(activityButton('Replies').getAttribute('aria-pressed')).toBe('true');
    await click(target.querySelector('.mobile-row--activity'));
    expect(message('reply-2').querySelector('.chat-message').classList.contains('is-highlighted')).toBe(true);
    await click(button('Back to Activity'));
    expect(activityButton('Replies').getAttribute('aria-pressed')).toBe('true');
    await click(activityButton('Mentions'));
    expect(target.querySelector('.mobile-row--activity').textContent).toContain('planning session');
    await click(activityButton('Reactions'));
    expect(target.querySelector('.activity-reactions')).toBeTruthy();
    await click(activityButton('Clear all'));
    await vi.waitFor(() => expect(document.activeElement).toBe(activityButton('Reactions')));
    expect(target.querySelector('.activity-clear')).toBeNull();
    await click(activityButton('All'));
    expect(activityButton('Unread').querySelector('.activity-filter-dot')).toBeNull();
    expect(activityButton('Unread').hasAttribute('aria-describedby')).toBe(false);
    expect(target.querySelector('.mobile-empty').textContent).toContain("You're all caught up");
    expect(mobileTab('Activity').querySelector('.tab-dot')).toBeNull();
    expect(mobileTab('DMs').querySelector('.tab-dot')).toBeNull();
    expect(mobileTab('Home').querySelector('.tab-dot')).toBeNull();
    expect(mobileTab('DMs').getAttribute('aria-label')).toBe('DMs');
  });

  it.each([320, 390, 1000])('uses compact icon badge filters, Aesir horizontal scrolling and a separate full-width clear action at %ipx', async (width) => {
    layoutStyles = document.createElement('style');
    layoutStyles.textContent = [
      [mobileSource, resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-mobile.svelte')],
      [scrollAreaSource, resolve(import.meta.dirname, '../../../packages/aesir-svelte/dist/components/aesir-scroll-area/aesir-scroll-area.svelte')],
      [toggleSource, resolve(import.meta.dirname, '../../../packages/aesir-svelte/src/components/aesir-toggle/aesir-toggle.svelte')]
    ]
      .map(([source, filename]) => compile(source, { filename, generate: 'client' }).css.code)
      .join('\n');
    document.head.append(layoutStyles);
    if (width < 760) {
      await enterMobile(width);
      await click(mobileTab('Activity'));
    } else await click(desktopDestination('Activity'));
    const group = target.querySelector('[role="group"][aria-label="Filter activity"]');
    const filters = [...group.querySelectorAll('button')];
    expect(filters.map((node) => node.getAttribute('aria-label'))).toEqual(['All', 'Unread', 'Mentions', 'Replies', 'Reactions']);
    for (const filter of filters) {
      expect(filter.dataset.size).toBe('sm');
      expect(getComputedStyle(filter).height).toBe('var(--ds-spacing-8)');
      expect(getComputedStyle(filter).borderRadius).toBe('var(--ds-radius-full)');
      expect(getComputedStyle(filter).minHeight).not.toBe('var(--ds-spacing-12)');
      expect(filter.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
    }
    const filterArea = target.querySelector('.activity-filters');
    expect(filterArea.dataset.slot).toBe('scroll-area');
    expect(filterArea.dataset.orientation).toBe('horizontal');
    expect(getComputedStyle(filterArea.querySelector('[data-slot="scroll-area-viewport"]')).overflowX).toBe('auto');
    expect(getComputedStyle(target.querySelector('.activity-filters')).minWidth).toBe('0px');
    // JSDOM does not resolve token-based padding shorthands.
    const listRule = [...layoutStyles.sheet.cssRules].find((rule) => rule.selectorText?.startsWith('.activity-filter-list.'));
    expect(listRule.style.padding).toBe('var(--ds-spacing-1) var(--ds-spacing-1) var(--ds-spacing-3)');
    expect(getComputedStyle(target.querySelector('.activity-tools')).flexDirection).toBe('column');
    const clear = target.querySelector('.activity-clear');
    expect(clear.nextElementSibling).toBe(filterArea);
    expect(filterArea.contains(clear)).toBe(false);
    expect(clear.dataset.width).toBe('full');
    expect(getComputedStyle(clear).height).toBe('var(--ds-spacing-10)');
    expect(getComputedStyle(filterArea).height).toBe('var(--ds-spacing-12)');
    const viewport = filterArea.querySelector('[data-slot="scroll-area-viewport"]');
    expect(viewport.dataset.enhanced).toBe('true');
    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 280 },
      scrollWidth: { configurable: true, value: 520 },
      clientHeight: { configurable: true, value: 48 },
      scrollHeight: { configurable: true, value: 48 }
    });
    viewport.dispatchEvent(new Event('scroll'));
    await tick();
    expect(filterArea.querySelector('[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]')).toBeTruthy();
    expect(viewport.tabIndex).toBe(0);
    await click(button('Replies', group));
    expect(target.querySelectorAll('.mobile-row--activity')).toHaveLength(demoMessages.filter((message) => message.author !== 'you' && message.replyToId).length);
    await click(button('Replies', group));
    expect(button('Replies', group).getAttribute('aria-pressed')).toBe('true');
    expect(group.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);
    button('Replies', group).focus();
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(button('Reactions', group));
    await click(document.activeElement);
    expect(button('Reactions', group).getAttribute('aria-pressed')).toBe('true');
    expect(target.querySelector('.activity-reactions')).toBeTruthy();
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(button('All', group));
  });

  it('indicates unread activity with a compact accessible dot and removes it after reading the last unread conversation', async () => {
    layoutStyles = document.createElement('style');
    layoutStyles.textContent = compile(mobileSource, { filename: resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-mobile.svelte'), generate: 'client' }).css.code;
    document.head.append(layoutStyles);
    await enterMobile();
    await click(mobileTab('Activity'));
    const unreadFilter = () => button('Unread', target.querySelector('.activity-filters'));
    const dot = unreadFilter().querySelector('.activity-filter-dot');
    expect(dot).toBeTruthy();
    expect(dot.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(dot).width).toBe('var(--ds-spacing-1-5)');
    expect(getComputedStyle(dot).height).toBe('var(--ds-spacing-1-5)');
    expect(getComputedStyle(dot).background).toBe('var(--ds-accent)');
    expect(document.getElementById(unreadFilter().getAttribute('aria-describedby')).textContent).toMatch(/^\d+ unread notifications?$/);
    expect(target.querySelectorAll('.activity-filters .activity-filter-dot')).toHaveLength(1);
    await click(unreadFilter());
    expect(unreadFilter().querySelector('.activity-filter-dot')).toBeTruthy();
    for (let attempt = 0; attempt < demoConversations.length && target.querySelector('.mobile-row--activity'); attempt++) {
      await click(target.querySelector('.mobile-row--activity'));
      await click(button('Back to Activity'));
    }
    expect(unreadFilter().querySelector('.activity-filter-dot')).toBeNull();
    expect(unreadFilter().hasAttribute('aria-describedby')).toBe(false);
    expect(target.querySelector('.mobile-empty').textContent).toContain("You're all caught up");
  });

  it('keeps the mobile composer compact, inserts newlines with Return, and sends using its button', async () => {
    await enterMobile();
    await click(button('Open #general'));
    const composer = target.querySelector('.conversation-composer');
    const input = composer.querySelector('textarea');
    expect(input.rows).toBe(1);
    expect(composer.querySelector('.chat-composer__formatting')).toBeNull();
    expect(composer.querySelector('.chat-composer__toolbar')).toBeNull();
    expect(composer.querySelector('.chat-composer').dataset.expanded).toBe('false');
    input.focus();
    await tick();
    expect(input.rows).toBe(2);
    expect(composer.querySelector('.chat-composer__toolbar')).toBeTruthy();
    await type(input, 'Mobile message');
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    input.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(false);
    expect(input.value).toBe('Mobile message');
    expect(target.querySelector('.message-list').textContent).not.toContain('Mobile message');
    await click(button('Show formatting', composer));
    expect(composer.querySelector('.chat-composer__formatting')).toBeTruthy();
    await click(button('Send message', composer));
    expect(target.querySelector('.message-list').textContent).toContain('Mobile message');
    expect(input.value).toBe('');
    expect(composer.querySelector('.chat-composer').dataset.expanded).toBe('false');
    expect(target.querySelector('.chat-message__actions')).toBeNull();
    expect(target.querySelector('.mobile-message-actions')).toBeTruthy();
  });

  it.each([320, 390, 600, 759])('uses compact mobile composer controls, including split send buttons, at %ipx', async (width) => {
    layoutStyles = document.createElement('style');
    layoutStyles.textContent = [
      [composerSource, '../src/lib/components/docs/examples/team-chat/team-chat-composer.svelte'],
      [buttonSource, '../../../packages/aesir-svelte/src/components/aesir-button/aesir-button.svelte'],
      [buttonGroupSource, '../../../packages/aesir-svelte/src/components/aesir-button-group/aesir-button-group.svelte']
    ]
      .map(([source, filename]) => compile(source, { filename: resolve(import.meta.dirname, filename), generate: 'client' }).css.code)
      .join('\n');
    document.head.append(layoutStyles);
    await enterMobile(width);
    await click(button('Open #general'));
    const form = target.querySelector('.conversation-composer .chat-composer');
    form.querySelector('textarea').focus();
    await tick();
    const toolbar = form.querySelector('.chat-composer__toolbar');
    expect(getComputedStyle(toolbar).gap).toBe('var(--ds-spacing-2)');
    for (const control of toolbar.querySelectorAll('button')) {
      expect(control.dataset.size).toBe('icon-sm');
      expect(getComputedStyle(control).minWidth).toBe('var(--ds-spacing-8)');
      expect(getComputedStyle(control).minHeight).toBe('var(--ds-spacing-8)');
      expect(getComputedStyle(control).width).toBe('var(--ds-spacing-8)');
    }
    const sendGroup = toolbar.querySelector('.aesir-button-group');
    expect(sendGroup.dataset.size).toBe('sm');
    expect(getComputedStyle(sendGroup).getPropertyValue('--aesir-button-group-height')).toBe('var(--ds-spacing-8)');
    const collapse = button('Collapse message input', form);
    expect(collapse.dataset.size).toBe('icon-sm');
    expect(getComputedStyle(collapse).height).toBe('var(--ds-spacing-8)');
    expect(button('Send message', form).disabled).toBe(true);
    await type(form.querySelector('textarea'), 'Compact controls');
    expect(button('Send message', form).disabled).toBe(false);
    await click(button('Show formatting', form));
    for (const control of form.querySelectorAll('.chat-composer__formatting button')) {
      expect(control.dataset.size).toBe('icon-sm');
      expect(getComputedStyle(control).height).toBe('var(--ds-spacing-8)');
    }
  });

  it.each([320, 390, 600, 759])('keeps the same bottom navigation mounted while opening conversations and changing destinations at %ipx', async (width) => {
    await enterMobile(width);
    const nav = target.querySelector('.mobile-tabbar');
    await click(button('Open #general'));
    expect(target.querySelector('.mobile-tabbar')).toBe(nav);
    expect(nav.closest('[hidden]')).toBeNull();
    expect(document.activeElement).toBe(target.querySelector('[data-conversation-heading]'));
    await type(target.querySelector('.conversation-composer textarea'), 'Keep this mobile draft');
    await click(mobileTab('DMs'));
    expect(target.querySelector('.conversation')).toBeNull();
    expect(target.querySelector('.mobile-screen').hidden).toBe(false);
    expect(document.activeElement).toBe(target.querySelector('[data-mobile-heading]'));
    await click(button('Open Morgan Chen'));
    expect(target.querySelector('.mobile-tabbar')).toBe(nav);
    await click(mobileTab('Search'));
    expect(target.querySelector('.conversation')).toBeNull();
    expect(document.activeElement.getAttribute('aria-label')).toBe('Search messages, people, and channels');
    await click(mobileTab('Home'));
    await click(button('Open #general'));
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep this mobile draft');
    expect(target.querySelector('.conversation-composer .chat-composer').dataset.expanded).toBe('false');
    expect(target.querySelector('.mobile-tabbar')).toBe(nav);
  });

  it('collapses a mobile composer without losing multiline drafts or hiding navigation, and reopens instantly on focus', async () => {
    layoutStyles = document.createElement('style');
    layoutStyles.textContent = compile(composerSource, {
      filename: resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-composer.svelte'),
      generate: 'client'
    }).css.code;
    document.head.append(layoutStyles);
    await enterMobile();
    await click(button('Open #general'));
    const form = target.querySelector('.conversation-composer .chat-composer');
    const input = form.querySelector('textarea');
    const nav = target.querySelector('.mobile-tabbar');
    expect(input.rows).toBe(1);
    expect(getComputedStyle(input).maxHeight).toBe('var(--ds-spacing-12)');
    input.focus();
    await tick();
    expect(form.dataset.expanded).toBe('true');
    expect(document.activeElement).toBe(input);
    await type(input, 'First line\nSecond line');
    await click(button('Show formatting', form));
    await click(button('Collapse message input', form));
    expect(form.dataset.expanded).toBe('false');
    expect(input.rows).toBe(1);
    expect(input.value).toBe('First line\nSecond line');
    expect(form.querySelector('.chat-composer__toolbar')).toBeNull();
    expect(form.querySelector('.chat-composer__formatting')).toBeNull();
    expect(document.activeElement).toBe(target.querySelector('[data-conversation-heading]'));
    input.focus();
    await tick();
    expect(input.rows).toBe(2);
    expect(form.querySelector('.chat-composer__toolbar')).toBeTruthy();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', isComposing: true, bubbles: true, cancelable: true }));
    await tick();
    expect(form.dataset.expanded).toBe('true');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await tick();
    expect(form.dataset.expanded).toBe('false');
    expect(input.value).toBe('First line\nSecond line');
    expect(target.querySelector('.mobile-tabbar')).toBe(nav);
  });

  it('opens mobile reply and resumed draft editors ready to write, and keeps bottom tabs usable with a profile open', async () => {
    await enterMobile();
    await click(button('Open #design-system'));
    await click(button('More message options', message('design-2')));
    await click(menuItem('Reply'));
    await vi.waitFor(() => expect(document.activeElement).toBe(target.querySelector('.conversation-composer textarea')));
    expect(target.querySelector('.conversation-composer .chat-composer').dataset.expanded).toBe('true');
    await type(target.querySelector('.conversation-composer textarea'), 'Ready to resume');
    await click(mobileTab('More'));
    await click(button('Open drafts', target.querySelector('.more-shortcuts')));
    await click(target.querySelector('[data-draft-id="design-system"]'));
    await vi.waitFor(() => expect(document.activeElement).toBe(target.querySelector('.conversation-composer textarea')));
    expect(target.querySelector('.conversation-composer .chat-composer').dataset.expanded).toBe('true');
    await click(button("View Sam Rivera's profile", message('design-2')));
    expect(target.querySelector('.chat-profile-panel')).toBeTruthy();
    expect(target.querySelector('.mobile-tabbar').closest('[hidden]')).toBeNull();
    await click(mobileTab('Activity'));
    expect(target.querySelector('.chat-profile-panel')).toBeNull();
    expect(target.querySelector('.conversation')).toBeNull();
    expect(document.activeElement).toBe(target.querySelector('[data-mobile-heading]'));
  });

  it('keeps new-message drafts and recipients when cancelling to the mobile destination', async () => {
    await enterMobile();
    await click(mobileTab('DMs'));
    await click(button('New message', target.querySelector('.team-chat__topbar')));
    await vi.waitFor(() => expect(recipientCheckbox('Morgan Chen')).toBeTruthy());
    await click(recipientCheckbox('Morgan Chen'));
    await type(target.querySelector('.new-message textarea'), 'Unsent mobile message');
    await click(button('Cancel new message'));
    expect(mobileTab('DMs').getAttribute('aria-current')).toBe('page');
    expect(target.querySelector('.conversation')).toBeNull();
    await click(button('New message', target.querySelector('.team-chat__topbar')));
    expect(target.querySelector('.new-message textarea').value).toBe('Unsent mobile message');
    expect(target.querySelector('[aria-label="Selected recipients"]').textContent).toContain('Morgan Chen');
    target.querySelector('.new-message textarea').focus();
    await tick();
    await click(target.querySelector('.new-message button[type="submit"]'));
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('Morgan Chen');
    await click(button('Back to DMs'));
    expect(button('Open Morgan Chen').querySelector('.row-preview').textContent).toContain('You: Unsent mobile message');
  });

  it('keeps touch message actions functional for forward, save, and edit without a floating hover toolbar', async () => {
    await enterMobile();
    await click(button('Open #design-system'));
    await click(button('More message options', message('design-1')));
    await click(menuItem('Forward'));
    await vi.waitFor(() => expect(document.querySelector('.forward-picker')).toBeTruthy());
    await click(button('Forward to Morgan Chen'));
    await vi.waitFor(() => expect(document.querySelector('.forward-picker')).toBeNull());
    await click(button('More message options', message('design-3')));
    await click(menuItem('Save message'));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    await click(button('More message options', message('design-4')));
    await click(menuItem('Edit message'));
    await vi.waitFor(() => expect(message('design-4').querySelector('textarea')).toBeTruthy());
    await type(message('design-4').querySelector('textarea'), 'Edited on mobile');
    await click(message('design-4').querySelector('button[type="submit"]'));
    expect(message('design-4').textContent).toContain('Edited on mobile');
    expect(message('design-4').textContent).toContain('(edited)');
  });

  it.each([320, 390, 600, 759])('uses a compact 48px capsule and Search with safe-area navigation at %ipx', async (width) => {
    layoutStyles = document.createElement('style');
    layoutStyles.textContent = compile(mobileSource, { filename: resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-mobile.svelte'), generate: 'client' }).css.code;
    document.head.append(layoutStyles);
    await enterMobile(width);
    const navigation = target.querySelector('.mobile-navigation');
    const nav = target.querySelector('.mobile-tabbar');
    expect(getComputedStyle(navigation).display).toBe('flex');
    expect(getComputedStyle(nav).gridTemplateColumns).toBe('minmax(0, 1fr) var(--ds-spacing-12)');
    const pill = target.querySelector('.mobile-tab-pill');
    expect(getComputedStyle(pill).gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
    expect(getComputedStyle(pill).borderRadius).toBe('var(--ds-radius-full)');
    expect(getComputedStyle(pill).height).toBe('var(--ds-spacing-12)');
    // JSDOM does not resolve token-based padding shorthands; inspect the compiled rule.
    const pillRule = [...layoutStyles.sheet.cssRules].find((rule) => rule.selectorText?.startsWith('.mobile-tab-pill.'));
    expect(pillRule.style.padding).toBe('var(--ds-spacing-px)');
    expect(getComputedStyle(mobileTab('Search')).height).toBe('var(--ds-spacing-12)');
    expect(mobileTab('Search').getAttribute('data-radius')).toBe('full');
    expect(getComputedStyle(mobileTab('DMs')).minHeight).toBe('calc(var(--ds-spacing-12) - var(--ds-spacing-1))');
    expect(getComputedStyle(mobileTab('DMs')).gap).toBe('var(--ds-spacing-0-5)');
    for (const icon of nav.querySelectorAll('.mobile-tab svg')) {
      expect(getComputedStyle(icon).width).toBe('var(--ds-spacing-4)');
      expect(getComputedStyle(icon).height).toBe('var(--ds-spacing-4)');
    }
    expect(getComputedStyle(nav).position).not.toBe('fixed');
    const navRule = [...layoutStyles.sheet.cssRules].find((rule) => rule.selectorText?.startsWith('.mobile-tabbar.') && !rule.selectorText.includes(' '));
    expect(navRule.style.padding).toContain('env(safe-area-inset-bottom');
    expect(navRule.style.padding).toBe('var(--ds-spacing-1) var(--ds-spacing-2) max(var(--ds-spacing-2), env(safe-area-inset-bottom, 0px))');
    expect(getComputedStyle(button('Open #general')).minHeight).toBe('var(--ds-spacing-10)');
    await click(button('Open #general'));
    expect(getComputedStyle(navigation).display).toBe('flex');
    expect(getComputedStyle(target.querySelector('.mobile-screen')).display).toBe('none');
    expect(getComputedStyle(nav).display).toBe('grid');
    expect(nav.previousElementSibling).toBe(target.querySelector('.chat-panels'));
  });

  it('opens mobile profiles and preferences from the account menu, returning to the same destination', async () => {
    await enterMobile();
    await click(mobileTab('DMs'));
    await openOwnProfile();
    expect(target.querySelector('.mobile-screen').hidden).toBe(true);
    expect(target.querySelector('.team-chat__topbar h1').textContent).toBe('Profile');
    expect(document.querySelector('.chat-profile-panel').closest('.chat-panels')).toBeTruthy();
    expect(document.querySelector('.aesir-drawer')).toBeNull();
    await click(button('Close profile'));
    expect(target.querySelector('.mobile-screen').hidden).toBe(false);
    expect(mobileTab('DMs').getAttribute('aria-current')).toBe('page');
    await click(accountTrigger());
    await click(menuItem('Preferences'));
    await vi.waitFor(() => expect(document.querySelector('.chat-preferences')).toBeTruthy());
    await click(button('Close preferences'));
    await vi.waitFor(() => expect(document.querySelector('.chat-preferences')).toBeNull());
    expect(mobileTab('DMs').getAttribute('aria-current')).toBe('page');
  });

  it('opens mobile About and Members in the shared dialog and preserves the chat after closing it', async () => {
    await enterMobile();
    await click(button('Open #engineering'));
    await click(button('About #engineering'));
    expect(document.querySelector('.channel-about')).toBeTruthy();
    await click([...document.querySelectorAll('[role="tab"]')].find((node) => node.textContent.includes('Members')));
    expect(document.querySelectorAll('.member-list .chat-avatar')).toHaveLength(3);
    await click(button('Close dialog'));
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('engineering');
    expect(button('Back to Home')).toBeTruthy();
  });

  it('deletes an own mobile message with confirmation and keeps inline reply quotes navigable', async () => {
    await enterMobile();
    await click(button('Open #design-system'));
    await click(button('More message options', message('design-4')));
    await click(menuItem('Delete message'));
    await vi.waitFor(() => expect(document.querySelector('[role="alertdialog"]')).toBeTruthy());
    await click([...document.querySelectorAll('[role="alertdialog"] button')].find((node) => node.textContent.trim() === 'Cancel'));
    await vi.waitFor(() => expect(document.querySelector('[role="alertdialog"]')).toBeNull());
    expect(message('design-4')).toBeTruthy();
    await click(button('More message options', message('design-4')));
    await click(menuItem('Delete message'));
    await vi.waitFor(() => expect(document.querySelector('[role="alertdialog"]')).toBeTruthy());
    await click([...document.querySelectorAll('[role="alertdialog"] button')].find((node) => node.textContent.trim() === 'Delete message'));
    await vi.waitFor(() => expect(message('design-4')).toBeNull());
    await click(message('reply-2').querySelector('.chat-quote__button'));
    expect(document.activeElement).toBe(message('reply-1'));
    expect(message('reply-1').querySelector('.chat-message').classList.contains('is-highlighted')).toBe(true);
    expect(document.querySelector('.aesir-drawer')).toBeNull();
  });

  it('shows up to three overlapping gradient member avatars and opens Members from the whole header button', async () => {
    const members = button('View 4 conversation members');
    const stack = members.querySelector('.member-avatar-stack');
    expect(stack.getAttribute('aria-hidden')).toBe('true');
    expect(stack.querySelectorAll('[data-slot="avatar"][data-gradient][data-size="xs"]')).toHaveLength(3);
    expect([...stack.children].map((node) => node.getAttribute('aria-label'))).toEqual(['Morgan Chen · Available', 'Sam Rivera · Away', 'Jules Martin · Offline']);
    expect(stack.firstElementChild.style.getPropertyValue('--aesir-avatar-gradient-start')).toBe(
      message('design-1').querySelector('[data-slot="avatar"]').style.getPropertyValue('--aesir-avatar-gradient-start')
    );
    expect(members.querySelector('svg')).toBeNull();
    expect(members.querySelector('button')).toBeNull();
    expect(members.textContent.trim()).toBe('4');
    members.focus();
    await click(stack.firstElementChild);
    expect(document.querySelector('[role="tab"][aria-selected="true"]').textContent).toContain('Members 4');
    await click(button('Close dialog'));
    await click(sidebarConversation('Morgan Chen'));
    expect(button('View 2 conversation members')).toBeUndefined();
  });

  it.each([390, 1000])('hides redundant member counts in one-to-one DMs but preserves group and channel members at %ipx', async (width) => {
    if (width < 760) {
      await enterMobile(width);
      await click(mobileTab('DMs'));
      await click(button('Open Morgan Chen'));
    } else await click(sidebarConversation('Morgan Chen'));
    expect(target.querySelector('.conversation-header .member-count')).toBeNull();
    expect(button('Show pinned messages')).toBeTruthy();
    expect(button("View Morgan Chen's profile", target.querySelector('.conversation-heading'))).toBeTruthy();
    if (width < 760) {
      await click(button('Back to DMs'));
      await click(button('Open Launch crew'));
    } else await click(sidebarConversation('Launch crew'));
    expect(button('View 4 conversation members')).toBeTruthy();
    await click(button('View 4 conversation members'));
    expect(document.querySelectorAll('.member-list .chat-avatar')).toHaveLength(4);
    await click(button('Close dialog'));
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    if (width < 760) {
      await click(button('Back to DMs'));
      await click(mobileTab('Home'));
      await click(button('Open #engineering'));
    } else await click(sidebarConversation('# engineering'));
    expect(button('View 3 conversation members')).toBeTruthy();
  });

  it.each(['desktop', 'mobile'])('opens the same recipient picker from the Direct messages plus in %s navigation', async (mode) => {
    await type(target.querySelector('.conversation-composer textarea'), 'Keep the current draft');
    if (mode === 'mobile') {
      resizeWorkspace(600);
      await tick();
    }
    const sidebar = mode === 'mobile' ? target.querySelector('.mobile-navigation') : target.querySelector('.aesir-sidebar__desktop');
    const plus = button('Open a direct message', sidebar);
    expect(plus.closest(mode === 'mobile' ? '.section-heading' : '.aesir-sidebar__section-heading').textContent).toContain('Direct messages');
    if (mode === 'desktop') expect(plus.getAttribute('title')).toBe('Open a direct message');
    expect(plus.querySelector('svg')).toBeTruthy();
    expect(sidebar.querySelectorAll(mode === 'mobile' ? '.section-heading button' : '.aesir-sidebar__section-heading button')).toHaveLength(1);
    plus.focus();
    await click(plus);
    expect(document.querySelector('.aesir-drawer')).toBeNull();
    expect(target.querySelector('.new-message')).toBeTruthy();
    expect(document.activeElement).toBe(recipientInput());
    await click(button('Cancel new message'));
    if (mode === 'mobile') await click(button('Open #design-system'));
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep the current draft');
  });

  it('opens a blank inline new message view, keeps its draft and recipients, and cancels back to the untouched chat draft', async () => {
    await type(target.querySelector('.conversation-composer textarea'), 'Keep channel draft');
    await openNewMessage();
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('New message');
    expect(target.querySelector('.message-list')).toBeNull();
    expect(document.querySelector('.aesir-dialog')).toBeNull();
    expect(document.activeElement).toBe(recipientInput());
    expect(document.querySelectorAll('.new-message-options .chat-avatar')).toHaveLength(Object.keys(demoPeople).length - 1);
    const composer = target.querySelector('.new-message textarea');
    await type(composer, 'Unsent new message');
    expect(target.querySelector('.new-message button[type="submit"]').disabled).toBe(true);
    await click(recipientCheckbox('Morgan Chen'));
    expect(button('Remove Morgan Chen from recipients').querySelector('[data-gradient]')).toBeTruthy();
    expect(target.querySelector('.new-message button[type="submit"]').disabled).toBe(false);
    await click(button('Cancel new message'));
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep channel draft');
    await openNewMessage();
    expect(target.querySelector('.new-message textarea').value).toBe('Unsent new message');
    expect(recipientCheckbox('Morgan Chen').checked).toBe(true);
    await click(button('Remove Morgan Chen from recipients'));
    expect(recipientCheckbox('Morgan Chen').checked).toBe(false);
    expect(target.querySelector('.new-message button[type="submit"]').disabled).toBe(true);
  });

  it('uses a compact, content-height recipient popover with a capped scroll area and dismisses it while composing', async () => {
    layoutStyles = document.createElement('style');
    layoutStyles.textContent = [
      [newMessageSource, 'team-chat-new-message'],
      [personOptionSource, 'team-chat-person-option']
    ]
      .map(([source, file]) => compile(source, { filename: resolve(import.meta.dirname, `../src/lib/components/docs/examples/team-chat/${file}.svelte`), generate: 'client' }).css.code)
      .join('\n');
    document.head.append(layoutStyles);
    await openNewMessage();
    const input = recipientInput();
    const panel = document.querySelector('.new-message-recipient-popover');
    const options = panel.querySelector('.new-message-options');
    expect(panel.dataset.placement).toBe('bottom');
    expect(panel.contains(input)).toBe(false);
    expect(target.querySelector('.new-message').contains(options)).toBe(false);
    expect(getComputedStyle(options).height).toBe('auto');
    expect(getComputedStyle(options).maxHeight).toBe('min(var(--ds-sizing-xs), 40dvh)');
    expect(getComputedStyle(options).flex).toBe('0 1 auto');
    expect(options.querySelectorAll('.member-picker__row[data-density="compact"]')).toHaveLength(Object.keys(demoPeople).length - 1);
    expect(options.querySelectorAll('[data-slot="avatar"][data-size="xs"]')).toHaveLength(Object.keys(demoPeople).length - 1);
    expect(getComputedStyle(options.querySelector('.person-option-label')).minHeight).toBe('var(--ds-spacing-9)');
    // JSDOM cannot resolve token-based padding shorthands; inspect the compiled rule.
    const rules = [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules]);
    const compactRule = rules.find((rule) => rule.selectorText?.includes("[data-density='compact']") && rule.selectorText?.includes('.person-option-label'));
    expect(compactRule.style.padding).toBe('var(--ds-spacing-1) var(--ds-spacing-2)');
    expect(rules.find((rule) => rule.selectorText === '.new-message-recipient-popover').style.width).toBe('min(calc(100vw - var(--ds-spacing-8)), var(--ds-sizing-md))');
    expect(options.querySelector('.new-message-channel').dataset.size).toBe('sm');
    await click(recipientCheckbox('Morgan Chen'));
    expect(input.getAttribute('aria-expanded')).toBe('true');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(recipientCheckbox('Morgan Chen'));
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await tick();
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-expanded')).toBe('false');
    await vi.waitFor(() => expect(document.querySelector('.new-message-options')).toBeNull());
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.activeElement).toBe(recipientCheckbox('Morgan Chen')));
    target.querySelector('.new-message textarea').focus();
    await tick();
    expect(input.getAttribute('aria-expanded')).toBe('false');
    await vi.waitFor(() => expect(document.querySelector('.new-message-options')).toBeNull());
    await click(input);
    expect(input.getAttribute('aria-expanded')).toBe('true');
    await vi.waitFor(() => expect(recipientCheckbox('Morgan Chen')?.checked).toBe(true));
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    await tick();
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('selects a new person by keyboard and creates a direct conversation only on send', async () => {
    await openNewMessage();
    await type(recipientInput(), 'tAYLor');
    expect(recipientCheckbox('Taylor Brooks')).toBeTruthy();
    expect(recipientCheckbox('Morgan Chen')).toBeUndefined();
    recipientInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await tick();
    expect(button('Remove Taylor Brooks from recipients')).toBeTruthy();
    expect(sidebarConversation('Taylor Brooks')).toBeUndefined();
    await type(target.querySelector('.new-message textarea'), 'Hello Taylor from compose');
    await click(target.querySelector('.new-message button[type="submit"]'));
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('Taylor Brooks');
    expect(target.querySelector('.message-list').textContent).toContain('Hello Taylor from compose');
    expect(sidebarConversation('Taylor Brooks')).toBeTruthy();
    expect(document.activeElement).toBe(target.querySelector('.conversation-composer textarea'));
    await openNewMessage();
    expect(target.querySelector('.new-message textarea').value).toBe('');
    expect(document.querySelector('[aria-label="Selected recipients"]')).toBeNull();
  });

  it('opens New message from the mobile header and leaves focus in the recipient field without a drawer', async () => {
    resizeWorkspace(600);
    await tick();
    await click(button('New message', target.querySelector('.team-chat__topbar')));
    await vi.waitFor(() => expect(document.querySelector('.aesir-drawer')).toBeNull());
    expect(target.querySelector('.new-message')).toBeTruthy();
    expect(document.activeElement).toBe(recipientInput());
  });

  it('creates and reuses group conversations and exposes their members, without replacing one-to-one messages', async () => {
    await openNewMessage();
    await click(recipientCheckbox('Morgan Chen'));
    await click(recipientCheckbox('Sam Rivera'));
    await type(target.querySelector('.new-message textarea'), 'First group message');
    await click(target.querySelector('.new-message button[type="submit"]'));
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('Morgan Chen, Sam Rivera');
    expect(button('View 3 conversation members')).toBeTruthy();
    expect(target.querySelector('.message-list').textContent).toContain('First group message');
    expect(target.querySelector('.message-list').textContent).not.toContain('Hey Alex!');
    await click(button('View 3 conversation members'));
    expect(document.querySelectorAll('.member-list .chat-avatar')).toHaveLength(3);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await tick();
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    await openNewMessage();
    await click(recipientCheckbox('Sam Rivera'));
    await click(recipientCheckbox('Morgan Chen'));
    await type(target.querySelector('.new-message textarea'), 'Same group again');
    await click(target.querySelector('.new-message button[type="submit"]'));
    expect(target.querySelector('.message-list').textContent).toContain('First group message');
    expect(target.querySelector('.message-list').textContent).toContain('Same group again');
    expect([...target.querySelectorAll('.aesir-sidebar__desktop .aesir-sidebar__item')].filter((node) => node.textContent.includes('Morgan Chen, Sam Rivera'))).toHaveLength(1);
    await click(button('Search conversations and messages'));
    const groupResult = [...document.querySelectorAll('[data-search-kind="group"]')].find((node) => node.querySelector('.search-result__name').textContent === 'Morgan Chen, Sam Rivera');
    expect(groupResult.querySelector('.search-result__name').textContent).toBe('Morgan Chen, Sam Rivera');
    await click(groupResult.closest('[role="option"]'));
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    expect(target.querySelector('.message-list').textContent).toContain('Same group again');
    await openNewMessage();
    await click(recipientCheckbox('Morgan Chen'));
    await type(target.querySelector('.new-message textarea'), 'Just Morgan');
    await click(target.querySelector('.new-message button[type="submit"]'));
    expect(button('View 2 conversation members')).toBeUndefined();
    expect(target.querySelector('.message-list').textContent).toContain('Just Morgan');
    expect(target.querySelector('.message-list').textContent).not.toContain('First group message');
  });

  it.each([320, 1000])('shows editable About cards, preserves details across tabs and reopening, and copies the stable ID at %ipx', async (width) => {
    if (width < 760) {
      await enterMobile(width);
      await click(button('Open #design-system'));
    }
    await type(target.querySelector('.conversation-composer textarea'), 'Keep my draft');
    await click(button('About #design-system'));
    const about = document.querySelector('.channel-about');
    expect([...about.querySelectorAll('.aesir-card__title')].map((node) => node.textContent)).toEqual(['Channel name', 'Topic', 'Description']);
    expect(about.querySelector('.conversation-detail.empty').textContent).toBe('Add a topic');
    expect(about.querySelector('.conversation-id-value').textContent).toBe('design-system');
    await click(button('Edit topic'));
    let input = document.querySelector('[data-conversation-detail]');
    expect(document.activeElement).toBe(input);
    expect(input.maxLength).toBe(250);
    await type(input, '  A topic\nWith a second line  ');
    await click(textButton('Save topic', about));
    expect(about.querySelectorAll('.conversation-detail')[0].textContent).toBe('A topic\nWith a second line');
    expect(document.activeElement).toBe(button('Edit topic'));
    await click(button('Edit topic'));
    input = document.querySelector('[data-conversation-detail]');
    await type(input, 'Discard me');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await tick();
    expect(about.querySelectorAll('.conversation-detail')[0].textContent).toBe('A topic\nWith a second line');
    expect(document.querySelector('.chat-channel-dialog')).toBeTruthy();
    await click(button('Edit description'));
    await type(document.querySelector('[data-conversation-detail]'), 'Updated channel description');
    await click(textButton('Save description', about));
    await click(button('Rename conversation'));
    await type(document.querySelector('[data-conversation-name]'), 'design-team');
    await click(textButton('Save name', about));
    expect(about.querySelector('.conversation-id-value').textContent).toBe('design-system');
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    vi.stubGlobal('navigator', Object.create(navigator, { clipboard: { value: clipboard, configurable: true } }));
    await click(button('Copy channel ID'));
    expect(clipboard.writeText).toHaveBeenCalledWith('design-system');
    expect(about.querySelector('[role="status"]').textContent).toBe('Channel ID copied.');
    clipboard.writeText.mockRejectedValueOnce(new Error('Denied'));
    await click(button('Copy channel ID'));
    expect(about.querySelector('[role="status"]').textContent).toContain('copy it manually');
    await click([...document.querySelectorAll('[role="tab"]')].find((node) => node.textContent === 'Members 4'));
    await click([...document.querySelectorAll('[role="tab"]')].find((node) => node.textContent === 'About'));
    expect(about.querySelectorAll('.conversation-detail')[0].textContent).toBe('A topic\nWith a second line');
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep my draft');
    await click(button('About #design-team'));
    expect(document.querySelector('.conversation-name').textContent).toBe('# design-team');
    expect(document.querySelectorAll('.conversation-detail')[1].textContent).toBe('Updated channel description');
    await click(button('Edit topic'));
    await type(document.querySelector('[data-conversation-detail]'), '');
    await click(textButton('Save topic', document.querySelector('.channel-about')));
    expect(document.querySelector('.conversation-detail.empty').textContent).toBe('Add a topic');
  });

  it.each([390, 1000])('renames a group through About, preserves its draft and history, and updates navigation and search at %ipx', async (width) => {
    await openNewMessage();
    await click(recipientCheckbox('Morgan Chen'));
    await click(recipientCheckbox('Sam Rivera'));
    await type(target.querySelector('.new-message textarea'), 'Keep the group history');
    await click(target.querySelector('.new-message button[type="submit"]'));
    const original = 'Morgan Chen, Sam Rivera';
    if (width < 760) {
      await enterMobile(width);
      await click(mobileTab('DMs'));
      await click(button(`Open ${original}`));
    }
    await type(target.querySelector('.conversation-composer textarea'), 'Keep my group draft');
    await click(button(`About ${original}`));
    expect(document.querySelector('[role="tab"][aria-selected="true"]').textContent).toBe('About');
    await click(button('Rename conversation'));
    const input = document.querySelector('input[data-conversation-name]');
    await vi.waitFor(() => expect(document.activeElement).toBe(input));
    expect(input.value).toBe(original);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(original.length);
    await type(input, '  Release crew  ');
    await click(textButton('Save name', document.querySelector('.conversation-name-form')));
    await vi.waitFor(() => expect(document.querySelector('.conversation-name-form')).toBeNull());
    expect(document.activeElement).toBe(button('Rename conversation'));
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('Release crew');
    expect(document.querySelectorAll('.channel-about .about-card')).toHaveLength(2);
    await click(button('Edit topic'));
    await type(document.querySelector('[data-conversation-detail]'), 'Group launch planning');
    await click(textButton('Save topic', document.querySelector('.channel-about')));
    expect(document.querySelector('.conversation-detail').textContent).toBe('Group launch planning');
    const membersTab = [...document.querySelectorAll('[role="tab"]')].find((node) => node.textContent === 'Members 3');
    await click(membersTab);
    expect(document.querySelectorAll('.member-list .chat-avatar')).toHaveLength(3);
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep my group draft');
    expect(target.querySelector('.message-list').textContent).toContain('Keep the group history');
    if (width < 760) {
      await click(mobileTab('DMs'));
      expect(button('Open Release crew')).toBeTruthy();
      expect(button(`Open ${original}`)).toBeUndefined();
      await click(mobileTab('Search'));
      await type(target.querySelector('[aria-label="Search messages, people, and channels"]'), 'Release crew');
      expect(target.querySelector('[data-mobile-search-result]').textContent).toContain('Release crew');
    } else {
      expect(sidebarConversation('Release crew')).toBeTruthy();
      expect(sidebarConversation(original)).toBeUndefined();
      await click(button('Search conversations and messages'));
      await type(document.querySelector('[role="combobox"]'), 'Release crew');
      expect(document.querySelector('[data-search-kind="group"] .search-result__name').textContent).toBe('Release crew');
    }
  });

  it('cancels invalid and unsaved group names, supports form submission, and reuses a renamed group for the same people', async () => {
    await openNewMessage();
    await click(recipientCheckbox('Morgan Chen'));
    await click(recipientCheckbox('Sam Rivera'));
    await type(target.querySelector('.new-message textarea'), 'Original group message');
    await click(target.querySelector('.new-message button[type="submit"]'));
    await click(button('About Morgan Chen, Sam Rivera'));
    await click(button('Rename conversation'));
    let input = document.querySelector('input[data-conversation-name]');
    expect(input.maxLength).toBe(80);
    await type(input, '   ');
    expect(textButton('Save name', document.querySelector('.conversation-name-form')).disabled).toBe(true);
    await type(input, 'x'.repeat(81));
    expect(textButton('Save name', document.querySelector('.conversation-name-form')).disabled).toBe(true);
    await type(input, 'Discarded name');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('.conversation-name-form')).toBeNull());
    expect(document.querySelector('.chat-channel-dialog')).toBeTruthy();
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('Morgan Chen, Sam Rivera');
    await click(button('Rename conversation'));
    input = document.querySelector('input[data-conversation-name]');
    expect(input.value).toBe('Morgan Chen, Sam Rivera');
    await type(input, 'Another discarded name');
    await click(textButton('Cancel', document.querySelector('.conversation-name-form')));
    await click(button('Rename conversation'));
    input = document.querySelector('input[data-conversation-name]');
    expect(input.value).toBe('Morgan Chen, Sam Rivera');
    await type(input, 'Project crew');
    document.querySelector('.conversation-name-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await tick();
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('Project crew');
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    await openNewMessage();
    await click(recipientCheckbox('Sam Rivera'));
    await click(recipientCheckbox('Morgan Chen'));
    await type(target.querySelector('.new-message textarea'), 'Still the same group');
    await click(target.querySelector('.new-message button[type="submit"]'));
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('Project crew');
    expect(target.querySelector('.message-list').textContent).toContain('Original group message');
    expect(target.querySelector('.message-list').textContent).toContain('Still the same group');
    expect([...target.querySelectorAll('.aesir-sidebar__item')].filter((node) => node.textContent.includes('Project crew'))).toHaveLength(1);
  });

  it('opens a #channel through the recipient search without creating a room or losing the new-message draft', async () => {
    await openNewMessage();
    await type(target.querySelector('.new-message textarea'), 'Keep recipient draft');
    await click(recipientCheckbox('Sam Rivera'));
    await type(recipientInput(), '#engineering');
    expect(document.querySelectorAll('.new-message-options input[type="checkbox"]')).toHaveLength(0);
    await click(button('Open #engineering'));
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('engineering');
    expect(target.querySelector('.message-list').textContent).toContain('The preview build is ready');
    await openNewMessage();
    expect(target.querySelector('.new-message textarea').value).toBe('Keep recipient draft');
    expect(recipientCheckbox('Sam Rivera').checked).toBe(true);
    const input = recipientInput();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(recipientCheckbox('Morgan Chen'));
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
    await tick();
    expect(button('Remove Sam Rivera from recipients')).toBeUndefined();
  });

  async function openPreferences() {
    await click(accountTrigger());
    await click(menuItem('Preferences'));
    await vi.waitFor(() => expect(document.querySelector('.chat-preferences')).toBeTruthy());
  }
  const preferenceSection = (name) => [...document.querySelectorAll('.preferences-navigation button')].find((node) => node.textContent.trim() === name);
  function preferenceField(name) {
    const select = [...document.querySelectorAll('.chat-preferences [role="combobox"]')].find((node) => document.getElementById(node.getAttribute('aria-labelledby'))?.textContent === name);
    if (select) return select.closest('.aesir-select').querySelector('.aesir-select__native');
    const label = [...document.querySelectorAll('.chat-preferences label')].find((node) => node.textContent.trim() === name);
    return document.getElementById(label.getAttribute('for'));
  }
  async function selectPreference(name, value) {
    const field = preferenceField(name);
    const trigger = field.closest('.aesir-select').querySelector('[role="combobox"]');
    await click(trigger);
    const list = document.getElementById(trigger.getAttribute('aria-controls'));
    const labels = { weekdays: 'Monday–Friday', mentions: 'Direct messages and mentions', purple: 'Purple', compact: 'Compact', 'modifier-enter': 'Ctrl / ⌘ + Enter' };
    await click([...list.querySelectorAll('[role="option"]')].find((option) => option.textContent.trim() === (labels[value] ?? value)));
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  }
  async function closePreferences() {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await tick();
    await vi.waitFor(() => expect(document.querySelector('.chat-preferences')).toBeNull());
  }

  it('opens Preferences from the account menu and keeps working hours and status settings after closing', async () => {
    accountTrigger().focus();
    await openPreferences();
    expect(document.querySelector('.chat-preferences-dialog').getAttribute('aria-modal')).toBe('true');
    expect(preferenceSection('Availability').getAttribute('aria-current')).toBe('page');
    expect(preferenceField('From').value).toBe('08:00');
    await selectPreference('Allow notifications', 'weekdays');
    await selectPreference('From', '09:30');
    await click(preferenceField('🕰️ After hours'));
    await closePreferences();
    expect(document.activeElement).toBe(accountTrigger());
    await openPreferences();
    expect(preferenceField('Allow notifications').value).toBe('weekdays');
    expect(preferenceField('From').value).toBe('09:30');
    expect(preferenceField('🕰️ After hours').checked).toBe(true);
    await click(preferenceSection('Notifications'));
    await selectPreference('Default notifications', 'mentions');
    await click(preferenceSection('Availability'));
    await click(preferenceSection('Notifications'));
    expect(preferenceField('Default notifications').value).toBe('mentions');
  });

  it('applies preferences to the workspace and resets them without losing a conversation draft', async () => {
    await type(target.querySelector('.conversation-composer textarea'), 'Keep this draft');
    const count = target.querySelectorAll('.message-anchor').length;
    await openPreferences();
    await click(preferenceSection('Appearance'));
    await selectPreference('Accent color', 'purple');
    await selectPreference('Message spacing', 'compact');
    expect(target.querySelector('.team-chat').dataset.aesirAccent).toBe('purple');
    expect(target.querySelector('.team-chat').dataset.density).toBe('compact');
    expect(document.querySelector('.chat-preferences-dialog').dataset.aesirAccent).toBe('purple');
    await click(preferenceSection('Messages & media'));
    await click(preferenceField('Show message timestamps'));
    expect(message('design-1').querySelector('.chat-message header time')).toBeNull();
    await click(preferenceSection('Navigation'));
    const morganRow = [...target.querySelectorAll('.aesir-sidebar__desktop button')].find((node) => node.textContent.includes('Morgan Chen'));
    expect(morganRow.querySelector('.aesir-badge')).toBeTruthy();
    await click(preferenceField('Show unread message badges'));
    expect(morganRow.querySelector('.aesir-badge')).toBeNull();
    await click(preferenceSection('Accessibility'));
    await click(preferenceField('Use larger message text'));
    await click(preferenceField('Always underline links in messages'));
    expect(target.querySelector('.team-chat').hasAttribute('data-larger-text')).toBe(true);
    expect(target.querySelector('.team-chat').dataset.underlineLinks).toBe('false');
    await click(preferenceSection('Advanced'));
    await click([...document.querySelectorAll('.chat-preferences button')].find((node) => node.textContent.trim() === 'Reset preferences'));
    expect(target.querySelector('.team-chat').dataset.aesirAccent).toBe('green');
    expect(target.querySelector('.team-chat').dataset.density).toBe('comfortable');
    expect(target.querySelector('.team-chat').hasAttribute('data-larger-text')).toBe(false);
    expect(message('design-1').querySelector('.chat-message header time')).toBeTruthy();
    expect(target.querySelectorAll('.message-anchor')).toHaveLength(count);
    await closePreferences();
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep this draft');
  });

  it('uses the chosen send shortcut while keeping normal Enter available for a newline', async () => {
    await openPreferences();
    await click(preferenceSection('Messages & media'));
    await selectPreference('Send a message with', 'modifier-enter');
    await closePreferences();
    const composer = target.querySelector('.conversation-composer textarea');
    await type(composer, 'Send with a modifier');
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    composer.dispatchEvent(enter);
    await tick();
    expect(enter.defaultPrevented).toBe(false);
    expect(composer.value).toBe('Send with a modifier');
    const send = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true, cancelable: true });
    composer.dispatchEvent(send);
    await tick();
    expect(send.defaultPrevented).toBe(true);
    expect(composer.value).toBe('');
    expect(target.querySelector('.message-list').textContent).toContain('Send with a modifier');
  });

  it('opens About from the channel name and switches to Members with linked keyboard tabs', async () => {
    const trigger = button('About #design-system');
    trigger.focus();
    await click(trigger);
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    expect(tabs.map((tab) => tab.textContent.trim())).toEqual(['About', 'Members 4']);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    const panel = document.getElementById(tabs[0].getAttribute('aria-controls'));
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs[0].id);
    expect(panel.hidden).toBe(false);
    expect(panel.textContent).toContain('Components, patterns, and the details in between.');
    expect(document.querySelector('.chat-members')).toBeNull();
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await tick();
    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(document.querySelectorAll('.member-list .chat-avatar')).toHaveLength(4);
    expect(panel.hidden).toBe(true);
    await click(tabs[0]);
    expect(panel.hidden).toBe(false);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await tick();
    expect(document.activeElement).toBe(trigger);
  });

  it('opens Members directly from channel options and does not add About to direct messages', async () => {
    await click(button('Channel options'));
    expect(menuItem('About')).toBeTruthy();
    await click(menuItem('Members'));
    await vi.waitFor(() => expect(document.querySelector('.chat-members')).toBeTruthy());
    expect(document.querySelector('[role="tab"][aria-selected="true"]').textContent).toBe('Members 4');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await tick();
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    await click([...target.querySelectorAll('.aesir-sidebar__desktop button')].find((node) => node.textContent.includes('Morgan Chen')));
    expect(button('View 2 conversation members')).toBeUndefined();
    expect(target.querySelector('.member-count')).toBeNull();
    expect(document.querySelector('[role="tablist"]')).toBeNull();
    expect(document.querySelector('.chat-channel-dialog')).toBeNull();
  });

  it('keeps a viewport-clamped channel dialog height across tabs, member filtering and the add-people picker', async () => {
    // Vitest does not apply extracted component CSS; use the real compiler output.
    layoutStyles = document.createElement('style');
    layoutStyles.textContent = [
      [workspaceSource, 'team-chat-pattern-example'],
      [detailsSource, 'team-chat-channel-details']
    ]
      .map(([source, file]) => compile(source, { filename: resolve(import.meta.dirname, `../src/lib/components/docs/examples/team-chat/${file}.svelte`), generate: 'client' }).css.code)
      .join('\n');
    document.head.append(layoutStyles);
    await click(button('About #design-system'));
    const dialog = document.querySelector('.chat-channel-dialog');
    // JSDOM does not resolve viewport units and design tokens into layout sizes.
    const dialogRule = [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules]).find((rule) => rule.selectorText === '.chat-channel-dialog');
    const height = dialogRule.style.height;
    expect(height).toBe('min(var(--ds-sizing-3xl), calc(100dvh - var(--ds-spacing-8)))');
    expect(dialogRule.style.width).toBe('min(100%, var(--ds-sizing-2xl))');
    expect(getComputedStyle(dialog).overflow).toBe('hidden');
    expect(getComputedStyle(dialog.querySelector('.aesir-dialog__body')).overflow).toBe('hidden');
    const details = dialog.querySelector('.channel-details');
    expect(getComputedStyle(details).gridTemplateRows).toBe('auto minmax(0, 1fr)');
    const tabs = [...dialog.querySelectorAll('[role="tab"]')];
    for (const panel of dialog.querySelectorAll('[role="tabpanel"]')) {
      expect(getComputedStyle(panel).overflow).toBe('auto');
      expect(getComputedStyle(panel).scrollbarGutter).toBe('stable');
      expect(panel.contains(dialog.querySelector('[role="tablist"]'))).toBe(false);
    }
    await click(tabs[1]);
    expect(dialogRule.style.height).toBe(height);
    await type(dialog.querySelector('[aria-label="Search members"]'), 'No matching person');
    expect(dialog.querySelector('.member-list').textContent).toContain('No members match');
    expect(dialogRule.style.height).toBe(height);
    await click(button('Add people'));
    expect(document.querySelector('.chat-add-people-dialog')).toBeTruthy();
    expect(dialogRule.style.height).toBe(height);
    await cancelAddPeople();
    await click(tabs[0]);
    expect(dialogRule.style.height).toBe(height);
    expect(document.querySelector('.chat-channel-dialog')).toBe(dialog);
    expect(dialog.querySelector('.channel-about')).toBeTruthy();
  });

  it.each([1000, 390, 320])('uses a content-height add-people dialog with chips, capped suggestions and a separate footer at %s px', async (width) => {
    layoutStyles = document.createElement('style');
    layoutStyles.textContent = [
      [workspaceSource, resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-pattern-example.svelte')],
      [detailsSource, resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-channel-details.svelte')],
      [addPeopleSource, resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-add-people.svelte')],
      [scrollAreaSource, resolve(import.meta.dirname, '../../../packages/aesir-svelte/dist/components/aesir-scroll-area/aesir-scroll-area.svelte')]
    ]
      .map(([source, filename]) => compile(source, { filename, generate: 'client' }).css.code)
      .join('\n');
    document.head.append(layoutStyles);
    await enterMobile(width);
    if (width < 760) await click(button('Open #design-system'));
    await click(button('View 4 conversation members'));
    await click(button('Add people'));
    const mainDialog = document.querySelector('.chat-channel-dialog');
    const dialog = document.querySelector('.chat-add-people-dialog');
    const body = dialog.querySelector('.aesir-dialog__body');
    const footer = dialog.querySelector('.aesir-dialog__footer');
    expect(getComputedStyle(dialog).gridTemplateRows).toBe('auto minmax(0, 1fr) auto');
    expect(getComputedStyle(dialog).overflow).toBe('hidden');
    expect(getComputedStyle(body).overflow).toBe('auto');
    expect(body.contains(footer)).toBe(false);
    expect(dialog.querySelector('input[type="checkbox"]')).toBeNull();
    expect(document.querySelector('.add-people-suggestions')).toBeNull();
    await vi.waitFor(() => expect(document.activeElement).toBe(addPeopleInput()));
    await click(addPeopleInput());
    const options = document.querySelector('.add-people-options');
    const viewport = options.querySelector('[data-slot="scroll-area-viewport"]');
    expect(getComputedStyle(options).height).toBe('auto');
    expect(getComputedStyle(options).maxHeight).toBe('var(--ds-sizing-xs)');
    expect(viewport.getAttribute('aria-label')).toBe('People you can add');
    expect(options.querySelectorAll('[data-add-person]')).toHaveLength(Object.keys(demoPeople).length - 4);
    expect(options.contains(footer)).toBe(false);
    await selectPersonToAdd('Taylor Brooks');
    const chip = button('Remove Taylor Brooks from selection');
    expect(chip.querySelector('.chat-avatar')).toBeTruthy();
    expect(chip.closest('.add-people-control').contains(addPeopleInput())).toBe(true);
    expect(button('Add selected people').disabled).toBe(false);
    expect(footer.contains(button('Add selected people'))).toBe(true);
    await cancelAddPeople();
    expect(document.querySelector('.chat-channel-dialog')).toBe(mainDialog);
    expect(mainDialog.querySelectorAll('.member-list .chat-avatar')).toHaveLength(4);
    expect(document.activeElement).toBe(button('Add people'));
  });

  async function ownAction(id, action) {
    await click(button('More message options', message(id)));
    await click(menuItem(action));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"][aria-label="Your message options"]')).toBeNull());
  }
  const textButton = (text, root = document) => [...root.querySelectorAll('button')].find((node) => node.textContent.trim() === text);

  it('offers edit and delete only for own messages and cancels inline edits without changing a draft', async () => {
    await click(button('More message options', message('design-1')));
    expect(menuItem('Unpin message')).toBeTruthy();
    expect(menuItem('Edit message')).toBeUndefined();
    expect(menuItem('Delete message')).toBeUndefined();
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    const draft = target.querySelector('.conversation-composer textarea');
    await type(draft, 'Unsent conversation draft');
    const original = message('design-4').querySelector('.chat-text').textContent;
    await ownAction('design-4', 'Edit message');
    const editor = message('design-4').querySelector('textarea');
    expect(document.activeElement).toBe(editor);
    expect(editor.value).toContain('Agreed.');
    expect(button('Schedule message', message('design-4'))).toBeUndefined();
    await type(editor, '   ');
    expect(textButton('Save changes', message('design-4')).disabled).toBe(true);
    await type(editor, 'Changed but cancelled');
    editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await tick();
    expect(message('design-4').querySelector('textarea')).toBeNull();
    expect(message('design-4').querySelector('.chat-text').textContent).toBe(original);
    expect(message('design-4').querySelector('.chat-message__edited')).toBeNull();
    expect(draft.value).toBe('Unsent conversation draft');
    await vi.waitFor(() => expect(document.activeElement.getAttribute('aria-label')).toBe('More message options'));
  });

  it.each([390, 1000])('pins and unpins own and other messages, updates the pinned filter and preserves drafts and saved state at %ipx', async (width) => {
    if (width < 760) {
      await enterMobile(width);
      await click(button('Open #design-system'));
    }
    const draft = target.querySelector('.conversation-composer textarea');
    await type(draft, 'Keep the draft while pinning');
    const action = async (id, label) => {
      const trigger = button('More message options', message(id));
      trigger.focus();
      await click(trigger);
      expect(menuItem(label).querySelector('svg')).toBeTruthy();
      await click(menuItem(label));
      await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    };
    await action('design-2', 'Pin message');
    expect(message('design-2').querySelector('.chat-message__pinned').textContent).toContain('Pinned');
    expect(target.querySelector('[aria-live="polite"]').textContent).toBe('Message pinned');
    expect(document.activeElement).toBe(button('More message options', message('design-2')));
    await action('design-4', 'Pin message');
    expect(message('design-4').querySelector('.chat-message__pinned')).toBeTruthy();
    expect(draft.value).toBe('Keep the draft while pinning');
    await click(button('Show pinned messages'));
    expect(button('Show all messages').getAttribute('aria-pressed')).toBe('true');
    expect([...target.querySelectorAll('[data-message-id]')].map((node) => node.dataset.messageId)).toEqual(['design-1', 'design-2', 'design-4']);
    await action('design-2', 'Unpin message');
    expect(message('design-2')).toBeNull();
    expect(document.activeElement).toBe(button('Show all messages'));
    await action('design-4', 'Unpin message');
    await action('design-1', 'Unpin message');
    expect(target.querySelectorAll('[data-message-id]')).toHaveLength(0);
    expect(target.querySelector('.chat-empty').textContent).toContain('No pinned messages');
    expect(document.activeElement).toBe(button('Show all messages'));
    expect(draft.value).toBe('Keep the draft while pinning');
    await click(button('Show all messages'));
    expect(message('design-1')).toBeTruthy();
    expect(message('design-1').querySelector('.chat-message__pinned')).toBeNull();
    if (width < 760) {
      await click(button('More message options', message('design-1')));
      expect(menuItem('Remove from saved messages')).toBeTruthy();
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    } else expect(button('Remove from saved messages', message('design-1'))).toBeTruthy();
    await action('design-2', 'Pin message');
    if (width < 760) {
      await click(mobileTab('Home'));
      await click(button('Open #general'));
      await click(mobileTab('Home'));
      await click(button('Open #design-system'));
    } else {
      await click(target.querySelector('[data-channel="general"]').closest('button'));
      await click(target.querySelector('[data-channel="design-system"]').closest('button'));
    }
    await click(button('Show pinned messages'));
    expect([...target.querySelectorAll('[data-message-id]')].map((node) => node.dataset.messageId)).toEqual(['design-2']);
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep the draft while pinning');
  });

  it('saves formatted edits in place, updates live reply quotes and keeps the bottom draft', async () => {
    await click(button('Reply to Alex Johnson', message('design-4')));
    await type(target.querySelector('.conversation-composer textarea'), 'Reply to my original');
    await click(button('Send message'));
    const reply = [...document.querySelectorAll('[data-message-id]')].at(-1);
    await type(target.querySelector('.conversation-composer textarea'), 'Keep this draft');
    await ownAction('design-4', 'Edit message');
    await type(message('design-4').querySelector('textarea'), '**Updated** with a new detail');
    await click(textButton('Save changes', message('design-4')));
    expect(message('design-4').querySelector('.chat-text strong').textContent).toBe('Updated');
    expect(message('design-4').querySelector('.chat-message__edited').textContent).toBe('(edited)');
    expect(reply.querySelector('.chat-quote').textContent).toContain('Updated with a new detail');
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep this draft');
    expect(document.querySelectorAll('[data-message-id]')).toHaveLength(8);
    await ownAction('design-4', 'Edit message');
    await type(message('design-4').querySelector('textarea'), 'Saved with Enter');
    message('design-4')
      .querySelector('textarea')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await tick();
    expect(message('design-4').querySelector('.chat-text').textContent).toBe('Saved with Enter');
  });

  it('confirms deletion, preserves replies, clears a pending reply target and removes saved copies', async () => {
    await click(button('Save message', message('design-4')));
    await click(button('Reply to Alex Johnson', message('design-4')));
    await type(target.querySelector('.conversation-composer textarea'), 'Reply left after deletion');
    await click(button('Send message'));
    const reply = [...document.querySelectorAll('[data-message-id]')].at(-1);
    await click(button('Reply to Alex Johnson', message('design-4')));
    await type(target.querySelector('.conversation-composer textarea'), 'Pending reply draft');
    await ownAction('design-4', 'Delete message');
    let dialog = document.querySelector('[role="alertdialog"]');
    expect(dialog.textContent).toContain('This cannot be undone.');
    await click(textButton('Cancel', dialog));
    await vi.waitFor(() => expect(document.querySelector('[role="alertdialog"]')).toBeNull());
    expect(message('design-4')).toBeTruthy();
    await ownAction('design-4', 'Delete message');
    dialog = document.querySelector('[role="alertdialog"]');
    await click(textButton('Delete message', dialog));
    await vi.waitFor(() => expect(document.querySelector('[role="alertdialog"]')).toBeNull());
    expect(message('design-4')).toBeNull();
    expect(reply.textContent).toContain('Original message unavailable');
    expect(reply.textContent).toContain('Reply left after deletion');
    expect(target.querySelector('.conversation-composer .chat-quote')).toBeNull();
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Pending reply draft');
    expect(document.activeElement).toBe(target.querySelector('.conversation-composer textarea'));
    await click(target.querySelector('[data-value="saved"]') ?? [...target.querySelectorAll('button')].find((node) => node.textContent.includes('Saved messages')));
    expect(message('design-4')).toBeNull();
  });
  it('searches channel members and non-members together and adds people directly from the list', async () => {
    await click(target.querySelector('[data-channel="engineering"]').closest('button'));
    await click(button('View 3 conversation members'));
    const root = document.querySelector('.chat-members');
    const search = root.querySelector('[aria-label="Search members"]');
    expect(root.querySelector('.member-list').textContent).not.toContain('Morgan Chen');
    expect(root.querySelector('.other-people-list')).toBeNull();
    expect(root.querySelector('select')).toBeNull();
    expect(button('Add people')).toBeTruthy();
    await type(search, '   ');
    expect(root.querySelector('.other-people-list')).toBeNull();
    await type(search, 'morgan');
    expect(root.querySelector('.member-list').textContent).toContain('No members match');
    expect(button('Add Morgan Chen to channel')).toBeTruthy();
    await click(button('Clear member search'));
    expect(root.querySelector('.other-people-list')).toBeNull();
    expect(root.querySelectorAll('.member-list .chat-avatar')).toHaveLength(3);
    await type(search, 'morgan');
    const filter = root.querySelector('[role="combobox"]');
    const chooseFilter = async (label) => {
      await click(filter);
      await click([...document.querySelectorAll('[role="listbox"] [role="option"]')].find((option) => option.textContent.trim() === label));
    };
    await chooseFilter('In this channel');
    expect(root.querySelector('.other-people-list')).toBeNull();
    await chooseFilter('All');
    await click(button('Add Morgan Chen to channel'));
    expect(root.querySelector('.member-list').textContent).toContain('Morgan Chen');
    expect(root.querySelector('.other-people-list').textContent).not.toContain('Morgan Chen');
    expect(root.querySelector('.other-people-list').textContent).toContain('No people match your search');
    expect(button('View 4 conversation members', target)).toBeTruthy();
    expect(document.activeElement).toBe(search);
    expect(button('View 4 conversation members', target).querySelectorAll('.member-avatar-stack [data-gradient]')).toHaveLength(3);
    await chooseFilter('Not in this channel');
    expect(root.querySelector('.member-list')).toBeNull();
    await type(search, '');
    expect(root.querySelector('.other-people-list')).toBeNull();
    expect(root.querySelector('select')).toBeNull();
    expect(root.querySelectorAll('.member-list .chat-avatar')).toHaveLength(4);
    await type(search, 'Taylor');
    expect(root.querySelector('[role="combobox"]').textContent.trim()).toBe('All');
    expect(button('Add Taylor Brooks to channel')).toBeTruthy();
    await click(button('Clear member search'));
    expect(root.querySelector('.other-people-list')).toBeNull();
    expect(button('Add people')).toBeTruthy();
  });

  it('blocks background navigation and avatar previews while a channel or account menu is open', async () => {
    const channel = target.querySelector('[data-channel="engineering"]').closest('button');
    await click(button('Channel options'));
    await vi.waitFor(() => expect(document.querySelector('[data-aesir-menu-backdrop]')).toBeTruthy());
    // jsdom does not hit-test the transparent backdrop; exercise the gesture phases explicitly.
    channel.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
    await tick();
    await click(channel);
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('design-system');
    await click(channel);
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('engineering');
    await click(accountTrigger());
    await vi.waitFor(() => expect(document.querySelector('[data-aesir-menu-backdrop]')).toBeTruthy());
    const avatar = button("View Sam Rivera's profile", message('engineering-1'));
    avatar.dispatchEvent(new Event('pointerenter'));
    expect(document.querySelector('.chat-person-preview')).toBeNull();
    await click(avatar);
    expect(document.querySelector('.chat-profile')).toBeNull();
    await vi.waitFor(() => expect(document.querySelector('[data-aesir-menu-backdrop]')).toBeNull());
  });
  it('shows Add people in channel members and explains when everyone is already a member', async () => {
    await unmount(component);
    const { default: Members } = await import('../src/lib/components/docs/examples/team-chat/team-chat-members.svelte');
    const { people } = await import('../src/lib/components/docs/examples/team-chat/team-chat-demo.js');
    component = mount(Members, { target, props: { room: { type: 'channel', members: Object.keys(people) }, people, onadd: vi.fn() } });
    flushSync();
    await click(button('Add people'));
    expect(document.querySelector('.chat-add-people-dialog').textContent).toContain('Everyone in this workspace is already in this channel.');
    expect(button('Add selected people').disabled).toBe(true);
    await vi.waitFor(() => expect(document.activeElement).toBe(addPeopleInput()));
    await cancelAddPeople();
    expect(document.activeElement).toBe(button('Add people'));
    expect(document.querySelectorAll('.member-list .chat-avatar')).toHaveLength(Object.keys(people).length);
  });

  it('searches and adds an existing workspace person to a channel without duplicates', async () => {
    await click(target.querySelector('[data-channel="engineering"]').closest('button'));
    await click(button('View 3 conversation members'));
    await click(button('Add people'));
    const input = addPeopleInput();
    const picker = () => document.querySelector('.add-people-suggestions');
    await click(input);
    expect(picker().querySelectorAll('[data-add-person]')).toHaveLength(Object.keys(demoPeople).length - 3);
    expect(button('Select Morgan Chen')).toBeTruthy();
    expect(button('Select Sam Rivera')).toBeUndefined();
    await type(input, 'nobody');
    expect(picker().textContent).toContain('No people match your search.');
    await type(input, ' MORGAN ');
    await click(button('Select Morgan Chen'));
    expect(button('Add selected people').disabled).toBe(false);
    await click(button('Add selected people'));
    await vi.waitFor(() => expect(document.querySelector('.chat-add-people-dialog')).toBeNull());
    expect(document.querySelector('.member-list').textContent).toContain('Morgan Chen');
    expect(document.querySelectorAll('.member-list .chat-avatar')).toHaveLength(4);
    expect(button('View 4 conversation members', target)).toBeTruthy();
    expect(target.querySelector('[aria-live="polite"]').textContent).toContain('Added Morgan Chen to # engineering.');
    expect(document.activeElement).toBe(button('Add people'));
    await click(button('Add people'));
    await type(addPeopleInput(), 'Morgan');
    expect(button('Select Morgan Chen')).toBeUndefined();
    expect(picker().textContent).toContain('No people match');
    expect(button('Add selected people').disabled).toBe(true);
  });

  it('cancels member selection without changing the channel and does not offer channel additions in DMs', async () => {
    await click(target.querySelector('[data-channel="engineering"]').closest('button'));
    await click(button('View 3 conversation members'));
    await click(button('Add people'));
    await selectPersonToAdd('Morgan Chen');
    await cancelAddPeople();
    expect(document.querySelectorAll('.member-list .chat-avatar')).toHaveLength(3);
    await click(button('Add people'));
    expect(document.querySelector('.add-people-chip')).toBeNull();
    expect(button('Add selected people').disabled).toBe(true);
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('.chat-add-people-dialog')).toBeNull());
    expect(document.querySelector('.chat-channel-dialog')).toBeTruthy();
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    await click([...target.querySelectorAll('nav button')].find((node) => node.textContent.includes('Morgan Chen')));
    expect(button('View 2 conversation members')).toBeUndefined();
    expect(document.querySelector('.member-list')).toBeNull();
    expect(button('Add people')).toBeUndefined();
  });

  it('supports selecting several people and keeps selection while filtering the picker', async () => {
    await unmount(component);
    const { default: Members } = await import('../src/lib/components/docs/examples/team-chat/team-chat-members.svelte');
    const { people } = await import('../src/lib/components/docs/examples/team-chat/team-chat-demo.js');
    const onadd = vi.fn();
    component = mount(Members, { target, props: { room: { type: 'channel', members: ['you'] }, people, onadd } });
    flushSync();
    await click(button('Add people'));
    await selectPersonToAdd('Morgan Chen');
    await selectPersonToAdd('Sam Rivera');
    await type(addPeopleInput(), 'Nobody');
    expect(document.querySelectorAll('.add-people-chip')).toHaveLength(2);
    expect(button('Add selected people').textContent.replace(/\s+/g, ' ').trim()).toBe('Add 2 people');
    await click(button('Add selected people'));
    expect(onadd).toHaveBeenCalledExactlyOnceWith(['morgan', 'sam']);
  });

  it('selects a person once from the suggestion avatar, name or row and removes chips without changing membership', async () => {
    await click(button('View 4 conversation members'));
    await click(button('Add people'));
    for (const part of ['.chat-avatar', '.add-people-option__name', null]) {
      await type(addPeopleInput(), 'Taylor');
      const option = button('Select Taylor Brooks');
      await click(part ? option.querySelector(part) : option);
      expect(document.querySelectorAll('.add-people-chip')).toHaveLength(1);
      expect(button('Add selected people').textContent.replace(/\s+/g, ' ').trim()).toBe('Add 1 person');
      await click(button('Remove Taylor Brooks from selection'));
      expect(document.querySelector('.add-people-chip')).toBeNull();
      expect(button('Add selected people').disabled).toBe(true);
    }
    await selectPersonToAdd('Taylor Brooks');
    await selectPersonToAdd('Casey Nguyen');
    expect(button('Add selected people').textContent.replace(/\s+/g, ' ').trim()).toBe('Add 2 people');
    await type(addPeopleInput(), 'Taylor');
    expect(button('Select Taylor Brooks')).toBeUndefined();
    await click(button('Add selected people'));
    expect(document.querySelector('.member-list').textContent).toContain('Taylor Brooks');
    expect(document.querySelector('.member-list').textContent).toContain('Casey Nguyen');
    expect(button('View 6 conversation members', target)).toBeTruthy();
  });

  it('supports keyboard selection, chip removal, IME and dismissing suggestions before the add-people dialog', async () => {
    await click(button('View 4 conversation members'));
    await click(button('Add people'));
    const input = addPeopleInput();
    await vi.waitFor(() => expect(document.activeElement).toBe(input));
    await type(input, 'Taylor');
    const composing = new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true });
    input.dispatchEvent(composing);
    expect(composing.defaultPrevented).toBe(false);
    expect(document.querySelector('.add-people-chip')).toBeNull();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.activeElement).toBe(button('Select Taylor Brooks')));
    await click(document.activeElement);
    await vi.waitFor(() => expect(document.activeElement).toBe(input));
    expect(button('Remove Taylor Brooks from selection')).toBeTruthy();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
    await tick();
    expect(document.querySelector('.add-people-chip')).toBeNull();
    await type(input, 'Riley');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await tick();
    expect(button('Remove Riley Park from selection')).toBeTruthy();
    await type(input, 'Nobody');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('.add-people-suggestions')).toBeNull());
    expect(document.querySelector('.chat-add-people-dialog')).toBeTruthy();
    expect(document.activeElement).toBe(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('.chat-add-people-dialog')).toBeNull());
    expect(document.querySelectorAll('.member-list .chat-avatar')).toHaveLength(4);
    expect(document.activeElement).toBe(button('Add people'));
  });

  it('opens a direct conversation with a newly added workspace person without losing the current draft', async () => {
    await type(target.querySelector('.conversation-composer textarea'), 'Keep this channel draft');
    await click(button('View 4 conversation members'));
    await type(document.querySelector('[aria-label="Search members"]'), 'Taylor');
    await click(button('Add Taylor Brooks to channel'));
    await click(button("View Taylor Brooks's profile", document.querySelector('.member-list')));
    const profile = document.querySelector('.chat-profile');
    await click([...profile.querySelectorAll('button')].find((node) => node.textContent.trim() === 'Message'));
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('Taylor Brooks');
    expect(target.querySelector('.conversation-composer textarea').value).toBe('');
    await type(target.querySelector('.conversation-composer textarea'), 'Hello Taylor');
    await click(button('Send message'));
    expect(document.querySelector('.message-list').textContent).toContain('Hello Taylor');
    await click(target.querySelector('[data-channel="design-system"]').closest('button'));
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep this channel draft');
  });

  const preview = () => document.querySelector('.chat-person-preview');
  function pointer(node, type, pointerType = 'mouse') {
    const event = new Event(type, { bubbles: type === 'pointerdown', cancelable: type === 'pointerdown' });
    Object.defineProperty(event, 'pointerType', { value: pointerType });
    node.dispatchEvent(event);
  }
  async function advance(milliseconds) {
    await vi.advanceTimersByTimeAsync(milliseconds);
    await tick();
  }

  it('delays avatar previews, keeps them interactive across the pointer gap, and dismisses on leave', async () => {
    vi.stubGlobal('matchMedia', (query) => ({ matches: query === '(hover: hover) and (pointer: fine)', addEventListener() {}, removeEventListener() {} }));
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-09T12:00:00Z'));
    const avatar = button("View Morgan Chen's profile", message('design-1'));
    const anchor = avatar.closest('.aesir-hover-card__anchor');
    expect(getComputedStyle(anchor).alignSelf).toBe('start');
    expect(getComputedStyle(anchor).height).toBe('fit-content');
    expect(getComputedStyle(anchor).width).toBe('fit-content');
    pointer(avatar, 'pointerenter');
    await advance(349);
    expect(preview()).toBeNull();
    await advance(1);
    const card = preview();
    expect(card.getAttribute('role')).toBe('group');
    expect(card.textContent).toContain('Morgan Chen');
    expect(card.textContent).toContain('Product design');
    expect(card.textContent).toContain('Available');
    expect(card.textContent).toContain('08:00 local time');
    expect(card.querySelector('[data-gradient]')).toBeTruthy();
    expect(avatar.getAttribute('aria-describedby')).toBe(card.id);
    pointer(avatar, 'pointerleave');
    await advance(100);
    pointer(card, 'pointerenter');
    await advance(300);
    expect(preview()).toBe(card);
    await advance(60_000);
    expect(card.textContent).toContain('08:01 local time');
    pointer(card, 'pointerleave');
    await advance(250);
    expect(preview()).toBeNull();
    expect(avatar.hasAttribute('aria-describedby')).toBe(false);
  });

  it('opens previews on keyboard focus and keeps avatar clicks opening the inline profile', async () => {
    const avatar = button("View Sam Rivera's profile", message('design-2'));
    avatar.focus();
    await vi.waitFor(() => expect(preview()?.textContent).toContain('Frontend engineering'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await vi.waitFor(() => expect(preview()).toBeNull());
    expect(document.activeElement).toBe(avatar);
    avatar.blur();
    avatar.focus();
    await vi.waitFor(() => expect(preview()).toBeTruthy());
    await click(avatar);
    expect(preview()).toBeNull();
    expect(document.querySelector('.chat-profile')?.textContent).toContain('Sam Rivera');
  });

  it.each(['mouse', 'touch'])('does not flash an avatar preview during a quick %s click or reopen from its pending hover', async (pointerType) => {
    vi.stubGlobal('matchMedia', (query) => ({ matches: query === '(hover: hover) and (pointer: fine)', addEventListener() {}, removeEventListener() {} }));
    vi.useFakeTimers();
    const avatar = button("View Morgan Chen's profile", message('design-1'));
    pointer(avatar, 'pointerenter', pointerType);
    await advance(40);
    pointer(avatar, 'pointerdown', pointerType);
    avatar.focus();
    await advance(60);
    expect(preview()).toBeNull();
    expect(avatar.hasAttribute('aria-describedby')).toBe(false);
    await click(avatar);
    expect(document.querySelector('.chat-profile')?.textContent).toContain('Morgan Chen');
    await advance(500);
    expect(preview()).toBeNull();
  });

  it('messages a previewed person without losing the current conversation draft', async () => {
    await type(target.querySelector('.conversation-composer textarea'), 'Keep my channel draft');
    button("View Morgan Chen's profile", message('design-1')).focus();
    await vi.waitFor(() => expect(preview()).toBeTruthy());
    await click([...preview().querySelectorAll('button')].find((node) => node.textContent.trim() === 'Message'));
    expect(preview()).toBeNull();
    expect(target.querySelector('[data-conversation-heading]')?.textContent).toContain('Morgan Chen');
    expect(document.activeElement).toBe(target.querySelector('.conversation-composer textarea'));
    expect(document.activeElement.value).toBe('');
    await click([...target.querySelectorAll('nav button')].find((node) => node.textContent.includes('# design-system')));
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep my channel draft');
  });

  it('previews quoted authors and self without self messaging, and ignores touch hover', async () => {
    vi.stubGlobal('matchMedia', (query) => ({ matches: query === '(hover: hover) and (pointer: fine)', addEventListener() {}, removeEventListener() {} }));
    const avatar = button("View Morgan Chen's profile", message('design-1'));
    vi.useFakeTimers();
    pointer(avatar, 'pointerenter', 'touch');
    await advance(400);
    expect(preview()).toBeNull();
    vi.useRealTimers();
    button("View Sam Rivera's profile", message('reply-2').querySelector('.chat-quote')).focus();
    await vi.waitFor(() => expect(preview()?.textContent).toContain('Sam Rivera'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await vi.waitFor(() => expect(preview()).toBeNull());
    button("View Alex Johnson's profile", message('design-4')).focus();
    await vi.waitFor(() => expect(preview()?.textContent).toContain('Alex Johnson'));
    expect(preview().querySelector('button')).toBeNull();
  });

  it('focuses the composer on standalone entry without stealing focus in embedded docs', async () => {
    expect(document.activeElement).not.toBe(target.querySelector('textarea'));
    await unmount(component);
    const { default: TeamChat } = await import('../src/lib/components/docs/examples/team-chat/team-chat-pattern-example.svelte');
    component = mount(TeamChat, { target, props: { focusOnMount: true } });
    await tick();
    resizeWorkspace(1000);
    await tick();
    await vi.waitFor(() => expect(document.activeElement).toBe(target.querySelector('.conversation-composer textarea')));
    await click(button('Search conversations and messages'));
    await type(document.querySelector('[role="combobox"]'), 'preview build');
    await click(document.querySelector('[data-search-result="message:engineering-1"]').closest('[role="option"]'));
    await vi.waitFor(() => expect(document.querySelector('.chat-search')).toBeNull());
    expect(document.activeElement).toBe(message('engineering-1'));
  });

  it('focuses the composer after sidebar navigation and preserves each conversation draft', async () => {
    const morgan = [...target.querySelectorAll('nav button')].find((node) => node.textContent.includes('Morgan Chen'));
    morgan.focus();
    await click(morgan);
    const input = target.querySelector('.conversation-composer textarea');
    expect(document.activeElement).toBe(input);
    await type(document.activeElement, 'Morgan draft');
    const channel = [...target.querySelectorAll('nav button')].find((node) => node.textContent.includes('# engineering'));
    channel.focus();
    await click(channel);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('');
    await type(document.activeElement, 'Engineering draft');
    await click(morgan);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('Morgan draft');
    await openScheduled();
    expect(target.querySelector('.conversation-composer textarea')).toBeNull();
    expect(document.activeElement).toBe(target.querySelector('[data-conversation-heading]'));
  });

  it.each([{ metaKey: true }, { ctrlKey: true }])('opens global search with the advertised shortcut without changing the draft: %j', async (modifier) => {
    const trigger = button('Search conversations and messages');
    expect(trigger.getAttribute('aria-keyshortcuts')).toBe('Meta+K Control+K');
    expect(trigger.querySelector('kbd[data-size="small"]')?.textContent).toContain('K');
    const input = target.querySelector('.conversation-composer textarea');
    await type(input, 'Unsent draft');
    input.focus();
    const press = (node, repeat = false) => {
      const event = new KeyboardEvent('keydown', { key: 'k', ...modifier, repeat, bubbles: true, cancelable: true });
      node.dispatchEvent(event);
      return event;
    };
    expect(press(input).defaultPrevented).toBe(true);
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('role')).toBe('combobox'));
    const search = document.activeElement;
    await type(search, 'Morgan');
    expect(press(search, true).defaultPrevented).toBe(true);
    await tick();
    expect(document.querySelectorAll('.chat-search')).toHaveLength(1);
    expect(search.value).toBe('Morgan');
    expect(input.value).toBe('Unsent draft');
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('.chat-search')).toBeNull());
    expect(document.activeElement).toBe(input);
  });

  it.each([
    ['MacIntel', '⌘'],
    ['Win32', 'Ctrl']
  ])('uses the platform-specific Kbd hint on %s', async (platform, modifier) => {
    const platformSpy = vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform);
    try {
      await enterMobile();
      await enterMobile(1000);
      await tick();
      expect(button('Search conversations and messages').querySelector('kbd').textContent).toContain(modifier);
    } finally {
      platformSpy.mockRestore();
    }
  });

  it('centers the desktop search with balanced grid tracks and keeps mobile controls in a row', async () => {
    layoutStyles = document.createElement('style');
    layoutStyles.textContent = compile(workspaceSource, {
      filename: resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-pattern-example.svelte'),
      generate: 'client'
    }).css.code;
    document.head.append(layoutStyles);
    const topbar = target.querySelector('.team-chat__topbar');
    expect(getComputedStyle(topbar).display).toBe('grid');
    expect(getComputedStyle(topbar).gridTemplateColumns).toBe('minmax(var(--ds-spacing-10), 1fr) minmax(0, var(--ds-sizing-lg)) minmax(var(--ds-spacing-10), 1fr)');
    expect(getComputedStyle(button('Search conversations and messages')).gridColumn).toBe('2');
    expect(getComputedStyle(topbar.querySelector('.workspace-account')).gridColumn).toBe('3');
    await enterMobile();
    expect(getComputedStyle(target.querySelector('.team-chat__topbar')).display).toBe('flex');
    expect(target.querySelector('.team-chat__topbar kbd')).toBeNull();
  });

  it('does not intercept the surrounding docs shortcut but activates search after a chat click', async () => {
    const press = () => {
      const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true, cancelable: true });
      document.body.dispatchEvent(event);
      return event;
    };
    expect(press().defaultPrevented).toBe(false);
    expect(document.querySelector('.chat-search')).toBeNull();
    message('design-1').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(press().defaultPrevented).toBe(true);
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('role')).toBe('combobox'));
  });

  it.each([{ altKey: true }, { shiftKey: true }, { isComposing: true }, { prevented: true }])('ignores unrelated or prevented search key combinations: %j', async ({ prevented, ...options }) => {
    const input = target.querySelector('.conversation-composer textarea');
    input.focus();
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, ...options, bubbles: true, cancelable: true });
    if (prevented) event.preventDefault();
    input.dispatchEvent(event);
    await tick();
    expect(document.querySelector('.chat-search')).toBeNull();
    expect(document.activeElement).toBe(input);
  });

  it('does not open global search behind an account menu or channel dialog', async () => {
    await click(accountTrigger());
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeTruthy());
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true, cancelable: true }));
    await tick();
    expect(document.querySelector('.chat-search')).toBeNull();
    expect(document.querySelector('[role="menu"]')).toBeTruthy();
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    await click(button('About #design-system'));
    await vi.waitFor(() => expect(document.querySelector('.chat-channel-dialog')).toBeTruthy());
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }));
    await tick();
    expect(document.querySelector('.chat-search')).toBeNull();
    expect(document.querySelector('.chat-channel-dialog')).toBeTruthy();
  });

  it('opens mobile global search with a hardware keyboard from Home and a conversation while preserving its draft', async () => {
    await enterMobile();
    const home = target.querySelector('[data-mobile-heading]');
    home.focus();
    home.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.activeElement).toBe(target.querySelector('[aria-label="Search messages, people, and channels"]')));
    await click(mobileTab('Home'));
    await click(button('Open #design-system'));
    const input = target.querySelector('.conversation-composer textarea');
    await type(input, 'Mobile draft');
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.activeElement).toBe(target.querySelector('[aria-label="Search messages, people, and channels"]')));
    expect(document.querySelector('.chat-search')).toBeNull();
    await click(mobileTab('Home'));
    await click(button('Open #design-system'));
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Mobile draft');
  });

  it('activates the conversation composer on typing after focusing a message and preserves the first character and draft selection', async () => {
    const input = target.querySelector('.conversation-composer textarea');
    await type(input, 'Hello world');
    input.setSelectionRange(6, 11);
    message('design-1').focus();
    const key = new KeyboardEvent('keydown', { key: 'M', shiftKey: true, bubbles: true, cancelable: true });
    document.activeElement.dispatchEvent(key);
    await tick();
    expect(key.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('Hello M');
    expect(input.selectionStart).toBe(7);
    expect(input.selectionEnd).toBe(7);
    await click(button('Send message', target.querySelector('.conversation-composer')));
    expect(target.querySelector('.message-list').textContent).toContain('Hello M');
  });

  it('captures typing after a non-focusable chat click without intercepting the surrounding docs page', async () => {
    const input = target.querySelector('.conversation-composer textarea');
    const press = () => {
      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
      document.body.dispatchEvent(event);
      return event;
    };
    expect(press().defaultPrevented).toBe(false);
    expect(input.value).toBe('');
    message('design-1').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(press().defaultPrevented).toBe(true);
    await tick();
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('a');
    input.blur();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(press().defaultPrevented).toBe(false);
    expect(document.activeElement).not.toBe(input);
    expect(input.value).toBe('a');
  });

  it.each([
    { key: 'c', ctrlKey: true },
    { key: 'c', metaKey: true },
    { key: 'e', altKey: true },
    { key: 'a', isComposing: true },
    { key: 'Enter' },
    { key: 'Escape' },
    { key: 'Tab' },
    { key: 'ArrowDown' },
    { key: 'Backspace' }
  ])('does not hijack shortcuts, composition or navigation: %j', async (options) => {
    message('design-1').focus();
    const event = new KeyboardEvent('keydown', { ...options, bubbles: true, cancelable: true });
    document.activeElement.dispatchEvent(event);
    await tick();
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(message('design-1'));
    expect(target.querySelector('.conversation-composer textarea').value).toBe('');
  });

  it('does not hijack editable fields, prevented events or Space activation on a button', async () => {
    const input = target.querySelector('.conversation-composer textarea');
    const sidebarInput = target.querySelector('[aria-label="Filter channels and people"]');
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    editable.tabIndex = 0;
    target.querySelector('.team-chat').append(editable);
    for (const field of [input, sidebarInput, editable]) {
      field.focus();
      const event = new KeyboardEvent('keydown', { key: 'x', bubbles: true, cancelable: true });
      field.dispatchEvent(event);
      await tick();
      expect(event.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(field);
      expect(input.value).toBe('');
    }
    const trigger = button('About #design-system');
    trigger.focus();
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    trigger.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(trigger);
    const prevented = new KeyboardEvent('keydown', { key: 'x', bubbles: true, cancelable: true });
    prevented.preventDefault();
    trigger.dispatchEvent(prevented);
    expect(input.value).toBe('');
    expect(document.activeElement).toBe(trigger);
  });

  it('does not steal menu typeahead or typing while conversation details are open', async () => {
    const input = target.querySelector('.conversation-composer textarea');
    await click(accountTrigger());
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeTruthy());
    const focused = document.activeElement;
    focused.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true, cancelable: true }));
    await tick();
    expect(document.activeElement).not.toBe(input);
    expect(input.value).toBe('');
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    await click(button('About #design-system'));
    await vi.waitFor(() => expect(document.querySelector('.chat-channel-dialog')).toBeTruthy());
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true }));
    await tick();
    expect(document.activeElement).not.toBe(input);
    expect(input.value).toBe('');
  });

  it('routes resumed typing to the active inline edit without modifying the conversation draft', async () => {
    const draft = target.querySelector('.conversation-composer textarea');
    await type(draft, 'Keep this unsent draft');
    await ownAction('design-4', 'Edit message');
    const editor = message('design-4').querySelector('textarea');
    await type(editor, 'Edited');
    editor.setSelectionRange(6, 6);
    message('design-1').focus();
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: '!', bubbles: true, cancelable: true }));
    await tick();
    expect(document.activeElement).toBe(editor);
    expect(editor.value).toBe('Edited!');
    expect(draft.value).toBe('Keep this unsent draft');
    await click(textButton('Save changes', message('design-4')));
    expect(message('design-4').querySelector('.chat-text').textContent).toBe('Edited!');
  });

  it('activates the new-message composer after choosing recipients without writing into the recipient search', async () => {
    await openNewMessage();
    await click(recipientCheckbox('Morgan Chen'));
    recipientInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('.new-message-recipient-popover')).toBeNull());
    const heading = target.querySelector('[data-conversation-heading]');
    heading.focus();
    heading.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true, cancelable: true }));
    await tick();
    const input = target.querySelector('.new-message textarea');
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('n');
    expect(recipientInput().value).toBe('');
    expect(target.querySelector('[aria-label="Selected recipients"]').textContent).toContain('Morgan Chen');
  });

  it('supports AltGr text and focuses the editor before a dead key without inserting its key name', async () => {
    const input = target.querySelector('.conversation-composer textarea');
    message('design-1').focus();
    const letter = new KeyboardEvent('keydown', { key: 'ł', ctrlKey: true, altKey: true, bubbles: true, cancelable: true });
    vi.spyOn(letter, 'getModifierState').mockImplementation((key) => key === 'AltGraph');
    document.activeElement.dispatchEvent(letter);
    await tick();
    expect(input.value).toBe('ł');
    expect(document.activeElement).toBe(input);
    message('design-1').focus();
    const dead = new KeyboardEvent('keydown', { key: 'Dead', altKey: true, bubbles: true, cancelable: true });
    document.activeElement.dispatchEvent(dead);
    await tick();
    expect(dead.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('ł');
  });

  it('activates a collapsed mobile composer with the first typed character but not on mobile Home', async () => {
    await enterMobile();
    target.querySelector('[data-mobile-heading]').focus();
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true, cancelable: true }));
    await tick();
    expect(target.querySelector('.conversation-composer')).toBeNull();
    await click(button('Open #general'));
    const form = target.querySelector('.conversation-composer .chat-composer');
    const input = form.querySelector('textarea');
    expect(form.dataset.expanded).toBe('false');
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', bubbles: true, cancelable: true }));
    await tick();
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('h');
    expect(form.dataset.expanded).toBe('true');
    expect(form.querySelector('.chat-composer__toolbar')).toBeTruthy();
  });

  it('returns from composer preview to writing and respects the maximum message length', async () => {
    const input = target.querySelector('.conversation-composer textarea');
    await type(input, 'Draft');
    input.setSelectionRange(5, 5);
    await click(button('Preview message'));
    expect(target.querySelector('.chat-composer__preview')).toBeTruthy();
    message('design-1').focus();
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: '!', bubbles: true, cancelable: true }));
    await tick();
    expect(target.querySelector('.chat-composer__preview')).toBeNull();
    const editor = target.querySelector('.conversation-composer textarea');
    await vi.waitFor(() => expect(document.activeElement).toBe(editor));
    expect(editor.value).toContain('!');
    await type(editor, 'x'.repeat(editor.maxLength));
    editor.setSelectionRange(editor.maxLength, editor.maxLength);
    message('design-1').focus();
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', bubbles: true, cancelable: true }));
    await tick();
    expect(document.activeElement).toBe(editor);
    expect(editor.value).toBe('x'.repeat(editor.maxLength));
  });
  it('opens standalone mobile Home without focusing a text field or opening a navigation drawer', async () => {
    await unmount(component);
    const { default: TeamChat } = await import('../src/lib/components/docs/examples/team-chat/team-chat-pattern-example.svelte');
    component = mount(TeamChat, { target, props: { focusOnMount: true } });
    await tick();
    expect(document.activeElement).not.toBe(target.querySelector('.conversation-composer textarea'));
    await enterMobile();
    expect(target.querySelector('.conversation-composer')).toBeNull();
    expect(target.querySelector('.mobile-screen').hidden).toBe(false);
    expect(document.activeElement.tagName).not.toMatch(/INPUT|TEXTAREA/);
    expect(document.querySelector('.aesir-drawer')).toBeNull();
  });

  it('focuses the composer when Enter opens a sidebar search match', async () => {
    const input = target.querySelector('.sidebar-header input');
    input.focus();
    await type(input, 'Morgan');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.activeElement).toBe(target.querySelector('.conversation-composer textarea')));
    expect(document.activeElement.getAttribute('aria-label')).toBe('Message Morgan Chen');
  });

  it('opens DMs with persistent bottom navigation without focusing the mobile keyboard', async () => {
    resizeWorkspace(600);
    await tick();
    await click([...target.querySelectorAll('.mobile-tab')].find((node) => node.textContent.includes('DMs')));
    expect(button("View Alex Johnson's profile", target.querySelector('.mobile-navigation'))).toBeUndefined();
    await click(button('Open Morgan Chen'));
    await vi.waitFor(() => expect(document.querySelector('.aesir-sidebar__mobile-panel')).toBeNull());
    expect(document.activeElement).toBe(target.querySelector('[data-conversation-heading]'));
    expect(target.querySelector('.conversation-composer .chat-composer').dataset.expanded).toBe('false');
    expect(target.querySelector('.mobile-tabbar')).toBeTruthy();
  });

  it.each([320, 390, 1000])('uses a fixed compact message avatar beside the author and first text line without enlarging quotes or navigation at %ipx', async (width) => {
    layoutStyles = document.createElement('style');
    layoutStyles.textContent = compile(messageSource, {
      filename: resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-message.svelte'),
      generate: 'client'
    }).css.code;
    document.head.append(layoutStyles);
    if (width < 760) {
      await enterMobile(width);
      await click(button('Open #design-system'));
    }
    for (const id of ['design-1', 'design-2', 'design-3', 'design-4']) {
      const article = message(id).querySelector('.chat-message');
      const avatar = article.firstElementChild.querySelector('[data-slot="avatar"]');
      expect(avatar.dataset.size).toBe('default');
      expect(getComputedStyle(article).gridTemplateColumns).toBe('var(--ds-spacing-10) minmax(0, 1fr)');
      expect(article.firstElementChild.style.alignSelf).toBe('start');
      expect(article.firstElementChild.style.height).toBe('fit-content');
      expect(button(`View ${demoPeople[demoMessages.find((entry) => entry.id === id).author].name}'s profile`, article)).toBeTruthy();
    }
    expect(target.querySelector('.message-list .chat-quote [data-slot="avatar"]').dataset.size).toBe('xs');
    await type(target.querySelector('.conversation-composer textarea'), 'First line\nSecond line\nThird line');
    await click(button('Send message'));
    const lastMessage = [...target.querySelectorAll('.chat-message')].at(-1);
    expect(lastMessage.firstElementChild.querySelector('[data-slot="avatar"]').dataset.size).toBe('default');
    expect(lastMessage.firstElementChild.style.height).toBe('fit-content');
    expect(target.querySelector('.message-list .chat-quote [data-slot="avatar"]').dataset.size).toBe('xs');
  });

  it('uses identical leading slots for sidebar entries and compact avatars that do not enlarge DM rows', () => {
    const entries = [...target.querySelectorAll('.aesir-sidebar__desktop nav .aesir-sidebar__item')];
    expect(entries.length).toBeGreaterThan(3);
    for (const entry of entries) expect(entry.querySelector('.aesir-sidebar__item-leading > .sidebar-item-leading')).toBeTruthy();
    const directMessages = entries.filter((entry) => entry.querySelector('.chat-avatar'));
    expect(directMessages).toHaveLength(demoConversations.filter((room) => room.type === 'direct').length);
    for (const entry of directMessages) {
      expect(entry.querySelector('[data-gradient][data-size="2xs"]')).toBeTruthy();
      expect(entry.querySelector('.chat-avatar__presence')).toBeTruthy();
      expect(entry.querySelector('.aesir-sidebar__item-label')).toBeTruthy();
      expect(entry.querySelector('button')).toBeNull();
    }
  });

  it('uses accent-muted active sidebar names, muted read names and foreground unread names across desktop and mobile', async () => {
    layoutStyles = document.createElement('style');
    layoutStyles.textContent = [
      [workspaceSource, 'team-chat-pattern-example.svelte'],
      [mobileSource, 'team-chat-mobile.svelte']
    ]
      .map(([source, filename]) => compile(source, { filename: resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat', filename), generate: 'client' }).css.code)
      .join('\n');
    document.head.append(layoutStyles);
    const nameStyle = (node, unread) => {
      const active = node.closest('.aesir-sidebar__item')?.getAttribute('aria-current') === 'page';
      expect(getComputedStyle(node).color).toBe(active ? 'var(--ds-accent-text-muted)' : `var(--ds-foreground${unread ? '' : '-muted'})`);
      expect(getComputedStyle(node).fontWeight).toBe(`var(--ds-font-weight-${unread ? 'medium' : 'normal'})`);
    };
    const sidebarRow = (name) => [...target.querySelectorAll('.aesir-sidebar__item')].find((node) => node.querySelector('.aesir-sidebar__item-label')?.textContent === name);
    nameStyle(sidebarRow('# design-system').querySelector('.aesir-sidebar__item-label'), true);
    nameStyle(sidebarRow('# general').querySelector('.aesir-sidebar__item-label'), false);
    nameStyle(sidebarRow('Morgan Chen').querySelector('.aesir-sidebar__item-label'), true);
    nameStyle(sidebarRow('Sam Rivera').querySelector('.aesir-sidebar__item-label'), false);
    await click(sidebarRow('Morgan Chen'));
    expect(sidebarRow('Morgan Chen').getAttribute('aria-current')).toBe('page');
    expect(sidebarRow('Morgan Chen').querySelector('[data-unread]')).toBeNull();
    nameStyle(sidebarRow('Morgan Chen').querySelector('.aesir-sidebar__item-label'), true);
    nameStyle(sidebarRow('Morgan Chen'), true);
    await click(sidebarRow('# general'));
    nameStyle(sidebarRow('# general').querySelector('.aesir-sidebar__item-label'), true);
    nameStyle(sidebarRow('Morgan Chen').querySelector('.aesir-sidebar__item-label'), false);
    await click(sidebarRow('Sam Rivera'));
    nameStyle(sidebarRow('Sam Rivera').querySelector('.aesir-sidebar__item-label'), true);
    nameStyle(sidebarRow('# general').querySelector('.aesir-sidebar__item-label'), false);
    await enterMobile();
    nameStyle(button('Open #design-system').querySelector('.row-name'), true);
    nameStyle(button('Open #general').querySelector('.row-name'), false);
    await click(button('Open #design-system'));
    await click(mobileTab('Home'));
    nameStyle(button('Open #design-system').querySelector('.row-name'), false);
    await click(mobileTab('DMs'));
    nameStyle(button('Open Morgan Chen').querySelector('.row-name'), false);
    nameStyle(button('Message Morgan Chen').querySelector('.dm-person-name'), false);
    nameStyle(button('Open Sam Rivera').querySelector('.row-name'), false);
  });

  it('keeps unread name emphasis when badge visibility is disabled and clears it after opening the conversation', async () => {
    layoutStyles = document.createElement('style');
    layoutStyles.textContent = compile(mobileSource, { filename: resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-mobile.svelte'), generate: 'client' }).css.code;
    document.head.append(layoutStyles);
    await openPreferences();
    await click(preferenceSection('Navigation'));
    await click(preferenceField('Show unread message badges'));
    await closePreferences();
    await enterMobile();
    await click(mobileTab('DMs'));
    const row = button('Open Morgan Chen');
    expect(row.querySelector('.mobile-unread')).toBeNull();
    expect(row.querySelector('.row-name').hasAttribute('data-unread')).toBe(true);
    expect(getComputedStyle(row.querySelector('.row-name')).fontWeight).toBe('var(--ds-font-weight-medium)');
    expect(getComputedStyle(button('Message Morgan Chen').querySelector('.dm-person-name')).color).toBe('var(--ds-foreground)');
    await click(row);
    await click(mobileTab('DMs'));
    expect(button('Open Morgan Chen').querySelector('.row-name').hasAttribute('data-unread')).toBe(false);
    expect(getComputedStyle(button('Open Morgan Chen').querySelector('.row-name')).color).toBe('var(--ds-foreground-muted)');
    expect(getComputedStyle(button('Message Morgan Chen').querySelector('.dm-person-name')).fontWeight).toBe('var(--ds-font-weight-normal)');
    await click(mobileTab('Activity'));
    expect(button('Unread', target.querySelector('.activity-filters')).querySelector('.activity-filter-dot')).toBeNull();
    expect(button('Unread', target.querySelector('.activity-filters')).hasAttribute('aria-describedby')).toBe(false);
  });

  it('marks unread badges for accent styling and clears them across desktop and mobile navigation', async () => {
    const unreadEntries = (root) => [...root.querySelectorAll('.aesir-sidebar__item:has(.sidebar-item-leading[data-unread])')];
    const channels = demoConversations.filter((room) => room.type === 'channel');
    const orderedRooms = [...channels, ...demoConversations.filter((room) => room.type !== 'channel')];
    const counts = (rooms, read = []) => rooms.filter((room) => room.unread && !read.includes(room.id)).map((room) => String(room.unread));
    const desktop = target.querySelector('.aesir-sidebar__desktop');
    expect(unreadEntries(desktop).map((entry) => entry.querySelector('.aesir-badge').textContent)).toEqual(counts(orderedRooms));
    expect([...desktop.querySelectorAll('.aesir-sidebar__item')].find((entry) => entry.textContent.includes('Saved messages')).querySelector('[data-unread]')).toBeNull();
    await click(unreadEntries(desktop).find((entry) => entry.textContent.includes('Morgan Chen')));
    expect(unreadEntries(desktop)).toHaveLength(counts(orderedRooms, ['dm-morgan']).length);
    resizeWorkspace(600);
    await tick();
    const mobile = target.querySelector('.mobile-navigation');
    const mobileChannels = mobile.querySelector('[aria-label="Channels"]');
    expect([...mobileChannels.querySelectorAll('.mobile-unread')].map((entry) => entry.textContent)).toEqual(counts(channels));
    await click(button('Open #engineering'));
    await click(button('Back to Home'));
    expect([...mobileChannels.querySelectorAll('.mobile-unread')].map((entry) => entry.textContent)).toEqual(counts(channels, ['engineering']));
    resizeWorkspace(1000);
    await tick();
    expect(unreadEntries(target.querySelector('.aesir-sidebar__desktop')).map((entry) => entry.querySelector('.aesir-badge').textContent)).toEqual(counts(orderedRooms, ['dm-morgan', 'engineering']));
  });
  async function openSchedule(option = 'Choose date and time…') {
    await click(button('Schedule message'));
    await click([...document.querySelectorAll('[role="menuitem"]')].find((node) => node.textContent.trim() === option));
    if (option === 'Choose date and time…') await vi.waitFor(() => expect(document.querySelector('.schedule-form')).toBeTruthy());
    return document.querySelector('.schedule-form')?.closest('[role="dialog"]');
  }
  async function openScheduled() {
    await click([...target.querySelectorAll('nav button')].find((node) => node.textContent.includes('Scheduled messages')));
  }
  it('layers the date picker above the scheduling modal and closes only the top layer with Escape', async () => {
    await type(document.querySelector('.conversation-composer textarea'), 'Calendar draft');
    const dialog = await openSchedule();
    const dateTrigger = dialog.querySelector('.date-picker__trigger');
    await click(dateTrigger);
    const calendar = document.querySelector('[role="dialog"][aria-label="Choose date"]');
    expect(calendar).toBeTruthy();
    await vi.waitFor(() => expect(Number(calendar.style.zIndex)).toBeGreaterThan(70));
    await vi.waitFor(() => expect(calendar.contains(document.activeElement)).toBe(true));
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await tick();
    expect(document.querySelector('[role="dialog"][aria-label="Choose date"]')).toBeNull();
    expect(dialog.isConnected).toBe(true);
    expect(document.activeElement).toBe(dateTrigger);
    dateTrigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('.schedule-form')).toBeNull());
    expect(document.querySelector('.conversation-composer textarea').value).toBe('Calendar draft');
  });
  it('disables scheduling empty drafts and preserves a reply when the date dialog is dismissed with Escape', async () => {
    expect(button('Schedule message').disabled).toBe(true);
    await click(button('Reply to Sam Rivera', message('design-2')));
    const input = document.querySelector('.conversation-composer textarea');
    await type(input, 'Keep this reply');
    const trigger = button('Schedule message');
    trigger.focus();
    const dialog = await openSchedule();
    await vi.waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('.schedule-form')).toBeNull());
    expect(document.activeElement).toBe(trigger);
    expect(input.value).toBe('Keep this reply');
    expect(document.querySelector('.chat-composer__reply').textContent).toContain('Sam Rivera');
    expect(document.querySelector('.scheduled-message')).toBeNull();
  });

  it('schedules a formatted reply, keeps the original quote and can send it immediately once', async () => {
    await click(button('Reply to Sam Rivera', message('design-2')));
    await type(document.querySelector('.conversation-composer textarea'), '**Later** reply');
    await openSchedule('In 1 hour');
    expect(document.querySelector('.conversation-composer textarea').value).toBe('');
    expect(document.querySelector('.chat-composer__reply')).toBeNull();
    expect(document.querySelector('.conversation-notice').textContent).toContain('Scheduled for');
    expect([...target.querySelectorAll('[data-message-id]')].some((node) => node.textContent.includes('Later reply'))).toBe(false);
    await openScheduled();
    const entry = document.querySelector('.scheduled-message');
    expect(entry.textContent).toContain('#design-system');
    expect(entry.querySelector('strong').textContent).toBe('#design-system');
    expect(entry.querySelector('.chat-text strong').textContent).toBe('Later');
    expect(entry.querySelector('.chat-quote').textContent).toContain('Sam Rivera');
    expect(entry.querySelector('time[datetime]')).toBeTruthy();
    await click([...entry.querySelectorAll('button')].find((node) => node.textContent.trim() === 'Send now'));
    expect(document.querySelector('.scheduled-message')).toBeNull();
    await click([...target.querySelectorAll('nav button')].find((node) => node.textContent.includes('# design-system')));
    const sent = [...target.querySelectorAll('[data-message-id]')].filter((node) => node.querySelector('.chat-text')?.textContent.includes('Later reply'));
    expect(sent).toHaveLength(1);
    expect(sent[0].querySelector('.chat-quote').textContent).toContain('Sam Rivera');
  });

  it('rejects a past custom time without losing the draft, and accepts a future time', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 8, 12, 0));
    await type(document.querySelector('.conversation-composer textarea'), 'Custom delivery');
    const dialog = await openSchedule();
    await click(dialog.querySelector('.date-picker__trigger'));
    await click(document.querySelector('[data-date="2026-10-08"]'));
    await type(dialog.querySelector('input[type="time"]'), '11:00');
    const submit = dialog.querySelector('button[type="submit"]');
    await click(submit);
    expect(dialog.querySelector('[role="alert"]').textContent).toContain('future');
    expect(document.querySelector('.conversation-composer textarea').value).toBe('Custom delivery');
    await type(dialog.querySelector('input[type="time"]'), '14:00');
    await click(submit);
    await vi.waitFor(() => expect(document.querySelector('.schedule-form')).toBeNull());
    expect(document.querySelector('.conversation-composer textarea').value).toBe('');
    await openScheduled();
    expect(document.querySelector('.scheduled-message time[datetime]').dateTime).toBe(new Date(2026, 9, 8, 14, 0).toISOString());
  });

  it('cancels queued messages without sending or replacing another conversation draft', async () => {
    await type(document.querySelector('.conversation-composer textarea'), 'Never send this');
    await openSchedule('Tomorrow at 9:00');
    await click([...target.querySelectorAll('nav button')].find((node) => node.textContent.includes('Morgan Chen')));
    await type(document.querySelector('.conversation-composer textarea'), 'Keep Morgan draft');
    await openScheduled();
    await click([...document.querySelector('.scheduled-message').querySelectorAll('button')].find((node) => node.textContent.trim() === 'Cancel scheduled message'));
    expect(document.querySelector('.scheduled-message')).toBeNull();
    expect(document.querySelector('.chat-empty').textContent).toContain('No scheduled messages');
    await click([...target.querySelectorAll('nav button')].find((node) => node.textContent.includes('Morgan Chen')));
    expect(document.querySelector('.conversation-composer textarea').value).toBe('Keep Morgan draft');
    await click([...target.querySelectorAll('nav button')].find((node) => node.textContent.includes('# design-system')));
    expect(document.querySelector('.message-list').textContent).not.toContain('Never send this');
  });

  it('delivers overdue messages to their original destination once when returning to the tab', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 8, 12, 0));
    await type(document.querySelector('.conversation-composer textarea'), 'Automatic delivery');
    await openSchedule('In 1 hour');
    await click([...target.querySelectorAll('nav button')].find((node) => node.textContent.includes('Morgan Chen')));
    vi.setSystemTime(new Date(2026, 9, 8, 14, 0));
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    await tick();
    document.dispatchEvent(new Event('visibilitychange'));
    await tick();
    expect(document.querySelector('.message-list').textContent).not.toContain('Automatic delivery');
    await openScheduled();
    expect(document.querySelector('.scheduled-message')).toBeNull();
    await click([...target.querySelectorAll('nav button')].find((node) => node.textContent.includes('# design-system')));
    expect([...target.querySelectorAll('[data-message-id]')].filter((node) => node.textContent.includes('Automatic delivery'))).toHaveLength(1);
  });

  it('sizes formatting tooltips to their label while retaining the viewport limit and accessible description', async () => {
    const trigger = button('Bulleted list');
    trigger.focus();
    await vi.waitFor(() => expect(document.querySelector('[role="tooltip"]')).toBeTruthy());
    const tooltip = document.querySelector('[role="tooltip"]');
    expect(tooltip.textContent.trim()).toBe('Bulleted list');
    expect(tooltip.style.width).toBe('max-content');
    expect(tooltip.style.maxWidth).toBe('calc(100vw - var(--ds-spacing-4))');
    expect(tooltip.querySelector('kbd')).toBeNull();
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('[role="tooltip"]')).toBeNull());
  });

  it('renders formatting shortcuts with the compact Aesir Kbd component', async () => {
    for (const [label, key] of [
      ['Bold', 'B'],
      ['Italic', 'I'],
      ['Underline', 'U']
    ]) {
      const trigger = button(label);
      trigger.focus();
      await vi.waitFor(() => expect(document.querySelector('[role="tooltip"]')).toBeTruthy());
      const tooltip = document.querySelector('[role="tooltip"]');
      expect(tooltip.textContent).toContain(label);
      const kbd = tooltip.querySelector('kbd.aesir-kbd[data-size="small"]');
      expect(kbd).toBeTruthy();
      expect(kbd.textContent).toContain(key);
      expect(kbd.textContent).toMatch(/(?:Ctrl|Command)\s*\+/);
      expect(tooltip.textContent).not.toContain('Ctrl/Cmd');
      expect(trigger.getAttribute('aria-keyshortcuts')).toBe(`Control+${key} Meta+${key}`);
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      await vi.waitFor(() => expect(document.querySelector('[role="tooltip"]')).toBeNull());
    }
  });

  it('opens an inline profile without a modal or focus trap and restores the trigger on Escape', async () => {
    const input = document.querySelector('.conversation-composer textarea');
    await type(input, 'Keep the conversation draft');
    const trigger = button("View Morgan Chen's profile", message('design-1'));
    trigger.focus();
    await click(trigger);
    const drawer = target.querySelector('aside[aria-label="Morgan Chen\'s profile"]');
    expect(drawer.querySelector('.chat-profile h2').textContent).toBe('Morgan Chen');
    expect(drawer.textContent).toContain('Active');
    expect(drawer.querySelector('[aria-label="Contact information"] h3').textContent).toBe('Contact information');
    expect(drawer.querySelector('a[href="mailto:morgan.chen@example.com"]')).toBeTruthy();
    expect(drawer.querySelector('a[href="tel:+12025550101"]')).toBeTruthy();
    expect(button('Edit profile', drawer)).toBeUndefined();
    expect(button('Edit contact information', drawer)).toBeUndefined();
    expect(drawer.querySelector('.chat-profile__avatar [data-gradient][data-size="lg"]')).toBeTruthy();
    expect(drawer.parentElement).toBe(target.querySelector('.chat-panels'));
    expect(drawer.previousElementSibling).toBe(target.querySelector('.conversation'));
    expect(drawer.querySelector('.profile-scroll')).toBeTruthy();
    expect(drawer.getAttribute('aria-modal')).toBeNull();
    expect(document.querySelector('.aesir-drawer__backdrop')).toBeNull();
    expect(document.documentElement.dataset.overlayOpen).toBeUndefined();
    const close = button('Close profile', drawer);
    await vi.waitFor(() => expect(document.activeElement).toBe(close));
    const tab = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    close.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(close);
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('.chat-profile')).toBeNull());
    expect(document.activeElement).toBe(trigger);
    expect(input.value).toBe('Keep the conversation draft');
  });

  it('keeps the chat usable and does not dismiss an inline profile on outside interaction', async () => {
    await click(button("View Morgan Chen's profile", message('design-1')));
    const panel = target.querySelector('.chat-profile-panel');
    const input = target.querySelector('.conversation-composer textarea');
    input.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    input.focus();
    await type(input, 'Writing alongside a profile');
    expect(document.activeElement).toBe(input);
    expect(panel.isConnected).toBe(true);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await tick();
    expect(panel.isConnected).toBe(true);
    await click(button("View Jules Martin's profile", message('design-3')));
    expect(target.querySelectorAll('.chat-profile-panel')).toHaveLength(1);
    expect(document.querySelector('.chat-profile h2').textContent).toBe('Jules Martin');
    expect(input.value).toBe('Writing alongside a profile');
    await click([...target.querySelectorAll('nav button')].find((node) => node.textContent.includes('Morgan Chen')));
    expect(target.querySelector('.chat-profile-panel')).toBeNull();
    expect(document.activeElement).toBe(target.querySelector('.conversation-composer textarea'));
  });

  it.each([390, 1000])('opens author and direct-conversation profiles by name and restores focus without losing a draft at %ipx', async (width) => {
    if (width < 760) {
      await enterMobile(width);
      await click(button('Open #release-planning'));
    } else await click(target.querySelector('[data-channel="release-planning"]').closest('button'));
    await type(target.querySelector('.conversation-composer textarea'), 'Keep the release draft');
    const name = message('release-1').querySelector('button.chat-message__author');
    expect(name.textContent).toBe('Taylor Brooks');
    expect(name.getAttribute('aria-label')).toBe("View Taylor Brooks's profile");
    await click(name);
    expect(document.querySelector('.chat-profile h2').textContent).toBe('Taylor Brooks');
    expect(document.querySelector('.chat-person-preview[data-state="open"]')).toBeNull();
    await click(button('Close profile'));
    await vi.waitFor(() => expect(document.activeElement).toBe(name));
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep the release draft');
    name.focus();
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    name.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(false);
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep the release draft');
    // JSDOM does not synthesize native button activation from keyboard events.
    await click(name);
    await click(textButton('Message', document.querySelector('.chat-profile')));
    await vi.waitFor(() => expect(target.querySelector('[data-conversation-heading]').textContent).toContain('Taylor Brooks'));
    const headingName = target.querySelector('button.conversation-title');
    expect(headingName.textContent).toBe('Taylor Brooks');
    await click(headingName);
    expect(document.querySelector('.chat-profile h2').textContent).toBe('Taylor Brooks');
    await click(button('Close profile'));
    await vi.waitFor(() => expect(document.activeElement).toBe(headingName));
  });

  it('keeps the profile inside a compact workspace instead of creating a page overlay', async () => {
    resizeWorkspace(600);
    await tick();
    const trigger = await openOwnProfile();
    expect(target.querySelector('.chat-panels--profile-open > .chat-profile-panel')).toBeTruthy();
    expect(document.querySelector('.aesir-drawer__backdrop')).toBeNull();
    expect(document.documentElement.dataset.overlayOpen).toBeUndefined();
    await click(button('Close profile'));
    expect(target.querySelector('.chat-panels--profile-open')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes only the profile dropdown on its first Escape, then the inline panel', async () => {
    const trigger = await openOwnProfile();
    await click(button('View profile as'));
    await vi.waitFor(() => expect(document.activeElement.getAttribute('role')).toBe('menuitemradio'));
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    expect(target.querySelector('.chat-profile-panel')).toBeTruthy();
    expect(document.activeElement).toBe(button('View profile as'));
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await tick();
    expect(target.querySelector('.chat-profile-panel')).toBeNull();
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('returns to conversation members after closing a profile opened from that dialog', async () => {
    await click(button('View 4 conversation members'));
    const dialog = document.querySelector('.member-list').closest('[role="dialog"]');
    await click(button("View Sam Rivera's profile", dialog));
    await vi.waitFor(() => expect(dialog.isConnected).toBe(false));
    expect(target.querySelector('aside[aria-label="Sam Rivera\'s profile"]')).toBeTruthy();
    await click(button('Close profile'));
    await vi.waitFor(() => expect(document.querySelector('.member-list')).toBeTruthy());
    const restored = button("View Sam Rivera's profile", document.querySelector('.member-list'));
    await vi.waitFor(() => expect(document.activeElement).toBe(restored));
  });

  it.each([320, 390, 1000])('opens the profile from the whole member row and preserves the Members context at %ipx', async (width) => {
    await enterMobile(width);
    if (width < 760) await click(button('Open #design-system'));
    await type(target.querySelector('.conversation-composer textarea'), 'Keep the conversation draft');
    const opener = button('View 4 conversation members');
    opener.focus();
    await click(opener);
    await type(document.querySelector('[aria-label="Search members"]'), 'Sam');
    for (const hit of ['.chat-avatar', '.member-identity', '.member-presence', null]) {
      const row = button("View Sam Rivera's profile", document.querySelector('.chat-members'));
      expect(row.tagName).toBe('BUTTON');
      expect(row.querySelector('button')).toBeNull();
      expect(row.querySelector('.member-presence').textContent).toBe('Away');
      const viewport = row.closest('[role="tabpanel"]');
      viewport.scrollTop = 37;
      viewport.dispatchEvent(new Event('scroll'));
      row.focus();
      await click(hit ? row.querySelector(hit) : row);
      await vi.waitFor(() => expect(row.isConnected).toBe(false));
      expect(document.querySelector('.chat-profile h2').textContent).toBe('Sam Rivera');
      expect(document.documentElement.dataset.overlayOpen).toBeUndefined();
      await click(button('Close profile'));
      await vi.waitFor(() => expect(document.querySelector('.chat-members')).toBeTruthy());
      const restored = button("View Sam Rivera's profile", document.querySelector('.chat-members'));
      await vi.waitFor(() => expect(document.activeElement).toBe(restored));
      expect(document.querySelector('[aria-label="Search members"]').value).toBe('Sam');
      expect(restored.closest('[role="tabpanel"]').scrollTop).toBe(37);
      expect(document.querySelector('[role="tab"][aria-selected="true"]').textContent).toBe('Members 4');
    }
    const tabs = [...document.querySelectorAll('.channel-details [role="tab"]')];
    await click(tabs[0]);
    await click(tabs[1]);
    expect(document.querySelector('[aria-label="Search members"]').value).toBe('Sam');
    expect(document.querySelector('.chat-members').closest('[role="tabpanel"]').scrollTop).toBe(37);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await tick();
    await vi.waitFor(() => expect(document.activeElement).toBe(opener));
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep the conversation draft');
  });

  it('restores Members and its original opener even when the profile is closed before the dialog exit finishes', async () => {
    const opener = button('View 4 conversation members');
    opener.focus();
    await click(opener);
    await type(document.querySelector('[aria-label="Search members"]'), 'Sam');
    await click(button("View Sam Rivera's profile", document.querySelector('.chat-members')));
    await click(button('Close profile'));
    await vi.waitFor(() => expect(document.activeElement).toBe(button("View Sam Rivera's profile", document.querySelector('.chat-members'))));
    expect(document.querySelector('[aria-label="Search members"]').value).toBe('Sam');
    expect(document.querySelectorAll('.chat-members')).toHaveLength(1);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await vi.waitFor(() => expect(document.activeElement).toBe(opener));
  });

  it('restores group-message Members after a full-row profile click and dismisses the filter before details', async () => {
    await click(sidebarConversation('Casey Nguyen, Morgan Chen, Zoë Fischer'));
    const opener = button('View 4 conversation members');
    opener.focus();
    await click(opener);
    const row = button("View Morgan Chen's profile", document.querySelector('.member-list'));
    await click(row.querySelector('.member-presence'));
    await vi.waitFor(() => expect(row.isConnected).toBe(false));
    await click(button('Close profile'));
    await vi.waitFor(() => expect(document.activeElement).toBe(button("View Morgan Chen's profile", document.querySelector('.member-list'))));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await vi.waitFor(() => expect(document.activeElement).toBe(opener));
    await click(sidebarConversation('# design-system'));
    await click(button('View 4 conversation members'));
    await type(document.querySelector('[aria-label="Search members"]'), 'Sam');
    const filter = document.querySelector('.members-filter [role="combobox"]');
    filter.focus();
    await click(filter);
    filter.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await tick();
    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(document.querySelector('.chat-members')).toBeTruthy();
    expect(document.activeElement).toBe(filter);
    filter.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('.chat-members')).toBeNull());
  });

  it('restores non-member search, custom filter and focus after a profile, keeping Add separate', async () => {
    await click(button('View 4 conversation members'));
    await type(document.querySelector('[aria-label="Search members"]'), 'Riley');
    const filter = document.querySelector('.members-filter [role="combobox"]');
    await click(filter);
    const list = document.getElementById(filter.getAttribute('aria-controls'));
    await click([...list.querySelectorAll('[role="option"]')].find((node) => node.textContent.trim() === 'Not in this channel'));
    const row = button("View Riley Park's profile", document.querySelector('.other-people-list'));
    expect(row.contains(button('Add Riley Park to channel'))).toBe(false);
    await click(row.querySelector('.member-identity'));
    await vi.waitFor(() => expect(row.isConnected).toBe(false));
    await click(button('Close profile'));
    await vi.waitFor(() => expect(document.querySelector('.other-people-list')).toBeTruthy());
    const restored = button("View Riley Park's profile", document.querySelector('.other-people-list'));
    await vi.waitFor(() => expect(document.activeElement).toBe(restored));
    expect(document.querySelector('[aria-label="Search members"]').value).toBe('Riley');
    expect(document.querySelector('.members-filter [role="combobox"]').textContent.trim()).toBe('Not in this channel');
    expect(document.querySelector('.member-list')).toBeNull();
    await click(button('Add Riley Park to channel'));
    expect(document.querySelector('.chat-profile')).toBeNull();
    expect(button('View 5 conversation members', target)).toBeTruthy();
    expect(document.activeElement).toBe(document.querySelector('[aria-label="Search members"]'));
  });

  it('opens a DM from a member profile without reopening details or losing the source draft', async () => {
    await type(target.querySelector('.conversation-composer textarea'), 'Source draft');
    await click(button('View 4 conversation members'));
    await click(button("View Sam Rivera's profile", document.querySelector('.member-list')));
    await vi.waitFor(() => expect(document.querySelector('.chat-members')).toBeNull());
    await click(textButton('Message', document.querySelector('.chat-profile')));
    expect(document.querySelector('.chat-profile')).toBeNull();
    expect(document.querySelector('.chat-members')).toBeNull();
    expect(document.querySelector('[data-conversation-heading]').textContent).toContain('Sam Rivera');
    expect(document.activeElement).toBe(target.querySelector('.conversation-composer textarea'));
    await click(sidebarConversation('# design-system'));
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Source draft');
  });

  it('opens a direct conversation from a profile without losing the previous draft', async () => {
    await type(document.querySelector('.conversation-composer textarea'), 'A design-system draft');
    await click(button("View Sam Rivera's profile", message('design-2')));
    const drawer = target.querySelector('aside[aria-label="Sam Rivera\'s profile"]');
    await click([...drawer.querySelectorAll('button')].find((node) => node.textContent.trim() === 'Message'));
    await vi.waitFor(() => expect(document.querySelector('.chat-profile')).toBeNull());
    expect(document.querySelector('[data-conversation-heading]').textContent).toContain('Sam Rivera');
    const input = document.querySelector('.conversation-composer textarea');
    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);
    const nav = [...target.querySelectorAll('nav button')].find((node) => node.textContent.includes('# design-system'));
    await click(nav);
    expect(document.querySelector('.conversation-composer textarea').value).toBe('A design-system draft');
    expect(document.querySelector('button button')).toBeNull();
  });

  it('returns to the forwarding dialog after viewing its source author profile', async () => {
    await click(button('Forward message from Sam Rivera', message('design-2')));
    const forwardDialog = document.querySelector('.forward-picker').closest('[role="dialog"]');
    const trigger = button("View Sam Rivera's profile", forwardDialog);
    trigger.focus();
    await click(trigger);
    expect(document.querySelector('.chat-profile h2').textContent).toBe('Sam Rivera');
    await vi.waitFor(() => expect(forwardDialog.isConnected).toBe(false));
    expect(document.documentElement.dataset.overlayOpen).toBeUndefined();
    await click(button('Close profile'));
    await vi.waitFor(() => expect(document.querySelector('.chat-profile')).toBeNull());
    const restoredDialog = document.querySelector('.forward-picker').closest('[role="dialog"]');
    const restoredTrigger = button("View Sam Rivera's profile", restoredDialog);
    await vi.waitFor(() => expect(document.activeElement).toBe(restoredTrigger));
    expect(button('Forward to Jules Martin', restoredDialog)).toBeTruthy();
  });

  it('opens the current user profile without offering to message yourself', async () => {
    const trigger = accountTrigger();
    const sidebar = target.querySelector('.chat-sidebar');
    expect(sidebar.textContent).not.toContain('Alex Johnson');
    expect(button("View Alex Johnson's profile", sidebar)).toBeUndefined();
    trigger.focus();
    await openOwnProfile();
    const drawer = target.querySelector('aside[aria-label="Alex Johnson\'s profile"]');
    expect(drawer.querySelector('h2').textContent).toBe('Alex Johnson');
    expect(drawer.querySelector('.profile-job').textContent).toBe('Software engineering');
    expect([...drawer.querySelectorAll('button')].some((node) => node.textContent.trim() === 'Message')).toBe(false);
    await click(button('Close profile', drawer));
    await vi.waitFor(() => expect(document.querySelector('.chat-profile')).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it('opens an account menu with an avatar and availability, and restores focus on Escape', async () => {
    const trigger = accountTrigger();
    trigger.focus();
    await click(trigger);
    const menu = document.querySelector('[role="menu"][aria-label="Account options"]');
    expect(menu.querySelector('.account-identity [data-gradient]')).toBeTruthy();
    expect(menu.textContent).toContain('Alex Johnson');
    expect(menu.textContent).toContain('Active');
    expect(menuItem('Update your status').querySelector('.lucide-smile')).toBeTruthy();
    expect(menu.querySelector('.lucide-circle')).toBeNull();
    expect(target.querySelector('.chat-profile')).toBeNull();
    await vi.waitFor(() => expect(menu.contains(document.activeElement)).toBe(true));
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it('updates status and availability from the account menu and shares them with the profile', async () => {
    await click(accountTrigger());
    await click(menuItem('Update your status'));
    await vi.waitFor(() => expect(document.activeElement).toBe(document.querySelector('.profile-edit input')));
    await type(document.activeElement, 'Working on menus');
    document.querySelector('.profile-edit').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await tick();
    expect(document.querySelector('.profile-status').textContent).toBe('Working on menus');
    await click(button('Close profile'));
    await click(accountTrigger());
    expect(document.querySelector('[aria-label="Account options"]').textContent).toContain('Working on menus');
    await click(menuItem('Set yourself as away'));
    await vi.waitFor(() => expect(target.querySelector('.team-chat__topbar [data-presence="away"]')).toBeTruthy());
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    await click(accountTrigger());
    await click(menuItem('Clear status'));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    await openOwnProfile();
    expect(document.querySelector('.profile-status')).toBeNull();
    expect(document.querySelector('.profile-presence').dataset.presence).toBe('away');
  });

  async function channelContext(id) {
    const entry = target.querySelector(`.aesir-sidebar__desktop [data-channel="${id}"]`).closest('button');
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: 90, clientY: 160 });
    entry.dispatchEvent(event);
    await tick();
    expect(event.defaultPrevented).toBe(true);
    await vi.waitFor(() => expect(document.querySelector(`[role="menu"][aria-label="Channel options for ${id}"]`)?.contains(document.activeElement)).toBe(true));
    return entry;
  }

  it('renders imported mention, muted-channel and scheduled-message icons without registry fallbacks', async () => {
    const scheduled = [...target.querySelectorAll('.aesir-sidebar__desktop nav button')].find((node) => node.textContent.includes('Scheduled messages'));
    expect(scheduled.querySelector('.lucide-clock')).toBeTruthy();
    await channelContext('general');
    expect(menuItem('Just mentions').querySelector('.lucide-at-sign')).toBeTruthy();
    expect(menuItem('Mute channel').querySelector('.lucide-bell-off')).toBeTruthy();
    expect(document.querySelector('[role="menu"]').querySelector('.lucide-circle')).toBeNull();
    await click(menuItem('Mute channel'));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    const leading = target.querySelector('.aesir-sidebar__desktop [data-channel="general"]');
    expect(leading.querySelector('.lucide-bell-off')).toBeTruthy();
    expect(leading.querySelector('.lucide-circle')).toBeNull();
  });

  it('opens channel options on right-click and Shift+F10 without changing conversations or intercepting DMs', async () => {
    const input = target.querySelector('.conversation-composer textarea');
    await type(input, 'Keep this draft');
    const entry = await channelContext('engineering');
    expect(input.value).toBe('Keep this draft');
    expect(target.querySelector('.conversation-title').textContent).toBe('design-system');
    expect(entry.querySelector('.aesir-badge').textContent).toBe('2');
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    expect(document.activeElement).toBe(entry);
    entry.dispatchEvent(new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeTruthy());
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]').contains(document.activeElement)).toBe(true));
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    const direct = [...target.querySelectorAll('.aesir-sidebar__desktop nav button')].find((node) => node.textContent.includes('Morgan Chen'));
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    direct.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(document.querySelector('[role="menu"]')).toBeNull();
  });

  it('persists channel star and notification choices, copies its name, marks unread and opens details', async () => {
    await channelContext('general');
    await click(menuItem('Star channel'));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    const first = target.querySelector('.aesir-sidebar__desktop [data-channel]').dataset.channel;
    expect(first).toBe('general');
    await channelContext('general');
    expect(menuItem('Unstar channel').getAttribute('aria-checked')).toBe('true');
    await click(menuItem('Just mentions'));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    await channelContext('general');
    expect(menuItem('Just mentions').getAttribute('aria-checked')).toBe('true');
    expect(menuItem('All new posts').getAttribute('aria-checked')).toBe('false');
    await click(menuItem('Mark as unread'));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    expect(target.querySelector('[data-channel="general"]').closest('button').querySelector('.aesir-badge').textContent).toBe('1');
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', Object.create(navigator, { clipboard: { value: { writeText }, configurable: true } }));
    await channelContext('general');
    await click(menuItem('Copy channel name'));
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('#general'));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    await channelContext('general');
    await click(menuItem('About'));
    await vi.waitFor(() => expect(document.querySelector('.channel-about')).toBeTruthy());
    const dialog = document.querySelector('.channel-about').closest('[role="dialog"]');
    expect(dialog.textContent).toContain('A little bit of everything. Everyone is welcome.');
    expect(dialog.querySelector('.channel-about').textContent).toContain('Just mentions');
    await click([...dialog.querySelectorAll('[role="tab"]')].find((tab) => tab.textContent === 'Members 4'));
    expect(dialog.querySelectorAll('.member-list .chat-avatar')).toHaveLength(4);
  });

  it('opens channel options from mobile Home and returns focus there on Escape', async () => {
    resizeWorkspace(600);
    await tick();
    const mobile = target.querySelector('.mobile-navigation');
    const entry = mobile.querySelector('[data-mobile-channel="general"]');
    entry.focus();
    entry.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }));
    await tick();
    const menu = document.querySelector('[role="menu"][aria-label="Channel options for general"]');
    expect(document.querySelector('.aesir-drawer')).toBeNull();
    await vi.waitFor(() => expect(menu.contains(document.activeElement)).toBe(true));
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    expect(mobile.isConnected).toBe(true);
    expect(mobile.hidden).toBe(false);
    expect(document.activeElement).toBe(entry);
  });

  it('shows the profile local time in its timezone and updates it while open', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));
    await click(button("View Morgan Chen's profile", message('design-1')));
    const time = document.querySelector('.chat-profile time');
    expect(time.textContent).toBe('08:00');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(time.textContent).toBe('08:01');
  });

  it('edits only your own profile and contact data, with Escape cancelling the edit first', async () => {
    await openOwnProfile();
    await click(button('Edit profile'));
    const name = document.querySelector('.profile-edit input');
    expect(document.activeElement).toBe(name);
    await type(name, 'Discarded name');
    name.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await tick();
    expect(document.querySelector('.profile-edit')).toBeNull();
    expect(document.querySelector('.chat-profile h2').textContent).toBe('Alex Johnson');
    await vi.waitFor(() => expect(document.activeElement).toBe(button('Edit profile')));
    await click(button('Edit profile'));
    await type(document.querySelector('.profile-edit input'), 'Alex Taylor');
    document.querySelector('.profile-edit').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await tick();
    expect(document.querySelector('.chat-profile h2').textContent).toBe('Alex Taylor');
    expect(button("Open Alex Taylor's account menu", target.querySelector('.team-chat__topbar'))).toBeTruthy();
    await click(button('Edit contact information'));
    const form = document.querySelector('.profile-edit');
    await type(form.querySelector('input[type="email"]'), 'alex.taylor@example.com');
    await type(form.querySelector('input[type="tel"]'), '+1 202-555-0110');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await tick();
    expect(document.querySelector('.chat-profile a[href="mailto:alex.taylor@example.com"]')).toBeTruthy();
    expect(document.querySelector('.chat-profile a[href="tel:+12025550110"]')).toBeTruthy();
    const { people } = await import('../src/lib/components/docs/examples/team-chat/team-chat-demo.js');
    expect(people.you.name).toBe('Alex Johnson');
    expect(people.you.email).toBe('alex.johnson@example.com');
  });

  it('sets a status, changes availability and previews your profile without edit actions', async () => {
    await openOwnProfile();
    await click([...document.querySelectorAll('.profile-actions button')].find((node) => node.textContent.trim() === 'Set a status'));
    await type(document.querySelector('.profile-edit input'), 'Reviewing components');
    document.querySelector('.profile-edit').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await tick();
    expect(document.querySelector('.profile-status').textContent).toBe('Reviewing components');
    await click(button('More profile options'));
    expect(document.querySelector('[role="menu"]').style.getPropertyValue('--aesir-overlay-z-popover')).toBe('');
    await click([...document.querySelectorAll('[role="menuitemradio"]')].find((node) => node.textContent.includes('Set yourself as away')));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    expect(document.querySelector('.profile-presence').dataset.presence).toBe('away');
    expect(target.querySelector('.team-chat__topbar [data-presence="away"]')).toBeTruthy();
    await click(button('View profile as'));
    await click([...document.querySelectorAll('[role="menuitemradio"]')].find((node) => node.textContent.includes('Other members')));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    expect(document.querySelector('.profile-view-note')).toBeTruthy();
    expect(button('Edit profile')).toBeUndefined();
    expect(button('Edit contact information')).toBeUndefined();
    expect(button('More profile options')).toBeUndefined();
    expect(document.querySelector('.profile-status').textContent).toBe('Reviewing components');
    await click(button('View profile as'));
    await click([...document.querySelectorAll('[role="menuitemradio"]')].find((node) => node.textContent.includes('Your view')));
    await vi.waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    expect(button('Edit profile')).toBeTruthy();
    await click(button('More profile options'));
    await click([...document.querySelectorAll('[role="menuitem"]')].find((node) => node.textContent.includes('Clear status')));
    expect(document.querySelector('.profile-status')).toBeNull();
  });

  it('opens the quoted author profile separately from jumping to the quoted message', async () => {
    const quoted = message('reply-2').querySelector('.chat-quote');
    const trigger = button("View Sam Rivera's profile", quoted);
    await click(trigger);
    expect(document.querySelector('.chat-profile h2').textContent).toBe('Sam Rivera');
    await click(button('Close profile'));
    await vi.waitFor(() => expect(document.querySelector('.chat-profile')).toBeNull());
    expect(document.activeElement).toBe(trigger);
    await click(quoted.querySelector('.chat-quote__button'));
    expect(document.activeElement).toBe(message('reply-1'));
    await click(button('Reply to Sam Rivera', message('reply-1')));
    await type(document.querySelector('.conversation-composer textarea'), 'A quoted draft');
    await click(button("View Sam Rivera's profile", document.querySelector('.conversation-composer .chat-quote')));
    expect(document.querySelector('.chat-profile h2').textContent).toBe('Sam Rivera');
    await click(button('Close profile'));
    await vi.waitFor(() => expect(document.querySelector('.chat-profile')).toBeNull());
    expect(document.querySelector('.conversation-composer textarea').value).toBe('A quoted draft');
    expect(document.querySelector('.conversation-composer .chat-quote')).toBeTruthy();
    expect(document.querySelector('button button')).toBeNull();
  });

  it('opens profiles from quoted and forwarded author names without jumping or forwarding', async () => {
    const quote = message('reply-2').querySelector('.chat-quote');
    const name = quote.querySelector('.chat-quote__name');
    expect(name.querySelector('button')).toBeNull();
    await click(name);
    expect(document.querySelector('.chat-profile h2').textContent).toBe('Sam Rivera');
    expect(message('reply-1').classList.contains('highlighted')).toBe(false);
    await click(button('Close profile'));
    await vi.waitFor(() => expect(document.activeElement).toBe(name));
    await click(button('Forward message from Sam Rivera', message('design-2')));
    const forwardName = document.querySelector('.forward-author-name');
    await click(forwardName);
    await vi.waitFor(() => expect(forwardName.isConnected).toBe(false));
    await click(button('Close profile'));
    await vi.waitFor(() => expect(document.activeElement).toBe(document.querySelector('.forward-author-name')));
    expect(document.querySelector('.forward-picker')).toBeTruthy();
  });

  it('searches every workspace person exactly once and creates or reuses their DM without losing a draft', async () => {
    await type(target.querySelector('.conversation-composer textarea'), 'Keep my source draft');
    await click(button('Search conversations and messages'));
    const dialog = document.querySelector('.chat-search');
    expect(dialog.dataset.aesirAccent).toBe('green');
    expect(dialog.querySelectorAll('[data-search-kind="person"]')).toHaveLength(Object.keys(demoPeople).length - 1);
    await type(dialog.querySelector('input'), 'Drew');
    const result = dialog.querySelector('[data-search-result="person:drew"]');
    expect(result).toBeTruthy();
    await click(result.closest('[role="option"]'));
    await vi.waitFor(() => expect(document.activeElement).toBe(target.querySelector('.conversation-composer textarea')));
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('Drew Wilson');
    expect([...target.querySelectorAll('.aesir-sidebar__desktop .aesir-sidebar__item')].filter((node) => node.textContent.includes('Drew Wilson'))).toHaveLength(1);
    await click(button('Search conversations and messages'));
    const reopened = document.querySelector('.chat-search');
    await type(reopened.querySelector('input'), 'Drew');
    expect(reopened.querySelectorAll('[data-search-kind="person"]')).toHaveLength(1);
    expect(reopened.querySelector('[data-search-result="person:drew"]')).toBeNull();
    await click(reopened.querySelector('[data-search-result="conversation:dm-drew"]').closest('[role="option"]'));
    await vi.waitFor(() => expect(document.activeElement).toBe(target.querySelector('.conversation-composer textarea')));
    await click(sidebarConversation('# design-system'));
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep my source draft');
    const css = compile(highlightSource, { filename: resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-search-highlight.svelte'), generate: 'client' }).css.code;
    expect(css).toContain('background: var(--ds-accent-surface)');
    expect(css).toContain('color: var(--ds-accent-text-muted)');
    expect(css).not.toContain('--ds-surface-yellow');
  });

  it('keeps people and channel search results compact on one line, while messages retain their taller previews', async () => {
    layoutStyles = document.createElement('style');
    layoutStyles.textContent = [
      [commandMenuSource, '../../../packages/aesir-svelte/src/components/aesir-command-menu/aesir-command-menu.svelte'],
      [searchSource, '../src/lib/components/docs/examples/team-chat/team-chat-search.svelte'],
      [newMessageSource, '../src/lib/components/docs/examples/team-chat/team-chat-new-message.svelte'],
      [personOptionSource, '../src/lib/components/docs/examples/team-chat/team-chat-person-option.svelte']
    ]
      .map(([source, path]) => compile(source, { filename: resolve(import.meta.dirname, path), generate: 'client' }).css.code)
      .join('\n');
    document.head.append(layoutStyles);
    await openNewMessage();
    const newConversationRow = recipientCheckbox('Morgan Chen').closest('.member-picker__row').querySelector('.person-option-label');
    const newConversationHeight = getComputedStyle(newConversationRow).minHeight;
    const newConversationAvatarSize = newConversationRow.querySelector('[data-slot="avatar"]').dataset.size;
    expect(newConversationHeight).toBe('var(--ds-spacing-9)');
    const newChannelRow = button('Open #engineering');
    const newChannelHeight = getComputedStyle(newChannelRow).minHeight;
    const newChannelIconSize = newChannelRow.querySelector('svg').getAttribute('width');
    expect(newChannelHeight).toBe(newConversationHeight);
    expect(newChannelIconSize).toBe('16');
    await click(button('Cancel new message'));
    await click(button('Search conversations and messages'));
    const dialog = document.querySelector('.chat-search');
    function checkDensity() {
      const person = dialog.querySelector('[data-search-result="conversation:dm-morgan"]');
      const messageResult = dialog.querySelector('[data-search-result="message:morgan-1"]');
      expect(person.querySelector('[data-slot="avatar"]').dataset.size).toBe(newConversationAvatarSize);
      expect(person.querySelector('[data-presence="online"]')).toBeTruthy();
      expect(person.querySelector('.search-result__details').textContent).toBe('Available');
      expect(person.querySelector('.search-result__preview')).toBeNull();
      expect(getComputedStyle(person.querySelector('.search-result__copy')).flexDirection).toBe('row');
      expect(getComputedStyle(person.querySelector('.search-result__details')).whiteSpace).toBe('nowrap');
      expect(getComputedStyle(person.closest('[role="option"]')).minHeight).toBe('var(--ds-spacing-9)');
      expect(getComputedStyle(person.closest('[role="option"]')).height).toBe(newConversationHeight);
      expect(getComputedStyle(person.closest('[role="option"]')).boxSizing).toBe('border-box');
      const compactRule = [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules]).find((rule) => rule.selectorText?.includes('.chat-search') && rule.selectorText?.includes(':has('));
      expect(compactRule.style.padding).toBe('var(--ds-spacing-1) var(--ds-spacing-2)');
      expect(messageResult.querySelector('[data-slot="avatar"]').dataset.size).toBe('sm');
      expect(messageResult.querySelector('.search-result__preview').textContent).toContain('Hey Alex!');
      expect(getComputedStyle(messageResult.querySelector('.search-result__copy')).flexDirection).toBe('column');
      expect(getComputedStyle(messageResult.closest('[role="option"]')).minHeight).toBe('var(--ds-spacing-10)');
    }
    checkDensity();
    function checkChannelDensity() {
      const channels = [...dialog.querySelectorAll('[data-search-kind="channel"]')];
      expect(channels.length).toBeGreaterThan(0);
      for (const channel of channels) {
        const optionStyle = getComputedStyle(channel.closest('[role="option"]'));
        expect(optionStyle.minHeight).toBe(newChannelHeight);
        expect(optionStyle.height).toBe(newChannelHeight);
        expect(optionStyle.boxSizing).toBe('border-box');
        expect(getComputedStyle(channel.querySelector('.search-result__copy')).flexDirection).toBe('row');
        expect(getComputedStyle(channel.querySelector('.search-result__details')).whiteSpace).toBe('nowrap');
        expect(channel.querySelector('.search-result__details').textContent).toMatch(/^\d+ members$/);
        expect(channel.querySelector('.search-result__preview')).toBeNull();
        expect(channel.querySelector('svg').getAttribute('width')).toBe(newChannelIconSize);
        expect(getComputedStyle(channel.querySelector('.search-result__channel')).borderStyle).not.toBe('solid');
      }
    }
    checkChannelDensity();
    await type(dialog.querySelector('input'), 'engineering');
    checkChannelDensity();
    expect(dialog.querySelector('[data-search-result="conversation:engineering"] .search-result__name mark').textContent).toBe('engineering');
    await type(dialog.querySelector('input'), 'Morgan');
    checkDensity();
    expect(dialog.querySelector('[data-search-result="conversation:dm-morgan"] .search-result__name mark').textContent).toBe('Morgan');
  });

  it('groups search results with avatars and availability instead of job titles', async () => {
    await click(button('Search conversations and messages'));
    const dialog = document.querySelector('[role="dialog"][aria-label="Search conversations and messages"]');
    expect([...dialog.querySelectorAll('[role="group"]')].map((group) => group.querySelector('p').textContent)).toEqual(['People', 'Channels', 'Group messages', 'Messages']);
    const person = dialog.querySelector('[data-search-result="conversation:dm-morgan"]');
    expect(person.querySelector('.chat-avatar')).toBeTruthy();
    expect(person.querySelector('[data-presence="online"]')).toBeTruthy();
    expect(person.textContent).toContain('Morgan Chen');
    expect(person.textContent).toContain('Available');
    for (const role of ['Product design', 'Frontend engineering', 'Design systems']) expect(dialog.textContent).not.toContain(role);
    await type(dialog.querySelector('input'), 'Morgan');
    expect(dialog.textContent).toContain('Search results');
    expect(dialog.querySelector('[data-search-result="conversation:dm-morgan"]')).toBeTruthy();
    expect(dialog.querySelector('[data-search-result="conversation:dm-sam"]')).toBeNull();
    expect(dialog.querySelector('[data-search-kind="message"] .chat-avatar')).toBeTruthy();
  });

  it('omits duplicate incoming DM names but keeps the destination for outgoing messages', async () => {
    await click(button('Search conversations and messages'));
    const incoming = document.querySelector('[data-search-result="message:morgan-1"]');
    expect(incoming.querySelector('.search-result__name').textContent).toBe('Morgan Chen');
    expect(incoming.querySelector('.search-result__conversation')).toBeNull();
    expect(incoming.querySelector('.search-result__time').textContent).toBe('09:20');
    expect(document.querySelector('[data-search-result="message:engineering-1"] .search-result__conversation').textContent).toBe('# engineering');
    document.querySelector('[role="combobox"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('.chat-search')).toBeNull());
    await click([...target.querySelectorAll('nav button')].find((node) => node.textContent.includes('Morgan Chen')));
    await type(document.querySelector('.conversation-composer textarea'), 'Unique outgoing DM message');
    await click(button('Send message'));
    await click(button('Search conversations and messages'));
    await type(document.querySelector('[role="combobox"]'), 'Unique outgoing DM message');
    const outgoing = document.querySelector('[data-search-kind="message"]');
    expect(outgoing.querySelector('.search-result__name').textContent).toBe('Alex Johnson');
    expect(outgoing.querySelector('.search-result__conversation').textContent).toBe('To Morgan Chen');
  });

  it('highlights matching names, channels and message phrases, updating and clearing with the search query', async () => {
    await click(button('Search conversations and messages'));
    const input = document.querySelector('[role="combobox"]');
    await type(input, 'mOrGaN');
    const person = document.querySelector('[data-search-result="conversation:dm-morgan"]');
    expect(person.querySelector('.search-result__name mark').textContent).toBe('Morgan');
    expect(person.querySelector('.search-result__name').textContent).toBe('Morgan Chen');
    await type(input, 'engineering');
    expect(document.querySelector('[data-search-result="conversation:engineering"] .search-result__name mark').textContent).toBe('engineering');
    expect(document.querySelector('[data-search-result="message:engineering-1"] .search-result__conversation mark').textContent).toBe('engineering');
    await type(input, 'preview build');
    const result = document.querySelector('[data-search-result="message:engineering-1"]');
    expect(result.querySelector('.search-result__preview mark').textContent).toBe('preview build');
    expect(result.querySelector('.search-result__preview').textContent).toContain('The preview build is ready.');
    await type(input, '--ds-spacing-4');
    expect(document.querySelector('[data-search-result="message:design-2"] .search-result__preview mark').textContent).toBe('--ds-spacing-4');
    await type(input, '');
    expect(document.querySelector('.chat-search mark')).toBeNull();
    await type(input, 'Morgan');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('.chat-search')).toBeNull());
    await click(button('Search conversations and messages'));
    expect(document.querySelector('[role="combobox"]').value).toBe('');
    expect(document.querySelector('.chat-search mark')).toBeNull();
  });

  it('shows distant matches in the preview and highlights HTML-looking text without creating HTML', async () => {
    await type(document.querySelector('.conversation-composer textarea'), `${'Some context. '.repeat(50)}UniqueNeedle <img src=x onerror=alert(1)> UniqueNeedle`);
    await click(button('Send message'));
    const sent = [...target.querySelectorAll('[data-message-id]')].at(-1);
    await click(button('Search conversations and messages'));
    const input = document.querySelector('[role="combobox"]');
    await type(input, 'uniqueneedle');
    const result = document.querySelector(`[data-search-result="message:${sent.dataset.messageId}"]`);
    const preview = result.querySelector('.search-result__preview');
    expect(preview.textContent.startsWith('…')).toBe(true);
    expect([...preview.querySelectorAll('mark')].map((node) => node.textContent)).toEqual(['UniqueNeedle', 'UniqueNeedle']);
    expect(preview.querySelector('img, script')).toBeNull();
    await type(input, '<img');
    expect(preview.querySelector('mark').textContent).toBe('<img');
    expect(preview.querySelector('img')).toBeNull();
    await click(result.closest('[role="option"]'));
    await vi.waitFor(() => expect(document.querySelector('.chat-search')).toBeNull());
    expect(document.activeElement).toBe(sent);
  });

  it('opens an exact message search result with Enter and moves focus to the original', async () => {
    await click(button('Search conversations and messages'));
    const input = document.querySelector('[role="combobox"]');
    await type(input, 'preview build');
    const result = document.querySelector('[data-search-result="message:engineering-1"]');
    expect(result.querySelector('.chat-avatar')).toBeTruthy();
    expect(result.textContent).toContain('Sam Rivera');
    expect(result.textContent).toContain('# engineering');
    expect(result.textContent).toContain('09:05');
    expect(result.querySelector('.search-result__preview').textContent).toContain('The preview build is ready.');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('.chat-search')).toBeNull());
    expect(message('engineering-1').querySelector('.is-highlighted')).toBeTruthy();
    expect(document.activeElement).toBe(message('engineering-1'));
    expect(message('engineering-1').scrollIntoView).toHaveBeenCalledWith({ block: 'center' });
  });

  it('navigates results with arrows, opens people and resets search after dismissal', async () => {
    const trigger = button('Search conversations and messages');
    trigger.focus();
    await click(trigger);
    const input = document.querySelector('[role="combobox"]');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    await tick();
    expect(document.querySelector('[role="option"][aria-selected="true"]').textContent).toContain('Sam Rivera');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('.chat-search')).toBeNull());
    expect(document.querySelector('[data-conversation-heading]').textContent).toContain('Sam Rivera');
    expect(document.activeElement).toBe(document.querySelector('.conversation-composer textarea'));
    trigger.focus();
    await click(trigger);
    await type(document.querySelector('[role="combobox"]'), 'No such search result');
    expect(document.querySelector('.chat-search').textContent).toContain('No results found.');
    expect(document.querySelector('.chat-search [role="option"]')).toBeNull();
    document.querySelector('[role="combobox"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.querySelector('.chat-search')).toBeNull());
    expect(document.activeElement).toBe(trigger);
    await click(trigger);
    expect(document.querySelector('[role="combobox"]').value).toBe('');
    expect(document.querySelector('[data-search-result="conversation:dm-morgan"]')).toBeTruthy();
  });

  it('searches newly sent messages as plain text and opens a mouse-selected result', async () => {
    await type(document.querySelector('.conversation-composer textarea'), '**Fresh searchable message**');
    await click(button('Send message'));
    const sent = [...target.querySelectorAll('[data-message-id]')].at(-1);
    await click(button('Search conversations and messages'));
    await type(document.querySelector('[role="combobox"]'), 'Fresh searchable');
    const result = document.querySelector('.chat-search [role="option"]');
    expect(result.querySelector('.search-result__preview').textContent).toBe('Fresh searchable message');
    result.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    await vi.waitFor(() => expect(document.querySelector('.chat-search')).toBeNull());
    expect(sent.querySelector('.is-highlighted')).toBeTruthy();
    expect(document.activeElement).toBe(sent);
  });

  it('formats a selection, previews it and sends rendered text without losing the draft', async () => {
    const input = document.querySelector('.conversation-composer textarea');
    await type(input, 'Hello world');
    input.setSelectionRange(0, 5);
    await click(button('Bold'));
    expect(input.value).toBe('**Hello** world');
    expect(input.value.slice(input.selectionStart, input.selectionEnd)).toBe('Hello');
    expect(document.activeElement).toBe(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'i', ctrlKey: true, bubbles: true, cancelable: true }));
    await tick();
    expect(input.value).toBe('**_Hello_** world');
    await click(button('Preview message'));
    expect(target.querySelector('.chat-composer__preview strong em').textContent).toBe('Hello');
    await click(button('Edit message'));
    expect(document.querySelector('.conversation-composer textarea').value).toBe('**_Hello_** world');
    await click(button('Send message'));
    const sent = [...target.querySelectorAll('[data-message-id]')].at(-1);
    expect(sent.querySelector('.chat-text strong em').textContent).toBe('Hello');
    expect(sent.textContent).not.toContain('**');
  });

  it('inserts a validated link at the saved selection and does not send while editing it', async () => {
    const input = document.querySelector('.conversation-composer textarea');
    await type(input, 'Read Docs today');
    input.setSelectionRange(5, 9);
    await click(button('Insert link'));
    const fields = document.querySelector('.chat-link-fields');
    const popup = fields.closest('[role="dialog"]');
    expect(popup.style.boxSizing).toBe('border-box');
    expect(popup.style.width).toBe('min(var(--ds-sizing-xs), calc(100vw - var(--ds-spacing-8)))');
    const url = fields.querySelector('input[type="url"]');
    await type(url, 'javascript:alert(1)');
    await click(button('Apply link'));
    expect(fields.textContent).toContain('Enter an http, https, or mailto URL.');
    expect(input.value).toBe('Read Docs today');
    await type(url, 'https://example.com/docs');
    url.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await tick();
    expect(input.value).toBe('Read [Docs](https://example.com/docs) today');
    await vi.waitFor(() => expect(document.activeElement).toBe(input));
    await click(button('Send message'));
    const sent = [...target.querySelectorAll('[data-message-id]')].at(-1);
    expect(sent.querySelector('a').href).toBe('https://example.com/docs');
    expect(sent.querySelector('a').rel).toBe('noopener noreferrer');
  });

  it('hides formatting tools and rejects formatting that would exceed the message limit', async () => {
    const input = document.querySelector('.conversation-composer textarea');
    await type(input, 'x'.repeat(4000));
    input.setSelectionRange(0, 4000);
    await click(button('Bold'));
    expect(input.value).toHaveLength(4000);
    expect(document.querySelector('[role="alert"]').textContent).toContain('message limit');
    await click(button('Show formatting'));
    expect(button('Bold')).toBeUndefined();
    expect(input.value).toHaveLength(4000);
  });

  it('sends a quoted reply in the main feed and jumps to the exact original', async () => {
    await type(document.querySelector('.conversation-composer textarea'), 'A draft before replying');
    await click(button('Preview message'));
    await click(button('Reply to Jules Martin', message('design-3')));
    const composer = document.querySelector('.conversation-composer');
    const input = composer.querySelector('textarea');
    expect(input.value).toBe('A draft before replying');
    expect(document.activeElement).toBe(input);
    expect(composer.textContent).toContain('Replying to');
    expect(composer.querySelector('.chat-quote__author [role="img"]').getAttribute('aria-label')).toBe('Jules Martin · Offline');
    await type(input, 'A reply directly in the conversation');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await tick();
    const reply = [...document.querySelectorAll('[data-message-id]')].find((node) => node.textContent.includes('A reply directly in the conversation'));
    expect(reply).toBeTruthy();
    expect(reply.textContent).toContain('Jules Martin');
    expect(reply.querySelector('.chat-quote__author [data-gradient][data-size="xs"]')).toBeTruthy();
    expect(composer.querySelector('.chat-quote')).toBeNull();
    expect(document.querySelector('.thread-panel')).toBeNull();
    await click(reply.querySelector('.chat-quote__button'));
    expect(document.activeElement).toBe(message('design-3'));
    expect(message('design-3').querySelector('.is-highlighted')).toBeTruthy();
    expect(message('design-3').scrollIntoView).toHaveBeenCalledWith({ block: 'center' });
  });

  it('shows the quoted author avatar and time when replying to Sam', async () => {
    await click(button('Reply to Sam Rivera', message('reply-1')));
    const heading = document.querySelector('.conversation-composer .chat-quote__heading');
    expect(heading.querySelector('strong').textContent).toBe('Sam Rivera');
    expect(heading.querySelector('time').textContent).toBe('09:15');
    expect(heading.closest('.chat-quote').querySelector('[role="img"]').getAttribute('aria-label')).toBe('Sam Rivera · Away');
    expect(heading.closest('.chat-quote').querySelector('[data-presence="away"]')).toBeTruthy();
    await click(heading.closest('.chat-quote').querySelector('.chat-quote__button'));
    expect(document.activeElement).toBe(message('reply-1'));
  });

  it('clears the jumped-to message highlight after 2.5 seconds without moving focus or changing the draft', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await type(target.querySelector('.conversation-composer textarea'), 'Keep this draft');
    await click(message('reply-1').querySelector('.chat-quote__button'));
    const original = message('design-1');
    expect(original.querySelector('.is-highlighted')).toBeTruthy();
    expect(document.activeElement).toBe(original);
    await advance(2499);
    expect(original.querySelector('.is-highlighted')).toBeTruthy();
    await advance(1);
    expect(original.querySelector('.is-highlighted')).toBeNull();
    expect(document.activeElement).toBe(original);
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep this draft');
  });

  it('restarts the highlight lifetime when jumping to the same message again', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const quote = message('reply-1').querySelector('.chat-quote__button');
    await click(quote);
    await advance(2000);
    await click(quote);
    await advance(500);
    expect(message('design-1').querySelector('.is-highlighted')).toBeTruthy();
    await advance(1999);
    expect(message('design-1').querySelector('.is-highlighted')).toBeTruthy();
    await advance(1);
    expect(message('design-1').querySelector('.is-highlighted')).toBeNull();
  });

  it('does not let an older highlight timeout clear a newly targeted message', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await click(message('reply-1').querySelector('.chat-quote__button'));
    await advance(2000);
    await click(message('reply-2').querySelector('.chat-quote__button'));
    expect(message('design-1').querySelector('.is-highlighted')).toBeNull();
    expect(message('reply-1').querySelector('.is-highlighted')).toBeTruthy();
    await advance(500);
    expect(message('reply-1').querySelector('.is-highlighted')).toBeTruthy();
    await advance(2000);
    expect(message('reply-1').querySelector('.is-highlighted')).toBeNull();
  });

  it('clears the highlight timeout when changing conversations and unmounting the workspace', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await click(message('reply-1').querySelector('.chat-quote__button'));
    await click(sidebarConversation('# engineering'));
    await click(sidebarConversation('# design-system'));
    expect(target.querySelector('.is-highlighted')).toBeNull();
    // Let shorter tooltip/overlay cleanup timers settle, not the highlight timer.
    await advance(1000);
    expect(vi.getTimerCount()).toBe(0);
    await click(message('reply-1').querySelector('.chat-quote__button'));
    await advance(1000);
    expect(vi.getTimerCount()).toBe(1);
    await unmount(component);
    component = undefined;
    await advance(1000);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('also clears the highlight after opening a mobile activity message', async () => {
    await enterMobile();
    await click(mobileTab('Activity'));
    await click(button('Replies', target.querySelector('.activity-filters')));
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await click(target.querySelector('.mobile-row--activity'));
    const original = message('reply-2');
    expect(original.querySelector('.is-highlighted')).toBeTruthy();
    await advance(2500);
    expect(original.querySelector('.is-highlighted')).toBeNull();
    expect(document.activeElement).toBe(original);
  });

  it('cancels a reply without losing its draft, and preserves newline/IME behavior', async () => {
    await click(button('Reply to Morgan Chen', message('design-1')));
    const input = document.querySelector('.conversation-composer textarea');
    await type(input, 'Keep this draft');
    for (const options of [{ shiftKey: true }, { isComposing: true }]) {
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...options });
      input.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    await click(button('Cancel reply'));
    expect(input.value).toBe('Keep this draft');
    expect(document.activeElement).toBe(input);
    expect(document.querySelector('.conversation-composer .chat-quote')).toBeNull();
    expect(target.textContent).not.toContain('Only members of this conversation');
    expect(target.textContent).not.toContain('Shift + Enter for a new line');
  });

  it('uses icon-only reply and forward actions with hover and keyboard tooltips', async () => {
    const reply = button('Reply to Sam Rivera', message('design-2'));
    const forward = button('Forward message from Sam Rivera', message('design-2'));
    for (const action of [reply, forward]) {
      expect(action.textContent.trim()).toBe('');
      expect(action.dataset.size).toBe('icon-sm');
    }
    expect(reply.querySelector('.lucide-message-circle')).toBeTruthy();
    expect(forward.querySelector('.lucide-forward')).toBeTruthy();
    reply.dispatchEvent(new MouseEvent('mouseenter'));
    await vi.waitFor(() => expect(document.getElementById(reply.getAttribute('aria-describedby'))?.textContent).toBe('Reply'));
    const replyTip = document.getElementById(reply.getAttribute('aria-describedby'));
    expect(replyTip.style.width).toBe('max-content');
    expect(replyTip.style.maxWidth).toBe('calc(100vw - var(--ds-spacing-4))');
    expect(replyTip.style.whiteSpace).toBe('nowrap');
    reply.dispatchEvent(new MouseEvent('mouseleave'));
    await vi.waitFor(() => expect(document.querySelector('[role="tooltip"]')).toBeNull());
    forward.focus();
    await vi.waitFor(() => expect(document.getElementById(forward.getAttribute('aria-describedby'))?.textContent).toBe('Forward'));
    expect(document.getElementById(forward.getAttribute('aria-describedby')).style.width).toBe('max-content');
    expect(document.getElementById(forward.getAttribute('aria-describedby')).style.whiteSpace).toBe('nowrap');
    await click(forward);
    await vi.waitFor(() => expect(document.querySelector('[role="tooltip"]')).toBeNull());
    expect(document.querySelector('.forward-picker')).toBeTruthy();
  });

  it('keeps the add-reaction tooltip on one line and fits it to the label', async () => {
    const trigger = button('Add reaction to message from Sam Rivera', message('design-2'));
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    await vi.waitFor(() => expect(document.getElementById(trigger.getAttribute('aria-describedby'))?.textContent).toBe('Add reaction…'));
    const tooltip = document.getElementById(trigger.getAttribute('aria-describedby'));
    expect(tooltip.style.width).toBe('max-content');
    expect(tooltip.style.maxWidth).toBe('calc(100vw - var(--ds-spacing-4))');
    expect(tooltip.style.whiteSpace).toBe('nowrap');
  });

  it('forwards to a filtered destination and its quote navigates back across conversations', async () => {
    await click(button('Forward message from Sam Rivera', message('design-2')));
    const preview = document.querySelector('.forward-preview');
    expect(preview.querySelector('[role="img"]').getAttribute('aria-label')).toBe('Sam Rivera · Away');
    expect(preview.querySelector('[data-gradient][data-size="xs"]')).toBeTruthy();
    expect(preview.querySelector('time').textContent).toBe('09:24');
    await type(document.querySelector('input[aria-label="Find a forwarding destination"]'), 'Jules');
    expect(button('Forward to Morgan Chen')).toBeUndefined();
    expect(button('Forward to Jules Martin').querySelector('[role="img"]').getAttribute('aria-label')).toBe('Jules Martin · Offline');
    await click(button('Forward to Jules Martin'));
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"][aria-modal="true"]')).toBeNull());
    const navButton = [...target.querySelectorAll('nav button')].find((node) => node.textContent.includes('Jules Martin'));
    await click(navButton);
    const forwarded = [...target.querySelectorAll('[data-message-id]')].find((node) => node.textContent.includes('Forwarded from'));
    expect(forwarded.textContent).toContain('Sam Rivera');
    expect(forwarded.textContent).toContain('The updated spacing tokens');
    expect(forwarded.querySelector('.chat-quote__author [role="img"]').getAttribute('aria-label')).toBe('Sam Rivera · Away');
    await click(button("View Sam Rivera's profile", forwarded.querySelector('.chat-quote')));
    expect(document.querySelector('.chat-profile h2').textContent).toBe('Sam Rivera');
    await click(button('Close profile'));
    await vi.waitFor(() => expect(document.querySelector('.chat-profile')).toBeNull());
    await click(forwarded.querySelector('.chat-quote__button'));
    expect(message('design-2').querySelector('.is-highlighted')).toBeTruthy();
    expect(document.activeElement).toBe(message('design-2'));
  });

  it('forwards to any workspace person, creating a DM only after choosing and reusing it afterwards', async () => {
    await type(target.querySelector('.conversation-composer textarea'), 'Keep my forwarding draft');
    await click(button('Forward message from Sam Rivera', message('design-2')));
    const dialog = document.querySelector('.forward-picker').closest('[role="dialog"]');
    expect(dialog.dataset.aesirAccent).toBe('green');
    expect(button('Forward to Drew Wilson', dialog)).toBeTruthy();
    expect(sidebarConversation('Drew Wilson')).toBeUndefined();
    await type(dialog.querySelector('input'), 'Drew');
    await click(button('Forward to Drew Wilson', dialog));
    await vi.waitFor(() => expect(document.querySelector('.forward-picker')).toBeNull());
    expect(target.querySelector('[data-conversation-heading]').textContent).toContain('design-system');
    expect(target.querySelector('.conversation-composer textarea').value).toBe('Keep my forwarding draft');
    await click(sidebarConversation('Drew Wilson'));
    const forwarded = [...target.querySelectorAll('[data-message-id]')].filter((node) => node.textContent.includes('Forwarded from'));
    expect(forwarded).toHaveLength(1);
    expect(forwarded[0].querySelector('.chat-quote__heading').textContent).toContain('Sam Rivera');
    await click(sidebarConversation('# design-system'));
    await click(button('Forward message from Sam Rivera', message('design-2')));
    await click(button('Forward to Drew Wilson'));
    expect([...target.querySelectorAll('.aesir-sidebar__desktop .aesir-sidebar__item')].filter((node) => node.textContent.includes('Drew Wilson'))).toHaveLength(1);
    await click(sidebarConversation('Drew Wilson'));
    expect([...target.querySelectorAll('[data-message-id]')].filter((node) => node.textContent.includes('Forwarded from'))).toHaveLength(2);
  });

  it('keeps the original author avatar when forwarding a forwarded message again', async () => {
    const navButton = [...target.querySelectorAll('nav button')].find((node) => node.textContent.includes('Sam Rivera'));
    await click(navButton);
    await click(button('Forward message from Alex Johnson', message('forward-1')));
    const preview = document.querySelector('.forward-preview');
    expect(preview.querySelector('strong').textContent).toBe('Sam Rivera');
    expect(preview.querySelector('[role="img"]').getAttribute('aria-label')).toBe('Sam Rivera · Away');
    expect(preview.querySelector('time').textContent).toBe('09:24');
  });

  it('does not forward anything when the destination dialog is dismissed', async () => {
    await click(button('Forward message from Jules Martin', message('design-3')));
    await click(button('Close dialog', document.querySelector('[role="dialog"]')));
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"][aria-modal="true"]')).toBeNull());
    const navButton = [...target.querySelectorAll('nav button')].find((node) => node.textContent.includes('Jules Martin'));
    await click(navButton);
    expect(target.querySelectorAll('[data-message-id]')).toHaveLength(1);
    expect(target.textContent).not.toContain('Forwarded from');
  });
});
