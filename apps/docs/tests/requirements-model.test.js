import { describe, expect, test } from 'vitest';
import {
  buildRequirementTree,
  createLineDiff,
  filterRequirementGroups,
  formatEstimate,
  requirementTasks,
  totalEstimate
} from '../src/lib/components/docs/examples/requirements-explorer/requirements-model.js';

const assignees = [
  { value: 'assigned', label: 'Assigned Person' },
  { value: 'unassigned', label: 'No assignee' }
];
const statusMeta = {
  wip: { order: 0 },
  done: { order: 1 },
  rejected: { order: 2 }
};
const requirement = (id, status, estimate, issues = []) => ({ id, title: id, description: '', status, estimate, issues, issueCount: issues.length });

describe('requirements explorer model', () => {
  test('formats estimates in each supported unit', () => {
    expect(formatEstimate(1, 'hours')).toBe('40 h');
    expect(formatEstimate(1, 'days')).toBe('5 PD');
    expect(formatEstimate(1, 'weeks')).toBe('1 PW');
    expect(formatEstimate(4, 'months')).toBe('1 PM');
  });

  test('formats fractional person-days with at most three decimal places', () => {
    expect(formatEstimate(0.063, 'days')).toBe('0.315 PD');
    expect(formatEstimate(0.688, 'days')).toBe('3.44 PD');
    expect(formatEstimate(0, 'days')).toBe('0 PD');
  });

  test('totals leaf requirements without double-counting group estimates', () => {
    const groups = [
      { ...requirement('Q1', 'wip', 3), children: [requirement('Q1.A', 'wip', 1), requirement('Q1.B', 'done', 2)] },
      { ...requirement('Backlog', 'rejected', 4), children: [] }
    ];

    expect(totalEstimate(groups)).toBe(7);
    expect(totalEstimate(groups, true)).toBe(1);
  });

  test('applies closed and assigned-issue filters consistently to groups and children', () => {
    const groups = [
      {
        ...requirement('Q1', 'wip', 2, ['1']),
        children: [requirement('Q1.OPEN', 'wip', 1, ['2']), requirement('Q1.CLOSED', 'done', 1, ['3'])]
      }
    ];
    const filters = {
      query: '',
      statuses: [],
      assignees: [],
      groups: [],
      showClosed: false,
      assignedIssuesOnly: false,
      sortBy: 'manual'
    };

    const [group] = filterRequirementGroups(groups, filters, assignees, statusMeta);
    expect(group.children.map((item) => item.id)).toEqual(['Q1.OPEN']);

    const assignedOnly = filterRequirementGroups([{ ...requirement('Q2', 'wip', 1, ['4']), children: [] }], { ...filters, assignedIssuesOnly: true }, assignees, statusMeta);
    expect(assignedOnly).toEqual([]);
  });

  test('builds nested tree levels from requirement depth', () => {
    const items = [
      { ...requirement('Q2.A', 'wip', 1), depth: 1 },
      { ...requirement('Q2.A.1', 'wip', 1), depth: 2 },
      { ...requirement('Q2.A.1.a', 'wip', 1), depth: 3 }
    ];

    const tree = buildRequirementTree(items);
    expect(tree[0].children[0].children[0].item.id).toBe('Q2.A.1.a');
  });

  test('search includes all descendants of a matching parent without including siblings', () => {
    const groups = [
      {
        ...requirement('Q2', 'wip', 0),
        children: [
          { ...requirement('Q2.A', 'wip', 1), title: 'Overlay primitives', depth: 1 },
          { ...requirement('Q2.A.1', 'wip', 1), depth: 2 },
          { ...requirement('Q2.A.1.1', 'wip', 1), depth: 3 },
          { ...requirement('Q2.A.2', 'done', 1), depth: 2 },
          { ...requirement('Q2.B', 'wip', 1), depth: 1 }
        ]
      }
    ];
    const filters = { query: 'primitives', statuses: [], assignees: [], groups: [], showClosed: true, assignedIssuesOnly: false, sortBy: 'manual' };
    expect(filterRequirementGroups(groups, filters, assignees, statusMeta)[0].children.map((item) => item.id)).toEqual(['Q2.A', 'Q2.A.1', 'Q2.A.1.1', 'Q2.A.2']);
    expect(filterRequirementGroups(groups, { ...filters, showClosed: false }, assignees, statusMeta)[0].children.map((item) => item.id)).toEqual(['Q2.A', 'Q2.A.1', 'Q2.A.1.1']);
    expect(filterRequirementGroups(groups, { ...filters, query: 'q2' }, assignees, statusMeta)[0].children).toHaveLength(5);
  });

  test('search preserves the complete ancestor chain of a deep match', () => {
    const groups = [
      {
        ...requirement('Q2', 'wip', 0),
        children: [
          { ...requirement('Q2.A', 'done', 1), depth: 1 },
          { ...requirement('Q2.A.1', 'wip', 1), depth: 2 },
          { ...requirement('Q2.A.1.1', 'wip', 1), title: 'Needle', depth: 3 },
          { ...requirement('Q2.A.2', 'wip', 1), depth: 2 },
          { ...requirement('Q2.B', 'wip', 1), depth: 1 }
        ]
      }
    ];
    const filters = { query: 'needle', statuses: [], assignees: [], groups: [], showClosed: false, assignedIssuesOnly: false, sortBy: 'manual' };
    const [group] = filterRequirementGroups(groups, filters, assignees, statusMeta);
    expect(group.children.map((item) => item.id)).toEqual(['Q2.A', 'Q2.A.1', 'Q2.A.1.1']);
    expect(group.childTree[0].children[0].children[0].item.title).toBe('Needle');
    const [sortedGroup] = filterRequirementGroups(groups, { ...filters, sortBy: 'title' }, assignees, statusMeta);
    expect(sortedGroup.childTree[0].children[0].children[0].item.title).toBe('Needle');
    expect(filterRequirementGroups(groups, { ...filters, query: '' }, assignees, statusMeta)[0].children.map((item) => item.id)).not.toContain('Q2.A');
    expect(filterRequirementGroups(groups, { ...filters, query: 'missing' }, assignees, statusMeta)).toEqual([]);
  });

  test('distributes requirement hours across generated tasks without losing time', () => {
    const tasks = requirementTasks(requirement('Q3.ITEM', 'wip', 1, ['101', '102', '103']), assignees, ['Task']);
    expect(tasks.map((task) => Number.parseFloat(task.hours)).reduce((sum, hours) => sum + hours, 0)).toBe(40);
    expect(tasks.every((task) => Number.parseFloat(task.hours) % 0.5 === 0)).toBe(true);
  });

  test('creates a compact line diff with line numbers and context', () => {
    const diff = createLineDiff('one\ntwo\nthree\nfour\nfive\nsix', 'one\ntwo changed\nthree\nfour\nfive\nsix added', 1);

    expect(diff).toEqual([
      { type: 'context', text: 'one', oldLine: 1, newLine: 1 },
      { type: 'removed', text: 'two', oldLine: 2 },
      { type: 'added', text: 'two changed', newLine: 2 },
      { type: 'context', text: 'three', oldLine: 3, newLine: 3 },
      { type: 'separator' },
      { type: 'context', text: 'five', oldLine: 5, newLine: 5 },
      { type: 'removed', text: 'six', oldLine: 6 },
      { type: 'added', text: 'six added', newLine: 6 }
    ]);
  });
});
