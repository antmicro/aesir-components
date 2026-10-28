import { describe, expect, it } from 'vitest';
import { emojiCatalog, emojiCategories, emojiNavigationIndex, emojiNavigationTarget, frequentEmoji, getEmojiGroups } from '../src/lib/components/docs/examples/team-chat/team-chat-emoji-data.js';

describe('team chat emoji picker', () => {
  it('has unique names and glyphs, valid categories and frequent entries', () => {
    expect(new Set(emojiCatalog.map((item) => item.id)).size).toBe(emojiCatalog.length);
    expect(new Set(emojiCatalog.map((item) => item.emoji)).size).toBe(emojiCatalog.length);
    for (const item of emojiCatalog) expect(emojiCategories.some((category) => category.id === item.category)).toBe(true);
    for (const emoji of frequentEmoji) expect(emojiCatalog.some((item) => item.emoji === emoji)).toBe(true);
  });
  it('searches names, aliases, shortcodes and glyphs across categories', () => {
    for (const query of ['THUMBS UP', ':thumbs_up:', 'thumbsup', '👍']) expect(getEmojiGroups(query, 'food')[0].items.some((item) => item.emoji === '👍')).toBe(true);
    expect(getEmojiGroups('celebrate')[0].items.some((item) => item.emoji === '🎉')).toBe(true);
    expect(getEmojiGroups('not-an-emoji')[0].items).toEqual([]);
  });
  it('shows grouped suggestions and filters categories without duplicate cells', () => {
    const groups = getEmojiGroups();
    expect(groups[0].items.map((item) => item.emoji)).toEqual(frequentEmoji);
    expect(groups[1].label).toBe('Getting work done');
    expect(groups.every((group) => new Set(group.items.map((item) => item.id)).size === group.items.length)).toBe(true);
    expect(getEmojiGroups('', 'food')[0].items.every((item) => item.category === 'food')).toBe(true);
    expect(getEmojiGroups('', 'all', ['☕', '👍'])[0].items.map((item) => item.emoji)).toEqual(['☕', '👍']);
  });
  it('navigates rows, clamps at edges and leaves Enter and Space to native buttons', () => {
    expect(emojiNavigationIndex(2, 'ArrowDown', 20)).toBe(10);
    expect(emojiNavigationIndex(10, 'ArrowUp', 20)).toBe(2);
    expect(emojiNavigationIndex(0, 'ArrowLeft', 20)).toBe(0);
    expect(emojiNavigationIndex(19, 'ArrowRight', 20)).toBe(19);
    expect(emojiNavigationIndex(11, 'Home', 20)).toBe(8);
    expect(emojiNavigationIndex(11, 'End', 20)).toBe(15);
    expect(emojiNavigationIndex(11, 'End', 20, 8, true)).toBe(19);
    expect(emojiNavigationIndex(0, 'Enter', 20)).toBeUndefined();
    expect(emojiNavigationIndex(0, ' ', 20)).toBeUndefined();
    expect(emojiNavigationIndex(0, 'ArrowDown', 0)).toBe(-1);
  });
  it('crosses section boundaries and preserves columns in partial rows', () => {
    const lengths = [16, 24, 12];
    expect(emojiNavigationTarget(0, 10, 'ArrowDown', lengths)).toEqual({ group: 1, index: 2 });
    expect(emojiNavigationTarget(1, 2, 'ArrowUp', lengths)).toEqual({ group: 0, index: 10 });
    expect(emojiNavigationTarget(1, 23, 'ArrowRight', lengths)).toEqual({ group: 2, index: 0 });
    expect(emojiNavigationTarget(2, 0, 'ArrowLeft', lengths)).toEqual({ group: 1, index: 23 });
    expect(emojiNavigationTarget(2, 7, 'ArrowUp', lengths)).toEqual({ group: 1, index: 23 });
    expect(emojiNavigationTarget(0, 0, 'End', lengths, 8, true)).toEqual({ group: 2, index: 11 });
    expect(emojiNavigationTarget(2, 11, 'Home', lengths, 8, true)).toEqual({ group: 0, index: 0 });
  });
});
