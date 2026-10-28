const requirementLine = /^\s*\|([^|]+)\|\s*(?:\(([^)]*)\))?\s*(.*)$/m;
const issueListItem = /^\s+[*+-]\s+#(\d+)\b/;
const commentOverride = /^\s*([A-Za-z0-9_.-]+):\s*(.+)$/;

const parseEstimate = (value, unit = 'PW') => {
  const amount = Number.parseFloat(value) || 0;
  if (unit.toUpperCase() === 'PM') return amount * 4;
  if (unit.toUpperCase() === 'PD') return amount / 5;
  if (unit.toLowerCase() === 'h') return amount / 40;
  return amount;
};

const parseRequirement = (id, rawStatus, rawBody) => {
  const name = rawBody.match(/\{(?![?!])\s*([^{}]+?)\s*\}/)?.[1];
  const comment = rawBody.match(/\{\?\s*([\s\S]*?)\s*\?\}/)?.[1];
  const remark = rawBody.match(/\{!\s*([\s\S]*?)\s*!\}/)?.[1];
  const estimateMatch = rawBody.match(/\[([\d.]+)\s*(PW|PM|PD|h)?\]/i);
  const issues = [...rawBody.matchAll(/#(\d+)\b/g)].map((match) => match[1]);
  const variants = [...rawBody.matchAll(/<([^<>]+--[^<>]+)>/g)].map((match) => match[1]);
  const links = [...rawBody.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map((match) => ({ label: match[1], href: match[2] }));
  const description = rawBody
    .replace(/\{(?![?!])\s*[^{}]+?\s*\}/, ' ')
    .replace(/\{\?\s*[\s\S]*?\s*\?\}/, ' ')
    .replace(/\{!\s*[\s\S]*?\s*!\}/, ' ')
    .replace(/\[[\d.]+\s*(?:PW|PM|PD|h)?\]/i, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/#\d+\b/g, ' ')
    .replace(/<[^<>]+--[^<>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    id: id.trim(),
    title: name?.trim() || id.trim(),
    description,
    status: rawStatus.trim() || 'none',
    estimate: estimateMatch ? parseEstimate(estimateMatch[1], estimateMatch[2]) : 0,
    issues,
    issueCount: issues.length,
    links,
    notes: [comment && { type: 'comment', text: comment.trim() }, remark && { type: 'remark', text: remark.trim() }].filter(Boolean),
    blockedBy: [],
    variants
  };
};

const groupRequirements = (items, byId) => {
  const groups = [];
  const groupByPrefix = new Map();
  for (const item of items) {
    const [prefix] = item.id.split('.');
    let group = groupByPrefix.get(prefix);
    if (!group) {
      const explicitGroup = byId.get(prefix);
      group = explicitGroup
        ? { ...explicitGroup, children: [] }
        : { id: prefix, title: prefix, description: '', status: 'none', estimate: 0, issues: [], issueCount: 0, links: [], notes: [], blockedBy: [], variants: [], children: [] };
      groupByPrefix.set(prefix, group);
      groups.push(group);
    }
    if (item.id === prefix) continue;
    item.depth = Math.max(item.id.split('.').length - 1, 1);
    group.children.push(item);
  }
  return groups;
};

export const parseRequirementsSource = (source) => {
  const document = source.replace(/^---\s*\n[\s\S]*?\n---\s*/, '');
  const descriptionLines = [];
  const items = [];
  const byId = new Map();
  let currentItem;

  for (const rawLine of document.split('\n')) {
    const definition = rawLine.match(requirementLine);
    if (definition) {
      currentItem = parseRequirement(definition[1], definition[2] ?? 'none', definition[3]);
      items.push(currentItem);
      byId.set(currentItem.id, currentItem);
      continue;
    }
    const listedIssue = rawLine.match(issueListItem);
    if (listedIssue && currentItem) {
      if (!currentItem.issues.includes(listedIssue[1])) currentItem.issues.push(listedIssue[1]);
      currentItem.issueCount = currentItem.issues.length;
      continue;
    }
    const override = rawLine.match(commentOverride);
    if (override && byId.has(override[1])) {
      const target = byId.get(override[1]);
      target.notes = [...target.notes.filter((note) => note.type !== 'comment'), { type: 'comment', text: override[2].trim() }];
      continue;
    }
    descriptionLines.push(rawLine);
    if (rawLine.trim()) currentItem = undefined;
  }

  const description = descriptionLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { description, requirements: groupRequirements(items, byId) };
};
