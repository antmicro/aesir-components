export const ESTIMATE_UNITS = {
  hours: { label: 'Person Hours', suffix: 'h', factor: 40, precision: 1, icon: 'clock-3' },
  days: { label: 'Person Days', suffix: 'PD', factor: 5, precision: 3, icon: 'sun' },
  weeks: { label: 'Person Weeks', suffix: 'PW', factor: 1, precision: 3, icon: 'calendar-range' },
  months: { label: 'Person Months', suffix: 'PM', factor: 0.25, precision: 3, icon: 'calendar' }
};

const stableIndex = (value, length) => {
  if (!length) throw new Error('At least one option is required');
  return [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0) % length;
};

export const requirementAssignee = (item, assignees) => assignees[stableIndex(item.id, assignees.length)];

export const buildRequirementTree = (items) => {
  const roots = [];
  const parents = [];
  items.forEach((item, index) => {
    const depth = Math.max(item.depth ?? 1, 1);
    const node = { item, index, children: [] };
    const parent = parents[depth - 2];
    if (parent) parent.children.push(node);
    else roots.push(node);
    parents[depth - 1] = node;
    parents.length = depth;
  });
  return roots;
};

export const formatEstimate = (personWeeks, unitName) => {
  const unit = ESTIMATE_UNITS[unitName];
  if (!unit) throw new Error(`Unknown estimate unit: ${unitName}`);
  return `${Number((personWeeks * unit.factor).toFixed(unit.precision))} ${unit.suffix}`;
};

export const totalEstimate = (requirements, excludeTerminal = false) =>
  requirements
    .flatMap((group) => (group.children.length ? group.children : [group]))
    .filter((item) => !excludeTerminal || (item.status !== 'done' && item.status !== 'rejected'))
    .reduce((total, item) => total + item.estimate, 0);

const matchesQuery = (item, query) => !query || [item.id, item.title, item.description, ...item.issues].some((value) => String(value).toLowerCase().includes(query));

const matchesRequirement = (item, filters, assignees) => {
  const assignee = requirementAssignee(item, assignees);
  const matchesStatus = !filters.statuses.length || filters.statuses.includes(item.status);
  const matchesAssignee = !filters.assignees.length || filters.assignees.includes(assignee.value);
  const matchesClosed = filters.showClosed || item.status !== 'done';
  const matchesAssignedIssues = !filters.assignedIssuesOnly || (item.issues.length > 0 && assignee.value !== 'unassigned');
  return matchesQuery(item, filters.query) && matchesStatus && matchesAssignee && matchesClosed && matchesAssignedIssues;
};

const compareRequirements = (a, b, sortBy, statusMeta) => {
  if (sortBy === 'manual') return 0;
  if (sortBy === 'estimate') return b.estimate - a.estimate;
  if (sortBy === 'status') return statusMeta[a.status].order - statusMeta[b.status].order;
  return a[sortBy].localeCompare(b[sortBy]);
};

export const filterRequirementGroups = (requirements, filters, assignees, statusMeta) =>
  requirements
    .map((group) => {
      if (filters.groups.length && !filters.groups.includes(group.id)) return null;
      const selected = new Set();
      const otherFilters = { ...filters, query: '' };
      const visit = (nodes, parentMatches) => {
        let hasMatch = false;
        for (const node of nodes) {
          const matched = parentMatches || matchesQuery(node.item, filters.query);
          const descendantMatches = visit(node.children, matched);
          const ownMatch = matched && matchesRequirement(node.item, otherFilters, assignees);
          if (ownMatch || (filters.query && descendantMatches)) {
            selected.add(node.item.id);
            hasMatch = true;
          }
        }
        return hasMatch;
      };
      const sourceTree = buildRequirementTree(group.children);
      visit(sourceTree, matchesQuery(group, filters.query));
      const collect = (nodes) =>
        nodes.toSorted((a, b) => compareRequirements(a.item, b.item, filters.sortBy, statusMeta)).flatMap((node) => [...(selected.has(node.item.id) ? [node.item] : []), ...collect(node.children)]);
      const children = collect(sourceTree);
      return {
        ...group,
        children,
        childTree: buildRequirementTree(children),
        matchesCurrentView: matchesRequirement(group, filters, assignees)
      };
    })
    .filter((group) => group && (group.matchesCurrentView || group.children.length));

export const findRequirement = (requirements, id) => requirements.flatMap((group) => [group, ...group.children]).find((item) => item.id === id);

export const requirementHours = (item) => Math.round(item.estimate * 80) / 2;

const requirementIssueIds = (item) => {
  const total = item.issueCount ?? item.issues.length;
  const seed = [...item.id].reduce((sum, character) => sum + character.charCodeAt(0), 0) * 100;
  const generated = Array.from({ length: Math.max(total - item.issues.length, 0) }, (_, index) => String(200000 + seed + index));
  return [...item.issues, ...generated];
};

export const requirementTasks = (item, assignees, titles) => {
  const issueIds = requirementIssueIds(item);
  const availableAssignees = assignees.filter((assignee) => assignee.value !== 'unassigned');
  if (!availableAssignees.length || !titles.length) throw new Error('Task generation requires assignees and titles');
  const totalHalfHours = Math.round(requirementHours(item) * 2);
  const baseHalfHours = Math.floor(totalHalfHours / (issueIds.length || 1));
  const remainder = totalHalfHours % (issueIds.length || 1);
  const statuses = [
    { key: 'in-progress', label: 'In progress', icon: 'circle-dot' },
    { key: 'todo', label: 'Todo', icon: 'circle' },
    { key: 'in-review', label: 'In review', icon: 'scan-eye' },
    { key: 'done', label: 'Done', icon: 'check' }
  ];

  return issueIds.map((issue, index) => {
    const number = Number(issue);
    const status = statuses[number % statuses.length];
    const assignee = availableAssignees[number % availableAssignees.length].label;
    const taskHalfHours = baseHalfHours + (index < remainder ? 1 : 0);
    return {
      id: `#${issue}`,
      title: titles[number % titles.length],
      status,
      closed: status.key === 'done',
      assignee,
      initials: assignee
        .split(' ')
        .map((part) => part[0])
        .join(''),
      hours: taskHalfHours / 2
    };
  });
};

export const taskGroups = (item, assignees, titles) => {
  const tasks = requirementTasks(item, assignees, titles);
  return [
    { label: 'Open', tasks: tasks.filter((task) => !task.closed) },
    { label: 'Closed', tasks: tasks.filter((task) => task.closed) }
  ];
};

export const requirementTaskCounts = (item, assignees, titles) => {
  const tasks = requirementTasks(item, assignees, titles);
  const closed = tasks.filter((task) => task.closed).length;
  return { open: tasks.length - closed, closed };
};

export const groupTasks = (group, assignees, titles) => [group, ...group.children].flatMap((item) => requirementTasks(item, assignees, titles));

export const groupTaskCounts = (group, assignees, titles) =>
  [group, ...group.children].reduce(
    (totals, item) => {
      const counts = requirementTaskCounts(item, assignees, titles);
      return { open: totals.open + counts.open, closed: totals.closed + counts.closed };
    },
    { open: 0, closed: 0 }
  );

const diffOperations = (beforeLines, afterLines) => {
  const lengths = Array.from({ length: beforeLines.length + 1 }, () => Array(afterLines.length + 1).fill(0));
  for (let beforeIndex = beforeLines.length - 1; beforeIndex >= 0; beforeIndex -= 1) {
    for (let afterIndex = afterLines.length - 1; afterIndex >= 0; afterIndex -= 1) {
      lengths[beforeIndex][afterIndex] =
        beforeLines[beforeIndex] === afterLines[afterIndex] ? lengths[beforeIndex + 1][afterIndex + 1] + 1 : Math.max(lengths[beforeIndex + 1][afterIndex], lengths[beforeIndex][afterIndex + 1]);
    }
  }

  const operations = [];
  let beforeIndex = 0;
  let afterIndex = 0;
  let oldLine = 1;
  let newLine = 1;
  while (beforeIndex < beforeLines.length || afterIndex < afterLines.length) {
    if (beforeIndex < beforeLines.length && afterIndex < afterLines.length && beforeLines[beforeIndex] === afterLines[afterIndex]) {
      operations.push({ type: 'context', text: beforeLines[beforeIndex], oldLine, newLine });
      beforeIndex += 1;
      afterIndex += 1;
      oldLine += 1;
      newLine += 1;
    } else if (afterIndex < afterLines.length && (beforeIndex === beforeLines.length || lengths[beforeIndex][afterIndex + 1] > lengths[beforeIndex + 1][afterIndex])) {
      operations.push({ type: 'added', text: afterLines[afterIndex], newLine });
      afterIndex += 1;
      newLine += 1;
    } else {
      operations.push({ type: 'removed', text: beforeLines[beforeIndex], oldLine });
      beforeIndex += 1;
      oldLine += 1;
    }
  }
  return operations;
};

export const createLineDiff = (before, after, contextSize = 2) => {
  if (before === after) return [];
  const operations = diffOperations(before.split('\n'), after.split('\n'));
  const changedIndexes = operations.flatMap((operation, index) => (operation.type === 'context' ? [] : [index]));
  const visibleIndexes = new Set(
    changedIndexes.flatMap((index) => Array.from({ length: contextSize * 2 + 1 }, (_, offset) => index - contextSize + offset)).filter((index) => index >= 0 && index < operations.length)
  );
  const compact = [];
  let previousIndex = -2;
  for (const index of [...visibleIndexes].sort((a, b) => a - b)) {
    if (compact.length && index > previousIndex + 1) compact.push({ type: 'separator' });
    compact.push(operations[index]);
    previousIndex = index;
  }
  return compact;
};
