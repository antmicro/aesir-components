import { plainChatText } from './team-chat-formatting.js';
import { chatSearchPreview } from './team-chat-search-model.js';

export function latestChatMessage(messages, conversation) {
  return messages.findLast((message) => message.conversation === conversation);
}

export function sortMobileConversations(rooms, messages) {
  const recency = new Map(messages.map((message, index) => [message.conversation, Date.parse(message.createdAt) || index]));
  return rooms.toSorted((a, b) => (recency.get(b.id) ?? -1) - (recency.get(a.id) ?? -1));
}

export function mobileChatPeople(rooms, people, messages, mode = 'recent', limit = 8) {
  const contacts = new Map();
  const destinations = new Map();
  for (const room of rooms) {
    if (room.type !== 'direct' && room.type !== 'group') continue;
    const ids = [...new Set(room.members)].filter((id) => id !== 'you' && people[id]);
    destinations.set(room.id, { type: room.type, ids });
    for (const id of ids) if (!contacts.has(id)) contacts.set(id, { id, person: people[id], lastMessage: -1, frequency: 0 });
  }
  messages.forEach((message, index) => {
    const destination = destinations.get(message.conversation);
    if (!destination) return;
    const timestamp = Date.parse(message.createdAt);
    const recency = Number.isFinite(timestamp) ? timestamp : index;
    for (const id of destination.ids) {
      const contact = contacts.get(id);
      contact.lastMessage = Math.max(contact.lastMessage, recency);
      if (destination.type === 'direct' || message.author === 'you' || message.author === id) contact.frequency++;
    }
  });
  return [...contacts.values()]
    .toSorted((a, b) => (mode === 'frequent' ? b.frequency - a.frequency : 0) || b.lastMessage - a.lastMessage || a.person.name.localeCompare(b.person.name))
    .slice(0, limit);
}

export function mobileChatSearch(rooms, people, messages, query) {
  const term = query.trim().toLocaleLowerCase();
  const matches = (text) => text.toLocaleLowerCase().includes(term);
  if (!term)
    return [
      {
        label: 'Recent conversations',
        items: sortMobileConversations(rooms, messages)
          .slice(0, 8)
          .map((room) => ({ id: room.id, kind: 'room', room, label: room.name }))
      }
    ];
  return [
    {
      label: 'People',
      items: Object.entries(people)
        .filter(([id, person]) => id !== 'you' && matches(person.name))
        .map(([id, person]) => ({ id, kind: 'person', person, label: person.name }))
    },
    { label: 'Channels', items: rooms.filter((room) => room.type === 'channel' && matches(room.name)).map((room) => ({ id: room.id, kind: 'room', room, label: room.name })) },
    { label: 'Group messages', items: rooms.filter((room) => room.type === 'group' && matches(room.name)).map((room) => ({ id: room.id, kind: 'room', room, label: room.name })) },
    {
      label: 'Messages',
      items: messages
        .toReversed()
        .toSorted((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
        .filter((message) =>
          matches(`${plainChatText(message.text)} ${message.code ?? ''} ${people[message.author].name} ${rooms.find((room) => room.id === message.conversation)?.name ?? ''} ${message.time}`)
        )
        .map((message) => ({
          id: message.id,
          kind: 'message',
          message,
          person: people[message.author],
          room: rooms.find((room) => room.id === message.conversation),
          label: people[message.author].name,
          preview: chatSearchPreview(`${plainChatText(message.text)} ${message.code ?? ''}`, query)
        }))
    }
  ].filter((group) => group.items.length);
}

export function mobileChatActivity(rooms, messages) {
  const unreadIds = new Set(
    rooms.flatMap((room) =>
      room.unread
        ? messages
            .filter((message) => message.conversation === room.id && message.author !== 'you')
            .slice(-room.unread)
            .map((message) => message.id)
        : []
    )
  );
  return messages
    .toReversed()
    .toSorted((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
    .flatMap((message) => {
      const types = [];
      if (message.author !== 'you' && /@(?:Alex Johnson|you)\b/i.test(message.text)) types.push('mentions');
      if (message.author !== 'you' && message.replyToId) types.push('replies');
      if (message.reactions?.length) types.push('reactions');
      if (unreadIds.has(message.id)) types.push('unread');
      return types.length ? [{ message, types, unread: unreadIds.has(message.id) }] : [];
    });
}
