import { describe, expect, it } from 'vitest';
import { searchCommandGroups } from '../src/components/aesir-command-menu/search.js';

const groups = [
  {
    label: 'Foundations',
    items: [
      { label: 'Colors', keywords: ['accordion button'] },
      { label: 'Icons', description: 'Button icons' }
    ]
  },
  { label: 'Components', items: [{ label: 'Alert', keywords: ['button'] }, { label: 'Accordion' }, { label: 'Button Group' }, { label: 'Button' }, { label: 'Icon Button' }] }
];
const labels = (query) => searchCommandGroups(groups, query).flatMap((group) => group.items.map((item) => item.label));

describe('searchCommandGroups', () => {
  it('places exact component names before content matches across categories', () => {
    expect(labels('accordion')).toEqual(['Accordion', 'Colors']);
    expect(labels('button')).toEqual(['Button', 'Button Group', 'Icon Button', 'Alert', 'Icons', 'Colors']);
  });

  it('ignores case and surrounding whitespace', () => {
    expect(labels('  BUTTON  ')).toEqual(labels('button'));
  });

  it('preserves the original groups and order for an empty query', () => {
    expect(searchCommandGroups(groups, '  ')).toBe(groups);
  });

  it('returns no groups for an unmatched query', () => {
    expect(searchCommandGroups(groups, 'not-a-component')).toEqual([]);
  });

  it('preserves group labels after filtering and ranks the best group first', () => {
    expect(searchCommandGroups(groups, 'button').map((group) => group.label)).toEqual(['Components', 'Foundations']);
  });
});
