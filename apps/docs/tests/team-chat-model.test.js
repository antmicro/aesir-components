import { describe, expect, it } from 'vitest';
import {
  createChatMessage,
  createForwardedChatMessage,
  deleteOwnChatMessage,
  editOwnChatMessage,
  filterChatSidebarSections,
  findChatMessage,
  getChatMessageReference,
  renameGroupConversation,
  resolveDirectConversation,
  toggleChatReaction,
  toggleChatPin,
  updateChatConversation
} from '../src/lib/components/docs/examples/team-chat/team-chat-model.js';
import { conversations, initialMessages, people, presenceLabels } from '../src/lib/components/docs/examples/team-chat/team-chat-demo.js';

describe('team chat example model', () => {
  it('reuses only conversations with the exact recipients, independent of order or duplicate selection', () => {
    const rooms = structuredClone(conversations);
    expect(resolveDirectConversation(rooms, people, ['morgan'])).toBe(rooms.find((room) => room.id === 'dm-morgan'));
    const group = resolveDirectConversation(rooms, people, ['morgan', 'sam', 'sam', 'you'], { id: 'new-group' });
    expect(group).toMatchObject({ id: 'new-group', type: 'group', name: 'Morgan Chen, Sam Rivera', members: ['you', 'morgan', 'sam'], unread: 0 });
    rooms.push(group);
    expect(resolveDirectConversation(rooms, people, ['sam', 'morgan'])).toBe(group);
    expect(resolveDirectConversation(rooms, people, ['sam'])).not.toBe(group);
    expect(resolveDirectConversation(rooms, people, ['sam', 'morgan', 'jules'], { id: 'other-group' }).id).toBe('other-group');
    expect(resolveDirectConversation(rooms, people, ['taylor'])).toMatchObject({ id: 'dm-taylor', type: 'direct', members: ['you', 'taylor'] });
    expect(resolveDirectConversation(rooms, people, [])).toBeUndefined();
    expect(resolveDirectConversation(rooms, people, ['you'])).toBeUndefined();
    expect(resolveDirectConversation(rooms, people, ['morgan', 'missing'])).toBeUndefined();
    expect(rooms).toHaveLength(conversations.length + 1);
  });
  it('edits only non-empty own messages while keeping metadata and references', () => {
    const messages = structuredClone(initialMessages);
    const own = findChatMessage(messages, 'design-4');
    const before = structuredClone(own);
    expect(editOwnChatMessage(own, '  **Updated**\n- A detail  ', new Date('2026-10-09T10:00:00Z'))).toBe(true);
    expect(own).toEqual({ ...before, text: '**Updated**\n- A detail', editedAt: '2026-10-09T10:00:00.000Z' });
    const updated = structuredClone(own);
    expect(editOwnChatMessage(own, ' \n ')).toBe(false);
    expect(editOwnChatMessage(own, 'a'.repeat(4001))).toBe(false);
    expect(editOwnChatMessage(own, own.text)).toBe(true);
    expect(own).toEqual(updated);
    expect(editOwnChatMessage(messages[0], 'not yours')).toBe(false);
    expect(messages[0]).toEqual(initialMessages[0]);
    expect(editOwnChatMessage(undefined, 'missing')).toBe(false);
  });

  it('renames group conversations without changing their identity, members or recipient matching', () => {
    const rooms = structuredClone(conversations);
    const group = resolveDirectConversation(rooms, people, ['morgan', 'sam'], { id: 'renamed-group' });
    rooms.push(group);
    const before = structuredClone(group);
    expect(renameGroupConversation(group, '  Release   planning\nteam  ')).toBe(true);
    expect(group).toEqual({ ...before, name: 'Release planning team' });
    expect(resolveDirectConversation(rooms, people, ['sam', 'morgan'])).toBe(group);
    expect(renameGroupConversation(group, 'a'.repeat(80))).toBe(true);
    expect(renameGroupConversation(group, 'a'.repeat(81))).toBe(false);
    expect(renameGroupConversation(group, ' \n ')).toBe(false);
    expect(renameGroupConversation(group, undefined)).toBe(false);
    expect(renameGroupConversation(undefined, 'Missing')).toBe(false);
    for (const room of rooms.filter((entry) => entry.type !== 'group')) {
      const previous = room.name;
      expect(renameGroupConversation(room, 'Not a group')).toBe(false);
      expect(room.name).toBe(previous);
    }
  });

  it('updates About fields without changing room identity, membership, or message references', () => {
    const channel = structuredClone(conversations.find((entry) => entry.type === 'channel'));
    const before = structuredClone(channel);
    expect(updateChatConversation(channel, 'name', '  Design   team ')).toBe(true);
    expect(updateChatConversation(channel, 'topic', '  Shipping together\nEvery Friday  ')).toBe(true);
    expect(updateChatConversation(channel, 'description', '  Updated description  ')).toBe(true);
    expect(channel).toEqual({ ...before, name: 'Design team', topic: 'Shipping together\nEvery Friday', description: 'Updated description' });
    expect(updateChatConversation(channel, 'topic', '   ')).toBe(true);
    expect(channel.topic).toBe('');
    const updated = structuredClone(channel);
    for (const [field, value] of [
      ['name', ''],
      ['name', 'a'.repeat(81)],
      ['topic', 'a'.repeat(251)],
      ['description', 'a'.repeat(251)],
      ['members', 'changed'],
      ['topic', undefined]
    ]) {
      expect(updateChatConversation(channel, field, value)).toBe(false);
      expect(channel).toEqual(updated);
    }
    expect(updateChatConversation({ type: 'direct' }, 'topic', 'No')).toBe(false);
    expect(updateChatConversation(undefined, 'name', 'No')).toBe(false);
    const group = { type: 'group' };
    expect(updateChatConversation(group, 'topic', 'a'.repeat(250))).toBe(true);
    expect(updateChatConversation(group, 'description', 'No')).toBe(false);
  });

  it('toggles pins independently of author, saved state, content and reply references', () => {
    for (const author of ['you', 'morgan']) {
      const message = { id: 'pin-example', author, text: 'Keep this', saved: true, replyToId: 'original', reactions: [] };
      const before = structuredClone(message);
      expect(toggleChatPin(message)).toBe(true);
      expect(message).toEqual({ ...before, pinned: true });
      expect(toggleChatPin(message)).toBe(true);
      expect(message).toEqual({ ...before, pinned: false });
    }
    expect(toggleChatPin(undefined)).toBe(false);
  });

  it('deletes only own messages, leaving replies and forwarded copies intact', () => {
    const messages = structuredClone(initialMessages);
    const reply = { ...createChatMessage('A reply', { id: 'own-reply', replyToId: 'design-4' }), conversation: 'design-system' };
    const copy = createForwardedChatMessage(findChatMessage(messages, 'design-4'), 'dm-sam', { id: 'copy' });
    messages.push(reply, copy);
    const next = deleteOwnChatMessage(messages, 'design-4');
    expect(findChatMessage(next, 'design-4')).toBeUndefined();
    expect(findChatMessage(messages, 'design-4')).toBeDefined();
    expect(findChatMessage(next, reply.id)).toBe(reply);
    expect(findChatMessage(next, copy.id)).toBe(copy);
    expect(getChatMessageReference(next, reply)).toBeUndefined();
    expect(copy.text).toBe(findChatMessage(messages, 'design-4').text);
    expect(deleteOwnChatMessage(messages, 'design-1')).toBe(messages);
    expect(deleteOwnChatMessage(messages, 'missing')).toBe(messages);
  });
  const sections = [
    { title: 'Channels', items: [{ value: 'general', label: '# general', badge: 2 }] },
    {
      title: 'Direct messages',
      items: [
        { value: 'morgan', label: 'Morgan Chen', badge: 1 },
        { value: 'jules', label: 'Jules Martin' }
      ]
    }
  ];

  it('filters sidebar labels case-insensitively and removes empty groups', () => {
    expect(filterChatSidebarSections(sections, '  CHEN  morgan ')).toEqual([{ ...sections[1], items: [sections[1].items[0]] }]);
    expect(filterChatSidebarSections(sections, 'gen')).toEqual([sections[0]]);
    expect(filterChatSidebarSections(sections, 'missing')).toEqual([]);
  });

  it('restores every sidebar item when cleared without mutating groups or badges', () => {
    const original = structuredClone(sections);
    filterChatSidebarSections(sections, 'jules');
    expect(sections).toEqual(original);
    expect(filterChatSidebarSections(sections, ' \t ')).toBe(sections);
    expect(filterChatSidebarSections(sections, 'morgan')[0].items[0]).toBe(sections[1].items[0]);
  });

  it('has valid conversations, authors and unique message identifiers', () => {
    const messages = initialMessages;
    expect(new Set(messages.map((message) => message.id)).size).toBe(messages.length);
    for (const message of messages) {
      expect(people[message.author]).toBeDefined();
      expect(presenceLabels[people[message.author].presence]).toBeDefined();
      expect(conversations.some((room) => room.id === message.conversation)).toBe(true);
      if (message.replyToId || message.forwardOfId) expect(getChatMessageReference(messages, message)).toBeDefined();
    }
  });

  it('seeds a populated workspace with varied people, channels, private messages and named groups', () => {
    expect(Object.keys(people)).toHaveLength(16);
    expect(conversations.filter((room) => room.type === 'channel')).toHaveLength(10);
    expect(conversations.filter((room) => room.type === 'direct')).toHaveLength(8);
    expect(conversations.filter((room) => room.type === 'group')).toHaveLength(3);
    expect(initialMessages).toHaveLength(58);
    expect(new Set(conversations.map((room) => room.id)).size).toBe(conversations.length);
    for (const room of conversations) {
      expect(room.members).toContain('you');
      expect(new Set(room.members).size).toBe(room.members.length);
      for (const member of room.members) expect(people[member]).toBeDefined();
      const history = initialMessages.filter((message) => message.conversation === room.id);
      expect(history.length).toBeGreaterThan(0);
      expect(room.unread).toBeLessThanOrEqual(history.filter((message) => message.author !== 'you').length);
      for (const message of history) {
        expect(room.members).toContain(message.author);
        expect(Number.isFinite(Date.parse(message.createdAt))).toBe(true);
        if (message.replyToId) expect(findChatMessage(initialMessages, message.replyToId).conversation).toBe(room.id);
      }
    }
    expect(conversations.some((room) => room.type === 'group' && room.name === 'Launch crew')).toBe(true);
    expect(initialMessages.some((message) => message.text.includes('@Alex Johnson'))).toBe(true);
    expect(initialMessages.some((message) => message.text.includes('\n- '))).toBe(true);
  });

  it('keeps replies in the main conversation with references to the exact original', () => {
    const messages = structuredClone(initialMessages);
    const reply = findChatMessage(messages, 'reply-1');
    expect(reply).toBe(messages.find((message) => message.id === 'reply-1'));
    expect(reply.conversation).toBe('design-system');
    expect(getChatMessageReference(messages, reply)).toBe(messages[0]);
    expect(getChatMessageReference(messages, findChatMessage(messages, 'reply-2'))).toBe(reply);
    reply.saved = true;
    const saved = messages.filter((message) => message.saved);
    expect(saved.find((message) => message.id === reply.id)).toMatchObject({ conversation: 'design-system', replyToId: 'design-1' });
    reply.saved = false;
    expect(messages.filter((message) => message.saved).some((message) => message.id === reply.id)).toBe(false);
  });

  it('toggles a reaction without duplicating it or losing other users', () => {
    const message = { reactions: [{ emoji: '👍', count: 3, active: false }] };
    toggleChatReaction(message, '👍');
    expect(message.reactions).toEqual([{ emoji: '👍', count: 4, active: true }]);
    toggleChatReaction(message, '👍');
    expect(message.reactions).toEqual([{ emoji: '👍', count: 3, active: false }]);
    toggleChatReaction(message, '✨');
    toggleChatReaction(message, '✨');
    expect(message.reactions).toEqual([{ emoji: '👍', count: 3, active: false }]);
  });

  it('creates messages with trimmed content and rejects empty drafts', () => {
    expect(createChatMessage(' \n ')).toBeUndefined();
    const message = createChatMessage('  First line\nSecond line  ', { id: 'new-message', now: new Date('2026-10-08T10:00:00Z') });
    expect(message).toMatchObject({ id: 'new-message', author: 'you', text: 'First line\nSecond line', reactions: [] });
    expect(message.time).toMatch(/^\d{2}:\d{2}$/);
  });

  it('creates an inline reply without modifying its source', () => {
    const source = structuredClone(initialMessages[0]);
    const reply = createChatMessage('  Thanks!  ', { id: 'new-reply', replyToId: source.id });
    expect(reply).toMatchObject({ id: 'new-reply', text: 'Thanks!', replyToId: source.id });
    expect(source).toEqual(initialMessages[0]);
    expect(createChatMessage('normal message')).not.toHaveProperty('replyToId');
    expect(createChatMessage(' ', { replyToId: source.id })).toBeUndefined();
  });

  it('forwards a fresh message to another conversation while preserving its original author, text and code', () => {
    const source = initialMessages.find((message) => message.id === 'design-2');
    const forwarded = createForwardedChatMessage(source, 'dm-jules', { id: 'forwarded' });
    expect(forwarded).toMatchObject({ id: 'forwarded', author: 'you', conversation: 'dm-jules', forwardOfId: source.id, text: source.text, code: source.code, reactions: [] });
    expect(forwarded).not.toHaveProperty('saved');
    expect(forwarded).not.toHaveProperty('pinned');
    expect(getChatMessageReference(initialMessages, forwarded)).toBe(source);
    expect(source.author).toBe('sam');
    expect(createForwardedChatMessage(undefined, 'dm-jules')).toBeUndefined();
    expect(createForwardedChatMessage(source, '')).toBeUndefined();
  });

  it('preserves original attribution when forwarding a previously forwarded message', () => {
    const forwarded = initialMessages.find((message) => message.id === 'forward-1');
    const next = createForwardedChatMessage(forwarded, 'dm-jules', { id: 'forward-again' });
    expect(next.forwardOfId).toBe('design-2');
    expect(getChatMessageReference(initialMessages, next).author).toBe('sam');
  });

  it('handles an unavailable original without resolving to an unrelated message', () => {
    expect(getChatMessageReference(initialMessages, { replyToId: 'deleted' })).toBeUndefined();
    expect(getChatMessageReference(initialMessages, { forwardOfId: 'deleted' })).toBeUndefined();
    expect(getChatMessageReference(initialMessages, { id: 'plain' })).toBeUndefined();
  });
});
