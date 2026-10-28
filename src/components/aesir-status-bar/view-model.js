import { createTimeline, getEventStart, normalizeTotal } from './timeline.js';

export const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
const minuteTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const secondTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fullDateTime = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });

export const timeFormatter = (interval) => (interval < 60_000 ? secondTime : minuteTime);

export function startLabel(items, interval) {
  const first = items[0];
  const last = items.at(-1);
  if (first?.start == null || last?.end == null) return first?.label ?? `${items.length} periods ago`;

  const from = new Date(first.start);
  const to = new Date(last.end - 1);
  if (from.toDateString() === to.toDateString()) return timeFormatter(interval).format(from);
  if (interval < 86_400_000) return `${shortDate.format(from)}, ${timeFormatter(interval).format(from)}`;

  const days = Math.max(1, Math.round((last.end - first.start) / 86_400_000));
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function intervalLabel(start, end, interval, format) {
  if (format) return format(new Date(start), new Date(end));
  const from = new Date(start);
  const to = new Date(end);
  return from.toDateString() === to.toDateString()
    ? `${shortDate.format(from)}, ${timeFormatter(interval).format(from)}–${timeFormatter(interval).format(to)}`
    : `${fullDateTime.format(from)} – ${fullDateTime.format(to)}`;
}

export function buildItems({ items, interval, total, endTime, defaultStatus, getEvent, getIntervalColor, formatInterval }) {
  if (interval) {
    return createTimeline({ items, interval, total: total ?? 90, endTime, defaultStatus, getEvent, getIntervalColor }).map((bucket) => ({
      ...bucket,
      id: `aesir-status-${bucket.start}-${bucket.end}`,
      label: intervalLabel(bucket.start, bucket.end, interval, formatInterval)
    }));
  }

  const count = normalizeTotal(total ?? items.length, items.length);
  const visible = count ? items.slice(-count) : [];
  const placeholders = Array.from({ length: Math.max(0, count - visible.length) }, (_, index) => ({
    id: `aesir-status-placeholder-${index}`,
    label: 'No data',
    status: 'unknown',
    description: 'No status data is available for this period.'
  }));

  return [...placeholders, ...visible].map((item) => {
    const data = getEvent(item) ?? {};
    return { ...item, ...data, events: item.events ?? (getEventStart(data) == null ? [] : [item]), occurrences: item.occurrences ?? [] };
  });
}
