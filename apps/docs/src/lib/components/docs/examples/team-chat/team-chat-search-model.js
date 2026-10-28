const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function chatSearchParts(text, query) {
  const term = query.trim();
  if (!term) return [{ text, matched: false, start: 0 }];
  const parts = [];
  let start = 0;
  for (const match of text.matchAll(new RegExp(escapeRegExp(term), 'giu'))) {
    if (match.index > start) parts.push({ text: text.slice(start, match.index), matched: false, start });
    parts.push({ text: match[0], matched: true, start: match.index });
    start = match.index + match[0].length;
  }
  if (start < text.length || !parts.length) parts.push({ text: text.slice(start), matched: false, start });
  return parts;
}

export function chatSearchPreview(text, query, limit = 180) {
  const match = chatSearchParts(text, query).find((part) => part.matched);
  const start = match ? Math.max(0, match.start - 48) : 0;
  const end = Math.min(text.length, start + Math.max(limit, (match?.text.length ?? 0) + 48));
  return `${start ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}
