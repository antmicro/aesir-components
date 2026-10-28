import { createChatMessage } from './team-chat-model.js';

const pad = (value) => String(value).padStart(2, '0');

export function localScheduleFields(date) {
  return { date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`, time: `${pad(date.getHours())}:${pad(date.getMinutes())}` };
}

export function parseScheduleTime(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return undefined;
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const result = new Date(year, month - 1, day, hour, minute);
  // Reject rolled-over dates and local times that do not exist during a DST change.
  if (result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== day || result.getHours() !== hour || result.getMinutes() !== minute) return undefined;
  return result.getTime();
}

export function schedulePreset(value, now = new Date()) {
  if (value === 'hour') return now.getTime() + 60 * 60 * 1000;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return tomorrow.getTime();
}

export const formatScheduleTime = (timestamp) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp);
export const scheduleDateTime = (timestamp) => new Date(timestamp).toISOString();
export const scheduleTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
export const scheduleNow = () => Date.now();
export const defaultScheduleFields = () => ({ ...localScheduleFields(new Date(schedulePreset('hour'))), minDate: localScheduleFields(new Date()).date });

export function deliverScheduledMessage(entry, now = new Date()) {
  return { ...createChatMessage(entry.text, { id: entry.id, now, replyToId: entry.replyToId }), conversation: entry.conversation };
}

export function createScheduledMessage(text, conversation, sendAt, { id = crypto.randomUUID(), replyToId, now = Date.now() } = {}) {
  if (!text.trim() || !conversation || !Number.isFinite(sendAt) || sendAt <= now) return undefined;
  return { id, text: text.trim(), conversation, sendAt, ...(replyToId ? { replyToId } : {}) };
}

export function partitionScheduledMessages(queue, now = Date.now()) {
  return {
    due: queue.filter((entry) => entry.sendAt <= now).toSorted((a, b) => a.sendAt - b.sendAt),
    pending: queue.filter((entry) => entry.sendAt > now)
  };
}
