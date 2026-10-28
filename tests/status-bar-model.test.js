import { describe, expect, test } from 'vitest';
import { buildItems } from '../src/components/aesir-status-bar/view-model.js';

describe('status bar timeline model', () => {
  test('groups raw events into intervals and keeps the most severe status', () => {
    const day = 86_400_000;
    const jan2 = Date.UTC(2026, 0, 2);
    const items = [
      { occurredAt: jan2 + 3_600_000, state: 'degraded' },
      { occurredAt: jan2 + 7_200_000, state: 'outage' },
      { occurredAt: jan2 + day + 3_600_000, state: 'operational' }
    ];

    const intervals = buildItems({
      items,
      interval: day,
      total: 2,
      endTime: jan2 + day + 43_200_000,
      defaultStatus: 'unknown',
      getEvent: (item) => ({ time: item.occurredAt, status: item.state }),
      formatInterval: (start) => start.toISOString().slice(0, 10)
    });

    expect(intervals.map(({ label, status, events, color }) => ({ label, status, events: events.length, color }))).toEqual([
      { label: '2026-01-02', status: 'outage', events: 2, color: 'var(--ds-emphasis-red)' },
      { label: '2026-01-03', status: 'operational', events: 1, color: 'var(--ds-emphasis-green)' }
    ]);
  });

  test('keeps the existing pre-aggregated item model when interval is omitted', () => {
    const items = [{ id: 'today', label: 'Today', status: 'operational' }];
    expect(buildItems({ items, total: 2, defaultStatus: 'unknown', getEvent: (item) => item })).toMatchObject([{ status: 'unknown' }, { id: 'today', label: 'Today', status: 'operational' }]);
  });

  test('uses the default history length for a non-finite total', () => {
    const items = [{ id: 'today', label: 'Today', status: 'operational' }];
    expect(buildItems({ items, total: Infinity, getEvent: (item) => item })).toMatchObject(items);
    expect(buildItems({ items: [], interval: 10_000, total: Infinity, endTime: 20_000 })).toHaveLength(90);
  });

  test('carries an ongoing status into an interval starting exactly at the timeline anchor', () => {
    const base = {
      interval: 10_000,
      total: 2,
      endTime: 20_000,
      defaultStatus: 'unknown',
      getEvent: (item) => item
    };

    const ongoing = buildItems({ ...base, items: [{ time: 15_000, ongoing: true, status: 'outage' }] });
    const stateChange = buildItems({ ...base, items: [{ time: 15_000, online: false }] });
    const recovered = buildItems({
      ...base,
      items: [
        { time: 15_000, online: false },
        { time: 20_000, online: true }
      ]
    });
    const completed = buildItems({ ...base, items: [{ time: 15_000, endTime: 20_000, ongoing: true, status: 'outage' }] });

    expect(ongoing.at(-1)).toMatchObject({ status: 'outage', color: 'var(--ds-emphasis-red)' });
    expect(stateChange.at(-1)).toMatchObject({ status: 'outage', color: 'var(--ds-emphasis-red)' });
    expect(recovered.at(-1)).toMatchObject({ status: 'operational', color: 'var(--ds-emphasis-green)' });
    expect(completed.at(-1)).toMatchObject({ status: 'unknown', color: 'var(--ds-border)' });
  });

  test('does not include events later than the timeline anchor in its current interval', () => {
    const base = {
      interval: 10_000,
      total: 2,
      endTime: 25_000,
      defaultStatus: 'unknown',
      getEvent: (item) => item
    };
    const intervals = buildItems({
      ...base,
      items: [
        { time: 25_000, status: 'operational' },
        { time: 29_000, status: 'outage' }
      ]
    });
    const futureOngoing = buildItems({ ...base, items: [{ time: 29_000, status: 'outage', ongoing: true }] });

    expect(intervals.at(-1)).toMatchObject({ status: 'operational', color: 'var(--ds-emphasis-green)' });
    expect(intervals.at(-1).events).toHaveLength(1);
    expect(futureOngoing.at(-1)).toMatchObject({ status: 'unknown', color: 'var(--ds-border)' });
    expect(futureOngoing.at(-1).events).toHaveLength(0);
  });
});
