import { describe, expect, test } from 'vitest';
import { parseRequirementsSource } from '../src/lib/components/docs/examples/requirements-explorer/requirements-parser.js';

describe('SoW requirements parser', () => {
  test('parses unified requirement tokens without leaking syntax into the description', () => {
    const { description, requirements } = parseRequirementsSource(`---
variants:
  - density--compact
---

# Example SoW

Project description.

|Q2| (wip) {Q2} Current milestone [1PW] #100
|Q2.OVERLAYS| (in-review) {Overlay primitives} {? Coordinate consumers. ?} {! Verify focus. !} Build [the overlay model](#overlay) [2PD] #101 <density--compact>
`);

    expect(description).toBe('# Example SoW\n\nProject description.');
    expect(requirements).toHaveLength(1);
    expect(requirements[0]).toMatchObject({ id: 'Q2', status: 'wip', estimate: 1, issues: ['100'] });
    expect(requirements[0].children[0]).toMatchObject({
      id: 'Q2.OVERLAYS',
      depth: 1,
      title: 'Overlay primitives',
      status: 'in-review',
      description: 'Build the overlay model',
      estimate: 0.4,
      issues: ['101'],
      links: [{ label: 'the overlay model', href: '#overlay' }],
      notes: [
        { type: 'comment', text: 'Coordinate consumers.' },
        { type: 'remark', text: 'Verify focus.' }
      ],
      variants: ['density--compact']
    });
  });

  test('collects indented issues and applies an experimental comment override', () => {
    const { requirements } = parseRequirementsSource(`|REQ| (none) {Requirements} Root
|REQ.FORMS| (wip) {Forms} {? Original comment. ?} Form controls #201
  * #201
  * #202
REQ.FORMS: Overridden comment.
`);
    const item = requirements[0].children[0];

    expect(item.issues).toEqual(['201', '202']);
    expect(item.issueCount).toBe(2);
    expect(item.notes).toEqual([{ type: 'comment', text: 'Overridden comment.' }]);
  });

  test('creates a stable root when the file only defines dotted requirement IDs', () => {
    const { requirements } = parseRequirementsSource(`|API.AUTH| (done) {Authentication} Token flow [40h]
|API.AUTH.LOGIN| (done) {Login} Browser login [1PM]
`);

    expect(requirements[0]).toMatchObject({ id: 'API', title: 'API', status: 'none' });
    expect(requirements[0].children).toEqual([expect.objectContaining({ id: 'API.AUTH', depth: 1, estimate: 1 }), expect.objectContaining({ id: 'API.AUTH.LOGIN', depth: 2, estimate: 4 })]);
  });

  test('ignores variant-like values without the required separator', () => {
    const { requirements } = parseRequirementsSource('|REQ.ITEM| (none) {Item} Description <invalid> <theme--dark>');
    expect(requirements[0].children[0].variants).toEqual(['theme--dark']);
  });

  test('preserves narrative sections that appear between and after requirements', () => {
    const { description } = parseRequirementsSource(`# Example SoW

Introduction.

## Current milestone

|Q2| (wip) {Q2} Current work [1PW] #100
  * #101

## Previous milestone

Carry-over context.

|Q1| (done) {Q1} Completed work [1PW]

## Notes

Closing context.
`);

    expect(description).toBe(`# Example SoW

Introduction.

## Current milestone

## Previous milestone

Carry-over context.

## Notes

Closing context.`);
  });
});
