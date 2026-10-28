import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { compile } from 'svelte/compiler';
import { flushSync, mount, unmount } from 'svelte';
import TeamChatText from '../src/lib/components/docs/examples/team-chat/team-chat-text.svelte';
import source from '../src/lib/components/docs/examples/team-chat/team-chat-text.svelte?raw';

const { css } = compile(source, { filename: resolve(import.meta.dirname, '../src/lib/components/docs/examples/team-chat/team-chat-text.svelte'), generate: 'client' });
let component;
let target;
let componentStyles;
let reset;

beforeEach(() => {
  target = document.createElement('div');
  document.body.append(target);
  // Vitest does not apply extracted component CSS. Use the real compiler output,
  // followed by the host reset to check that scoped list styles win the cascade.
  componentStyles = document.createElement('style');
  componentStyles.textContent = css.code;
  reset = document.createElement('style');
  reset.textContent = 'ol, ul, menu { list-style: none; }';
  document.head.append(componentStyles, reset);
});

afterEach(async () => {
  if (component) await unmount(component);
  component = undefined;
  target.remove();
  componentStyles.remove();
  reset.remove();
});

describe('chat list rendering', () => {
  it.each([
    ['- **First**\n- Second', 'ul', 'disc', null],
    ['3. **First**\n4. Second', 'ol', 'decimal', '3']
  ])('keeps visible markers under the host CSS reset for %s', (text, tag, marker, start) => {
    component = mount(TeamChatText, { target, props: { text } });
    flushSync();
    const list = target.querySelector(tag);
    expect(list).toBeTruthy();
    expect(list.querySelectorAll('li')).toHaveLength(2);
    expect(list.querySelector('li strong').textContent).toBe('First');
    expect(list.getAttribute('start')).toBe(start);
    const style = getComputedStyle(list);
    expect(style.listStyleType).toBe(marker);
    expect(style.listStylePosition).toBe('outside');
  });
});
