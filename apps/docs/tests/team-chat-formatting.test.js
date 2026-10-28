import { describe, expect, it } from 'vitest';
import { formatChatSelection, parseChatInline, parseChatText, plainChatText, safeChatLink } from '../src/lib/components/docs/examples/team-chat/team-chat-formatting.js';

describe('chat formatting', () => {
  it.each([
    ['bold', '**Hello**'],
    ['italic', '_Hello_'],
    ['underline', '<u>Hello</u>'],
    ['strike', '~~Hello~~'],
    ['code', '`Hello`']
  ])('formats and removes %s around the selection', (format, expected) => {
    const edit = formatChatSelection('Hello world', 0, 5, format);
    expect(edit.value).toBe(`${expected} world`);
    expect(edit.value.slice(edit.start, edit.end)).toBe('Hello');
    expect(formatChatSelection(edit.value, edit.start, edit.end, format)).toEqual({ value: 'Hello world', start: 0, end: 5 });
  });

  it('inserts a selected placeholder at an empty caret', () => {
    const edit = formatChatSelection('Hi ', 3, 3, 'bold');
    expect(edit.value).toBe('Hi **bold text**');
    expect(edit.value.slice(edit.start, edit.end)).toBe('bold text');
  });

  it.each([
    ['bullet', '- One\n- Two'],
    ['ordered', '1. One\n2. Two'],
    ['quote', '> One\n> Two']
  ])('applies and removes %s to complete selected lines', (format, expected) => {
    const edit = formatChatSelection('One\nTwo\nTail', 1, 7, format);
    expect(edit.value).toBe(`${expected}\nTail`);
    expect(formatChatSelection(edit.value, edit.start, edit.end, format).value).toBe('One\nTwo\nTail');
    expect(formatChatSelection('\nTail', 0, 0, format).value.endsWith('\nTail')).toBe(true);
  });

  it('supports fenced code including backticks inside code', () => {
    const edit = formatChatSelection('const x = ```;', 0, 14, 'codeblock');
    expect(parseChatText(edit.value)).toEqual([{ type: 'codeblock', text: 'const x = ```;' }]);
  });

  it('renders nested inline formats, lists, quotes and code as structured data', () => {
    expect(parseChatInline('**Hello _world_**')[0]).toMatchObject({ type: 'bold', children: [{ type: 'text', text: 'Hello ' }, { type: 'italic' }] });
    expect(parseChatText('- **One**\n- Two\n\n> Quote\n\n1. First').map((block) => block.type)).toEqual(['list', 'quote', 'list']);
    expect(plainChatText('**One**\n\n- _Two_\n- <u>Three</u>')).toBe('One\nTwo\nThree');
  });

  it('accepts only safe link protocols and treats arbitrary HTML as literal text', () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,hi', 'vbscript:test', '/local', 'invalid']) expect(safeChatLink(url)).toBeUndefined();
    for (const url of ['https://example.com', 'http://example.com', 'mailto:hello@example.com']) expect(safeChatLink(url)).toBeTruthy();
    expect(parseChatInline('<img src=x onerror=alert(1)>')).toEqual([{ type: 'text', text: '<img src=x onerror=alert(1)>' }]);
    expect(parseChatInline('[bad](javascript:alert)')[0].type).toBe('text');
    expect(formatChatSelection('bad', 0, 3, 'link', 'javascript:alert(1)')).toBeUndefined();
  });

  it('escapes URL parentheses and supports escaped brackets in link labels', () => {
    const edit = formatChatSelection('Docs', 0, 4, 'link', 'https://example.com/a(b)');
    expect(parseChatInline(edit.value)[0]).toMatchObject({ type: 'link', href: 'https://example.com/a%28b%29' });
    expect(plainChatText('[Docs \\[v2\\]](https://example.com)')).toBe('Docs [v2]');
  });
});
