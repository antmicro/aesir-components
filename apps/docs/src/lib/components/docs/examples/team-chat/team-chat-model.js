export const findChatMessage = (messages, id) => messages.find((message) => message.id === id);

export const getChatMessageReference = (messages, message) => findChatMessage(messages, message.forwardOfId ?? message.replyToId);

export function resolveDirectConversation(rooms, people, recipients, { id } = {}) {
  const others = [...new Set(recipients)].filter((entry) => entry !== 'you');
  if (!others.length || others.some((entry) => !people[entry])) return undefined;
  const members = ['you', ...others];
  const type = others.length === 1 ? 'direct' : 'group';
  const existing = rooms.find((room) => room.type === type && room.members.length === members.length && members.every((member) => room.members.includes(member)));
  return existing ?? { id: id ?? (type === 'direct' ? `dm-${others[0]}` : `group-${crypto.randomUUID()}`), name: others.map((entry) => people[entry].name).join(', '), type, members, unread: 0 };
}

export function renameGroupConversation(room, name) {
  return room?.type === 'group' && updateChatConversation(room, 'name', name);
}

export function updateChatConversation(room, field, value) {
  if (!['channel', 'group'].includes(room?.type) || typeof value !== 'string') return false;
  if (!['name', 'topic', 'description'].includes(field) || (field === 'description' && room.type !== 'channel')) return false;
  const next = field === 'name' ? value.trim().replace(/\s+/g, ' ') : value.trim();
  if (field === 'name' ? !next || next.length > 80 : next.length > 250) return false;
  room[field] = next;
  return true;
}

export function editOwnChatMessage(message, text, now = new Date()) {
  if (!message || message.author !== 'you' || !text.trim() || text.trim().length > 4000) return false;
  const next = text.trim();
  if (message.text !== next) {
    message.text = next;
    message.editedAt = now.toISOString();
  }
  return true;
}

export function deleteOwnChatMessage(messages, id) {
  const message = findChatMessage(messages, id);
  if (!message || message.author !== 'you') return messages;
  return messages.filter((entry) => entry.id !== id);
}

export function filterChatSidebarSections(sections, query) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return sections;
  return sections
    .map((section) => ({ ...section, items: section.items.filter((item) => terms.every((term) => item.label.toLocaleLowerCase().includes(term))) }))
    .filter((section) => section.items.length);
}

export function toggleChatReaction(message, emoji) {
  const reaction = message.reactions.find((entry) => entry.emoji === emoji);
  if (!reaction) message.reactions.push({ emoji, count: 1, active: true });
  else {
    reaction.count += reaction.active ? -1 : 1;
    reaction.active = !reaction.active;
    if (!reaction.count) message.reactions = message.reactions.filter((entry) => entry !== reaction);
  }
}

export function toggleChatPin(message) {
  if (!message) return false;
  message.pinned = !message.pinned;
  return true;
}

export function createChatMessage(text, { id, now = new Date(), replyToId } = {}) {
  if (!text.trim()) return undefined;
  return {
    id: id ?? crypto.randomUUID(),
    author: 'you',
    time: new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now),
    createdAt: now.toISOString(),
    text: text.trim(),
    reactions: [],
    ...(replyToId ? { replyToId } : {})
  };
}

export function createForwardedChatMessage(source, conversation, options) {
  if (!source || !conversation) return undefined;
  const message = createChatMessage(source.text, options);
  if (!message) return undefined;
  return { ...message, conversation, forwardOfId: source.forwardOfId ?? source.id, ...(source.code ? { code: source.code } : {}) };
}
