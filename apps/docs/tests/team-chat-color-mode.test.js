import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import { createStorage } from './storage.js';

let target;
let workspace;
let watcher;
let theme;
let systemLight = true;
const mediaQueries = new Set();
let originalClass;
let originalStyle;
let resizeWorkspace;
const deviceStorage = createStorage();

async function click(node) {
  expect(node).toBeTruthy();
  node.click();
  await tick();
}
const labelledButton = (label) => [...document.querySelectorAll('button')].find((node) => node.getAttribute('aria-label') === label);
const colorMode = () => [...document.querySelectorAll('[role="combobox"]')].find((node) => document.getElementById(node.getAttribute('aria-labelledby'))?.textContent === 'Color mode');
const section = (label) => [...document.querySelectorAll('.preferences-navigation button')].find((node) => node.textContent.trim() === label);
async function chooseMode(label) {
  await click(colorMode());
  const list = document.querySelector('[role="listbox"][aria-label="Color mode"]');
  expect([...list.querySelectorAll('[role="option"]')].map((node) => node.textContent.trim())).toEqual(['Light', 'Dark', 'System']);
  await click([...list.querySelectorAll('[role="option"]')].find((node) => node.textContent.trim() === label));
}
async function changeSystem(light) {
  systemLight = light;
  for (const media of mediaQueries) media.dispatchEvent(new window.Event('change'));
  await tick();
}
function expectMode(mode) {
  expect(document.documentElement.classList.contains('dark')).toBe(mode === 'dark');
  expect(document.documentElement.style.colorScheme).toBe(mode);
  expect(theme.mode.current).toBe(mode);
}

beforeEach(async () => {
  originalClass = document.documentElement.className;
  originalStyle = document.documentElement.getAttribute('style');
  vi.stubGlobal('localStorage', deviceStorage);
  localStorage.clear();
  vi.stubGlobal('matchMedia', (query) => {
    const media = new window.EventTarget();
    Object.defineProperty(media, 'matches', { get: () => (query.includes('prefers-color-scheme') ? systemLight : false) });
    if (query.includes('prefers-color-scheme')) mediaQueries.add(media);
    return media;
  });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback) {
        this.callback = callback;
      }
      observe(node) {
        if (node.matches('.team-chat')) resizeWorkspace = (width) => this.callback([{ contentRect: { width } }]);
      }
      unobserve() {}
      disconnect() {}
    }
  );
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 160, 40));
  HTMLElement.prototype.scrollIntoView = vi.fn();
  target = document.createElement('div');
  document.body.append(target);
  theme = await import('mode-watcher');
  watcher = mount(theme.ModeWatcher, { target, props: { disableHeadScriptInjection: true, disableTransitions: false, synchronousModeChanges: true } });
  const { default: TeamChat } = await import('../src/lib/components/docs/examples/team-chat/team-chat-pattern-example.svelte');
  workspace = mount(TeamChat, { target });
  flushSync();
});

it('keeps Light, Dark and System connected to the same mode watcher in mobile navigation', async () => {
  resizeWorkspace(390);
  await tick();
  expect(target.querySelector('.mobile-navigation').hidden).toBe(false);
  await click([...target.querySelectorAll('.team-chat__topbar button')].find((node) => node.getAttribute('aria-label')?.endsWith("'s account menu")));
  await click([...document.querySelectorAll('[role="menuitem"]')].find((node) => node.textContent.trim() === 'Preferences'));
  await vi.waitFor(() => expect(document.querySelector('.chat-preferences')).toBeTruthy());
  await click(section('Appearance'));
  await chooseMode('Dark');
  expectMode('dark');
  await chooseMode('Light');
  expectMode('light');
  await chooseMode('System');
  await changeSystem(false);
  expectMode('dark');
  await changeSystem(true);
  expectMode('light');
  await click(labelledButton('Close preferences'));
  await vi.waitFor(() => expect(document.querySelector('.chat-preferences')).toBeNull());
  expect(target.querySelector('.mobile-navigation').hidden).toBe(false);
  expect(target.querySelector('.mobile-tab[aria-current="page"]').textContent.trim()).toBe('Home');
});

afterEach(async () => {
  theme?.resetMode();
  await tick();
  if (workspace) await unmount(workspace);
  if (watcher) await unmount(watcher);
  target?.remove();
  localStorage.clear();
  document.documentElement.className = originalClass;
  if (originalStyle === null) document.documentElement.removeAttribute('style');
  else document.documentElement.setAttribute('style', originalStyle);
  vi.unstubAllGlobals();
});

it('selects Light, Dark and System through Aesir, follows live OS changes, remembers the choice and resets without losing a draft', async () => {
  expectMode('light');
  const draft = target.querySelector('.conversation-composer textarea');
  draft.value = 'Keep my draft when changing appearance';
  draft.dispatchEvent(new Event('input', { bubbles: true }));
  await tick();
  async function openPreferences() {
    await click([...target.querySelectorAll('.team-chat__topbar button')].find((node) => node.getAttribute('aria-label')?.endsWith("'s account menu")));
    await click([...document.querySelectorAll('[role="menuitem"]')].find((node) => node.textContent.trim() === 'Preferences'));
    await vi.waitFor(() => expect(document.querySelector('.chat-preferences')).toBeTruthy());
    await click(section('Appearance'));
  }
  await openPreferences();
  expect(colorMode().textContent).toContain('System');
  expect(colorMode().closest('.preferences-group').querySelector('select')).toBeNull();
  await chooseMode('Dark');
  expectMode('dark');
  expect(localStorage.getItem(theme.modeStorageKey.current)).toBe('dark');
  expect(document.activeElement).toBe(colorMode());
  await changeSystem(false);
  await changeSystem(true);
  expectMode('dark');
  await chooseMode('Light');
  expectMode('light');
  await changeSystem(false);
  expectMode('light');
  await chooseMode('System');
  expectMode('dark');
  expect(localStorage.getItem(theme.modeStorageKey.current)).toBe('system');
  await changeSystem(true);
  expectMode('light');
  // The site's existing theme toggle and Preferences share one source of truth.
  theme.setMode('dark');
  await tick();
  expect(colorMode().textContent).toContain('Dark');
  expectMode('dark');
  await click(labelledButton('Close preferences'));
  await vi.waitFor(() => expect(document.querySelector('.chat-preferences')).toBeNull());
  expect(draft.value).toBe('Keep my draft when changing appearance');
  await openPreferences();
  expect(colorMode().textContent).toContain('Dark');
  await click(section('Advanced'));
  await click([...document.querySelectorAll('.chat-preferences button')].find((node) => node.textContent.trim() === 'Reset preferences'));
  expectMode('light');
  await click(section('Appearance'));
  expect(colorMode().textContent).toContain('System');
  expect(draft.value).toBe('Keep my draft when changing appearance');
});
