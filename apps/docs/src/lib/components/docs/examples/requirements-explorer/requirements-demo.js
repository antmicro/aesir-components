import requirementsSource from './requirements.md?raw';
import { parseRequirementsSource } from './requirements-parser.js';
const initialDocument = parseRequirementsSource(requirementsSource);
// Illustrative document snapshots, not the project's real revision history.
const documentVersions = [
  { id: 'v3', label: 'v3', date: '2026-10-08', source: requirementsSource },
  {
    id: 'v2',
    label: 'v2',
    date: '2026-10-03',
    source: requirementsSource.replace('|Q3.DOCS| (none)', '|Q3.DOCS| (unknown)').replace('{Documentation refresh}', '{Documentation planning}')
  },
  {
    id: 'v1',
    label: 'v1',
    date: '2026-09-28',
    source: requirementsSource
      .replace('|Q3.COMPONENTS| (wip)', '|Q3.COMPONENTS| (unknown)')
      .replace('{Form controls}', '{Form control foundations}')
      .replace('|Q3.DOCS| (none)', '|Q3.DOCS| (unknown)')
      .replace('{Documentation refresh}', '{Documentation planning}')
  }
];
const saveReviewDiff = [
  { type: 'unchanged', oldLine: 18, newLine: 18, text: '## Current milestone' },
  { type: 'separator', oldLine: null, newLine: null, text: '' },
  { type: 'unchanged', oldLine: 24, newLine: 24, text: '|Q3.COMPONENTS| (wip) {Form controls}' },
  { type: 'removed', oldLine: 25, newLine: null, text: 'Complete component states and interaction coverage. [0.5PW] #106087' },
  { type: 'added', oldLine: null, newLine: 25, text: 'Complete component states, browser coverage, and usage documentation. [0.75PW] #106087' },
  { type: 'added', oldLine: null, newLine: 26, text: '  * #106214' },
  { type: 'unchanged', oldLine: 26, newLine: 27, text: '' }
];
const saveReviewChangedLines = saveReviewDiff.filter((line) => line.type === 'added' || line.type === 'removed').length;
const displayedDescription = initialDocument.description;
const projectName = displayedDescription.match(/^#\s+(.+)$/m)?.[1] ?? 'Requirements';
const assigneeOptions = [
  { value: 'john', label: 'John Doe', initials: 'JD', icon: 'user' },
  { value: 'jane', label: 'Jane Smith', initials: 'JS', icon: 'user' },
  { value: 'alex', label: 'Alex Johnson', initials: 'AJ', icon: 'user' },
  { value: 'unassigned', label: 'No assignee', initials: '', icon: 'circle-user-round' }
];
const unlinkedIssuesData = [
  { id: '106214', status: 'unknown', assignee: { name: 'John Doe', initials: 'JD' }, title: 'Add an empty state for component previews' },
  { id: '106087', status: 'wip', assignee: { name: 'Jane Smith', initials: 'JS' }, title: 'Preserve playground controls after navigation' },
  { id: '105944', status: 'problem', assignee: { name: 'Alex Johnson', initials: 'AJ' }, title: 'Resolve duplicate accessibility announcements' }
];
const taskTitles = ['Refine component behavior', 'Add interaction tests', 'Verify accessibility states', 'Update usage documentation'];
const exampleSidebarSections = [
  {
    items: [
      { value: 'overview', label: 'Overview', icon: 'layout-dashboard' },
      { value: 'devices', label: 'Devices', icon: 'monitor' },
      {
        value: 'requirements-section',
        label: 'Requirements',
        icon: 'clipboard-list',
        items: [
          {
            value: 'machine-ping-sow',
            label: 'Machine Ping Sow',
            icon: 'list-checks',
            items: [
              { value: 'requirements', label: 'Requirements' },
              { value: 'internal-meeting-notes', label: 'Internal meeting notes' },
              { value: 'test-document', label: 'Test document' }
            ]
          }
        ]
      }
    ]
  }
];
const descriptionBlocks = displayedDescription
  .trim()
  .split(/\n\s*\n/)
  .map((block) => {
    const heading = block.match(/^#{1,6}\s+(.+)$/);
    const list = /^[*-]\s+/.test(block);
    return {
      type: heading ? 'heading' : list ? 'list' : 'paragraph',
      content: heading?.[1] ?? (list ? block.split('\n').map((line) => line.replace(/^[*-]\s+/, '')) : block)
    };
  });
const statusMeta = {
  none: { label: 'No status', icon: 'circle', order: 0 },
  wip: { label: 'WIP', icon: 'circle-dot', order: 1 },
  mvp: { label: 'MVP', icon: 'sparkles', order: 2 },
  estimate: { label: 'Estimate', icon: 'clock-3', order: 3 },
  problem: { label: 'Problem', icon: 'alert-circle', order: 4 },
  done: { label: 'Done', icon: 'check', order: 5 },
  moved: { label: 'Moved', icon: 'move-right', order: 6 },
  rejected: { label: 'Rejected', icon: 'circle-x', order: 7 },
  unknown: { label: 'Unknown', icon: 'circle-question-mark', order: 8 }
};
for (const status of new Set(initialDocument.requirements.flatMap((group) => [group.status, ...group.children.map((item) => item.status)]))) {
  if (!statusMeta[status]) statusMeta[status] = { label: status.replaceAll('-', ' '), icon: 'circle-question-mark', order: Object.keys(statusMeta).length };
}
const filterOptions = Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label, icon: meta.icon }));
const sortOptions = [
  { value: 'manual', label: 'Manual order', icon: 'folder-tree' },
  { value: 'id', label: 'Identifier', icon: 'arrow-down' },
  { value: 'title', label: 'Title', icon: 'arrow-down' },
  { value: 'estimate', label: 'Estimate', icon: 'activity' },
  { value: 'status', label: 'Status', icon: 'circle-dot' }
];

export {
  initialDocument,
  documentVersions,
  saveReviewDiff,
  saveReviewChangedLines,
  displayedDescription,
  projectName,
  assigneeOptions,
  unlinkedIssuesData,
  taskTitles,
  exampleSidebarSections,
  descriptionBlocks,
  statusMeta,
  filterOptions,
  sortOptions
};
