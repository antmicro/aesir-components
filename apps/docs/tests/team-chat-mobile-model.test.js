import { describe, expect, it } from 'vitest';
import { conversations, people, initialMessages } from '../src/lib/components/docs/examples/team-chat/team-chat-demo.js';
import { latestChatMessage, mobileChatActivity, mobileChatPeople, mobileChatSearch, sortMobileConversations } from '../src/lib/components/docs/examples/team-chat/team-chat-mobile-model.js';

describe('mobile chat navigation data', () => {
  it('ranks DM people by recency or exchanged-message frequency, never by channel activity', () => {
    const messages = [
      { conversation: 'dm-morgan', author: 'morgan', createdAt: '2026-10-08T09:00:00Z' },
      { conversation: 'dm-morgan', author: 'you', createdAt: '2026-10-08T09:01:00Z' },
      { conversation: 'dm-sam', author: 'sam', createdAt: '2026-10-09T00:01:00Z' },
      { conversation: 'design-system', author: 'jules', createdAt: '2026-10-10T15:00:00Z' }
    ];
    const rooms = conversations.filter((room) => ['dm-morgan', 'dm-sam', 'dm-jules', 'design-system'].includes(room.id));
    const snapshot = structuredClone(messages);
    expect(mobileChatPeople(rooms, people, messages).map((entry) => entry.id)).toEqual(['sam', 'morgan', 'jules']);
    expect(mobileChatPeople(rooms, people, messages, 'frequent').map((entry) => entry.id)).toEqual(['morgan', 'sam', 'jules']);
    expect(mobileChatPeople(rooms, people, messages, 'recent', 2).map((entry) => entry.id)).toEqual(['sam', 'morgan']);
    expect(messages).toEqual(snapshot);
  });

  it('deduplicates direct and group contacts, excludes yourself and unknown people, and does not count other group authors toward frequency', () => {
    const rooms = [
      { id: 'direct', type: 'direct', members: ['you', 'morgan'] },
      { id: 'group', type: 'group', members: ['you', 'morgan', 'taylor', 'taylor', 'missing'] },
      { id: 'channel', type: 'channel', members: ['you', 'sam'] }
    ];
    const messages = [
      { conversation: 'direct', author: 'you', createdAt: '2026-10-09T10:00:00Z' },
      { conversation: 'group', author: 'taylor', createdAt: '2026-10-09T11:00:00Z' },
      { conversation: 'group', author: 'you', createdAt: '2026-10-09T11:01:00Z' },
      { conversation: 'channel', author: 'sam', createdAt: '2026-10-09T12:00:00Z' }
    ];
    const contacts = mobileChatPeople(rooms, people, messages, 'frequent');
    expect(contacts.map((entry) => entry.id)).toEqual(['morgan', 'taylor']);
    expect(contacts.map((entry) => entry.frequency)).toEqual([2, 2]);
    expect(contacts[0].person).toBe(people.morgan);
    expect(mobileChatPeople([], people, messages)).toEqual([]);
    expect(mobileChatPeople(rooms, people, [], 'recent', 0)).toEqual([]);
  });

  it('returns the latest message, including one appended after older demo messages', () => {
    expect(latestChatMessage(initialMessages, 'dm-sam').id).toBe('forward-1');
    expect(latestChatMessage(initialMessages, 'missing')).toBeUndefined();
    expect(latestChatMessage([...initialMessages, { id: 'new', conversation: 'dm-sam' }], 'dm-sam').id).toBe('new');
  });
  it('shows recent conversations in message order without searching all people for a blank query', () => {
    const result = mobileChatSearch(conversations, people, initialMessages, ' ');
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Recent conversations');
    expect(result[0].items[0].room.id).toBe('design-system');
    expect(result[0].items.every((item) => item.kind === 'room')).toBe(true);
  });
  it('sorts DMs by real message time rather than the grouped demo array, including new messages after midnight', () => {
    const dms = conversations.filter((room) => room.type === 'direct');
    expect(sortMobileConversations(dms, initialMessages).map((room) => room.id)).toEqual(['dm-sam', 'dm-morgan', 'dm-jules', 'dm-riley', 'dm-casey', 'dm-avery', 'dm-robin', 'dm-quinn']);
    const messages = [...initialMessages, { id: 'new', conversation: 'dm-jules', time: '00:01', createdAt: '2026-10-09T00:01:00.000Z' }];
    expect(sortMobileConversations(dms, messages)[0].id).toBe('dm-jules');
  });
  it('finds new people without requiring an existing DM and excludes your own account', () => {
    expect(mobileChatSearch(conversations, people, initialMessages, 'tAYlor')[0].items[0].person.name).toBe('Taylor Brooks');
    expect(mobileChatSearch(conversations, people, initialMessages, 'Alex')[0].label).not.toBe('People');
  });
  it('finds channels, messages by channel or author, and code snippets with useful previews', () => {
    const results = mobileChatSearch(conversations, people, initialMessages, 'engineering');
    expect(results[0].items[0].room.id).toBe('engineering');
    expect(results.find((group) => group.label === 'Messages').items.map((item) => item.id)).toEqual(['engineering-2', 'engineering-1']);
    expect(mobileChatSearch(conversations, people, initialMessages, '--ds-spacing-4')[0].items.every((item) => item.preview.includes('--ds-spacing-4'))).toBe(true);
  });
  it('handles literal punctuation and missing results without mutating source data', () => {
    const snapshot = structuredClone(initialMessages);
    expect(mobileChatSearch(conversations, people, initialMessages, '[.*')).toEqual([]);
    expect(initialMessages).toEqual(snapshot);
  });
  it('derives unread activity only from incoming messages and preserves reply/reaction categories after reading', () => {
    const activity = mobileChatActivity(conversations, initialMessages);
    expect(activity[0].message.id).toBe('design-5');
    expect(activity.filter((entry) => entry.unread)).toHaveLength(conversations.reduce((total, room) => total + room.unread, 0));
    expect(activity.filter((entry) => entry.types.includes('replies')).map((entry) => entry.message.id)).toEqual(['reply-2', 'reply-1', 'research-2', 'feedback-2']);
    expect(activity.some((entry) => entry.message.id === 'design-4')).toBe(false);
    const read = mobileChatActivity(
      conversations.map((room) => ({ ...room, unread: 0 })),
      initialMessages
    );
    expect(read.some((entry) => entry.unread)).toBe(false);
    expect(read.some((entry) => entry.types.includes('reactions'))).toBe(true);
    expect(read.filter((entry) => entry.types.includes('replies'))).toHaveLength(4);
  });
  it('recognizes mentions without inventing a thread or a reacting author', () => {
    const message = { id: 'mention', author: 'sam', conversation: 'general', text: 'Hey @Alex Johnson, can you check this?', createdAt: '2026-10-09T10:00:00.000Z', reactions: [] };
    const activity = mobileChatActivity(conversations, [...initialMessages, message]);
    expect(activity[0].types).toEqual(['mentions']);
    expect(activity[0].message).toBe(message);
  });
});
