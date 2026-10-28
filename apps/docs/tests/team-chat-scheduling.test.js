import { describe, expect, it } from 'vitest';
import {
  createScheduledMessage,
  deliverScheduledMessage,
  localScheduleFields,
  parseScheduleTime,
  partitionScheduledMessages,
  schedulePreset
} from '../src/lib/components/docs/examples/team-chat/team-chat-scheduling.js';

describe('team chat scheduling', () => {
  const now = new Date(2026, 9, 8, 23, 45);
  it('uses local calendar dates and rolls the one-hour preset into the next day', () => {
    const fields = localScheduleFields(new Date(schedulePreset('hour', now)));
    expect(fields).toEqual({ date: '2026-10-09', time: '00:45' });
    expect(parseScheduleTime(fields.date, fields.time)).toBe(now.getTime() + 3600000);
  });
  it('sets tomorrow to local 9:00, including across month and year boundaries', () => {
    expect(localScheduleFields(new Date(schedulePreset('tomorrow', now)))).toEqual({ date: '2026-10-09', time: '09:00' });
    expect(localScheduleFields(new Date(schedulePreset('tomorrow', new Date(2026, 11, 31, 12))))).toEqual({ date: '2027-01-01', time: '09:00' });
  });
  it('rejects missing, malformed and rolled-over dates and times', () => {
    for (const [date, time] of [
      ['', '09:00'],
      ['2026-02-30', '09:00'],
      ['2026-13-01', '09:00'],
      ['2026-10-08', '24:00'],
      ['2026-10-08', '12:60'],
      ['2026-10-08', '9:00']
    ])
      expect(parseScheduleTime(date, time)).toBeUndefined();
    expect(parseScheduleTime('2028-02-29', '09:00')).toBe(new Date(2028, 1, 29, 9).getTime());
  });
  it('rejects empty content, absent destinations and non-future or invalid timestamps', () => {
    const options = { now: now.getTime(), id: 'queued' };
    for (const sendAt of [now.getTime(), now.getTime() - 1, NaN, Infinity, undefined]) expect(createScheduledMessage('hello', 'general', sendAt, options)).toBeUndefined();
    expect(createScheduledMessage(' \n ', 'general', now.getTime() + 1, options)).toBeUndefined();
    expect(createScheduledMessage('hello', '', now.getTime() + 1, options)).toBeUndefined();
  });
  it('preserves formatting, conversation and reply reference when delivered', () => {
    const entry = createScheduledMessage('  **Hello**\nAgain  ', 'dm-sam', now.getTime() + 1, { now: now.getTime(), id: 'queued', replyToId: 'original' });
    const snapshot = structuredClone(entry);
    expect(entry).toMatchObject({ text: '**Hello**\nAgain', conversation: 'dm-sam', replyToId: 'original' });
    expect(deliverScheduledMessage(entry, now)).toMatchObject({ id: 'queued', text: entry.text, conversation: 'dm-sam', replyToId: 'original', author: 'you', reactions: [] });
    expect(deliverScheduledMessage(entry, now)).not.toHaveProperty('sendAt');
    expect(entry).toEqual(snapshot);
  });
  it('partitions due messages in delivery order without mutating the queue or delivering twice', () => {
    const queue = [
      { id: 'later', sendAt: 300 },
      { id: 'second', sendAt: 200 },
      { id: 'first', sendAt: 100 }
    ];
    const snapshot = structuredClone(queue);
    const { due, pending } = partitionScheduledMessages(queue, 200);
    expect(due.map((entry) => entry.id)).toEqual(['first', 'second']);
    expect(pending).toEqual([queue[0]]);
    expect(partitionScheduledMessages(pending, 200).due).toEqual([]);
    expect(queue).toEqual(snapshot);
  });
});
