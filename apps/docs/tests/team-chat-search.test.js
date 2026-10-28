import { describe, expect, it } from 'vitest';
import { chatSearchParts, chatSearchPreview } from '../src/lib/components/docs/examples/team-chat/team-chat-search-model.js';

describe('chat search highlights', () => {
  it('marks every case-insensitive occurrence without changing the source text', () => {
    const text = 'Small tweaks, SMALL improvements, smaller details';
    const parts = chatSearchParts(text, ' small ');
    expect(parts.filter((part) => part.matched).map((part) => part.text)).toEqual(['Small', 'SMALL', 'small']);
    expect(parts.map((part) => part.text).join('')).toBe(text);
    expect(new Set(parts.map((part) => part.start)).size).toBe(parts.length);
  });
  it('keeps phrases together and treats regexp characters as literal text', () => {
    expect(
      chatSearchParts('Try a+b [v2].* now', 'a+b [v2].*')
        .filter((part) => part.matched)
        .map((part) => part.text)
    ).toEqual(['a+b [v2].*']);
    expect(
      chatSearchParts('preview build', 'preview build')
        .filter((part) => part.matched)
        .map((part) => part.text)
    ).toEqual(['preview build']);
    expect(chatSearchParts('anything', '.*').some((part) => part.matched)).toBe(false);
  });
  it('handles Unicode and keeps HTML-looking text as plain text', () => {
    const text = 'Łódź 🚀 <img onerror=alert(1)>';
    expect(chatSearchParts(text, 'ŁÓDŹ')[0]).toMatchObject({ text: 'Łódź', matched: true });
    expect(chatSearchParts(text, '🚀').find((part) => part.matched)?.text).toBe('🚀');
    expect(
      chatSearchParts(text, '<img')
        .map((part) => part.text)
        .join('')
    ).toBe(text);
  });
  it('does not highlight empty or unmatched queries', () => {
    for (const query of ['', '  ', 'missing']) expect(chatSearchParts('Hello', query)).toEqual([{ text: 'Hello', matched: false, start: 0 }]);
    expect(chatSearchParts('', 'Hello')).toEqual([{ text: '', matched: false, start: 0 }]);
  });
  it('puts distant matches inside a bounded preview and retains long matching phrases', () => {
    const text = `${'Before '.repeat(100)}the matched phrase${' after'.repeat(100)}`;
    const preview = chatSearchPreview(text, 'matched phrase');
    expect(preview).toContain('the matched phrase');
    expect(preview.startsWith('…')).toBe(true);
    expect(preview.endsWith('…')).toBe(true);
    expect(preview.length).toBeLessThanOrEqual(182);
    const longTerm = 'z'.repeat(200);
    expect(chatSearchPreview(`Prefix ${longTerm} suffix`, longTerm)).toContain(longTerm);
    expect(chatSearchPreview('Short message', '')).toBe('Short message');
  });
});
