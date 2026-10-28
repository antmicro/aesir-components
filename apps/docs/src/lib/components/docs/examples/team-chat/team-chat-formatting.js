const marks = {
  bold: ['**', '**', 'bold text'],
  italic: ['_', '_', 'italic text'],
  underline: ['<u>', '</u>', 'underlined text'],
  strike: ['~~', '~~', 'struck text'],
  code: ['`', '`', 'code']
};

export function safeChatLink(value) {
  try {
    const url = new URL(value.trim());
    return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function formatChatSelection(value, start, end, format, href = '') {
  const selected = value.slice(start, end);
  let replacement, selectionStart, selectionEnd;
  if (marks[format] || format === 'link') {
    const url = format === 'link' ? safeChatLink(href) : undefined;
    if (format === 'link' && !url) return undefined;
    const [open, close, placeholder] = format === 'link' ? ['[', `](${url.replaceAll('(', '%28').replaceAll(')', '%29')})`, 'link text'] : marks[format];
    if (format !== 'link' && value.slice(start - open.length, start) === open && value.slice(end, end + close.length) === close) {
      return { value: value.slice(0, start - open.length) + selected + value.slice(end + close.length), start: start - open.length, end: end - open.length };
    }
    replacement = open + (selected || placeholder) + close;
    selectionStart = start + open.length;
    selectionEnd = selectionStart + (selected || placeholder).length;
  } else if (['bullet', 'ordered', 'quote', 'codeblock'].includes(format)) {
    start = start > 0 ? value.lastIndexOf('\n', start - 1) + 1 : 0;
    const nextLine = value.indexOf('\n', end > start && value[end - 1] === '\n' ? end - 1 : end);
    end = nextLine < 0 ? value.length : nextLine;
    const lines = value.slice(start, end).split('\n');
    if (format === 'codeblock') {
      const runs = value.slice(start, end).match(/`+/g) ?? [];
      const fence = '`'.repeat(Math.max(3, ...runs.map((run) => run.length + 1)));
      replacement = `${fence}\n${lines.join('\n') || 'code'}\n${fence}`;
      selectionStart = start + fence.length + 1;
      selectionEnd = start + replacement.length - fence.length - 1;
    } else {
      const prefix = format === 'bullet' ? /^- / : format === 'ordered' ? /^\d+\. / : /^> /;
      const removing = lines.every((line) => prefix.test(line));
      replacement = lines.map((line, index) => (removing ? line.replace(prefix, '') : `${format === 'bullet' ? '- ' : format === 'ordered' ? `${index + 1}. ` : '> '}${line}`)).join('\n');
      selectionStart = start;
      selectionEnd = start + replacement.length;
    }
  } else return undefined;
  return { value: value.slice(0, start) + replacement + value.slice(end), start: selectionStart, end: selectionEnd };
}

export function parseChatInline(text, depth = 0) {
  if (depth > 12) return [{ type: 'text', text }];
  const nodes = [];
  let plain = '';
  const flush = () => {
    if (plain) nodes.push({ type: 'text', text: plain });
    plain = '';
  };
  for (let i = 0; i < text.length; ) {
    if (text[i] === '\\' && /[\\*_~`[\]<>]/.test(text[i + 1] ?? '')) {
      plain += text[i + 1];
      i += 2;
      continue;
    }
    const link = text.slice(i).match(/^\[((?:\\.|[^\]\\\n])+)\]\(([^\s)]+)\)/);
    if (link && safeChatLink(link[2])) {
      flush();
      nodes.push({ type: 'link', href: safeChatLink(link[2]), children: parseChatInline(link[1], depth + 1) });
      i += link[0].length;
      continue;
    }
    const mark = Object.entries(marks).find(([, [open, close]]) => text.startsWith(open, i) && text.indexOf(close, i + open.length) > i + open.length);
    if (mark) {
      const [type, [open, close]] = mark;
      const end = text.indexOf(close, i + open.length);
      flush();
      const inner = text.slice(i + open.length, end);
      nodes.push(type === 'code' ? { type, text: inner } : { type, children: parseChatInline(inner, depth + 1) });
      i = end + close.length;
    } else plain += text[i++];
  }
  flush();
  return nodes;
}

const listLine = (line) => line.match(/^(-|\d+\.) (.*)$/);
const startsBlock = (line) => /^`{3,}/.test(line) || /^> ?/.test(line) || listLine(line);

export function parseChatText(text) {
  const lines = text.replaceAll('\r\n', '\n').split('\n');
  const blocks = [];
  for (let i = 0; i < lines.length; ) {
    if (!lines[i].trim()) {
      i++;
      continue;
    }
    const fence = lines[i].match(/^(`{3,})[\w-]*\s*$/);
    if (fence) {
      const content = [];
      i++;
      while (i < lines.length && !new RegExp(`^\x60{${fence[1].length},}\\s*$`).test(lines[i])) content.push(lines[i++]);
      if (i < lines.length) i++;
      blocks.push({ type: 'codeblock', text: content.join('\n') });
    } else if (listLine(lines[i])) {
      const ordered = listLine(lines[i])[1] !== '-';
      const start = ordered ? Number.parseInt(listLine(lines[i])[1], 10) : undefined;
      const items = [];
      while (i < lines.length && listLine(lines[i]) && (listLine(lines[i])[1] !== '-') === ordered) items.push(parseChatInline(listLine(lines[i++])[2]));
      blocks.push({ type: 'list', ordered, start, items });
    } else if (/^> ?/.test(lines[i])) {
      const content = [];
      while (i < lines.length && /^> ?/.test(lines[i])) content.push(lines[i++].replace(/^> ?/, ''));
      blocks.push({ type: 'quote', children: parseChatInline(content.join('\n')) });
    } else {
      const content = [lines[i++]];
      while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) content.push(lines[i++]);
      blocks.push({ type: 'paragraph', children: parseChatInline(content.join('\n')) });
    }
  }
  return blocks;
}

export function plainChatText(text) {
  const inline = (nodes) => nodes.map((node) => (node.children ? inline(node.children) : node.text)).join('');
  return parseChatText(text)
    .map((block) => (block.items ? block.items.map(inline).join('\n') : block.children ? inline(block.children) : block.text))
    .join('\n');
}
