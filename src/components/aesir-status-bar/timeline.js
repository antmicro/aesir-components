const STATUS_PRIORITY = {
  unknown: 0,
  operational: 1,
  maintenance: 2,
  degraded: 3,
  outage: 4
};

const NAMED_INTERVALS = {
  minute: 60_000,
  '5-minutes': 5 * 60_000,
  quarter: 15 * 60_000,
  hour: 60 * 60_000
};

const STATUS_COLORS = {
  operational: 'var(--ds-emphasis-green)',
  maintenance: 'var(--ds-emphasis-blue)',
  degraded: 'var(--ds-emphasis-orange)',
  outage: 'var(--ds-emphasis-red)',
  unknown: 'var(--ds-border)'
};

export function resolveInterval(value) {
  const interval = typeof value === 'number' ? value : (NAMED_INTERVALS[value] ?? Number(value));
  return Number.isFinite(interval) && interval > 0 ? interval : undefined;
}

export function normalizeTotal(value, fallback) {
  const total = Number(value);
  return Number.isFinite(total) ? Math.max(0, Math.floor(total)) : fallback;
}

function highestStatus(occurrences, defaultStatus) {
  if (!occurrences.length) return defaultStatus;
  return occurrences.reduce((selected, { data }) => {
    const status = data.status ?? defaultStatus;
    return (STATUS_PRIORITY[status] ?? 0) > (STATUS_PRIORITY[selected] ?? 0) ? status : selected;
  }, occurrences[0].data.status ?? defaultStatus);
}

function mixIntervalColor({ start, end, occurrences, defaultStatus }) {
  const ongoing = occurrences.findLast(({ data }) => data.ongoing);
  if (ongoing) return STATUS_COLORS[ongoing.data.status] ?? STATUS_COLORS.unknown;
  const points = occurrences.filter(({ point }) => point);
  if (points.length) return STATUS_COLORS[highestStatus(occurrences, defaultStatus)] ?? STATUS_COLORS.unknown;

  const ranges = occurrences.filter(({ duration }) => duration > 0);
  if (!ranges.length) return STATUS_COLORS[highestStatus(occurrences, defaultStatus)] ?? STATUS_COLORS.unknown;

  const durations = new Map();
  const boundaries = [...new Set([start, end, ...ranges.flatMap((range) => [+range.start, +range.end])])].sort((a, b) => a - b);
  for (let index = 1; index < boundaries.length; index += 1) {
    const from = boundaries[index - 1];
    const to = boundaries[index];
    const active = ranges.filter((range) => +range.start < to && +range.end > from);
    const status = highestStatus(active, defaultStatus);
    durations.set(status, (durations.get(status) ?? 0) + to - from);
  }

  let color;
  let total = 0;
  for (const [status, duration] of durations) {
    if (!duration) continue;
    const next = STATUS_COLORS[status] ?? STATUS_COLORS.unknown;
    color = color ? `color-mix(in oklch shorter hue, ${color}, ${next} ${(duration / (total + duration)) * 100}%)` : next;
    total += duration;
  }
  return color;
}

export function getEventStart(event) {
  const start = new Date(event?.time ?? event?.startedAt ?? event?.startTime ?? event?.start).getTime();
  return Number.isFinite(start) ? start : undefined;
}

function eventBounds(event, now) {
  const start = getEventStart(event);
  if (!Number.isFinite(start)) return undefined;

  const suppliedEnd = event.endedAt ?? event.endTime ?? event.end;
  const ongoing = suppliedEnd == null && Boolean(event.ongoing);
  const end = suppliedEnd == null ? (ongoing ? now : start) : new Date(suppliedEnd).getTime();
  return { start, end: Number.isFinite(end) && end > start ? end : start, ongoing };
}

function prepareEvents(items, endTime, getEvent) {
  const records = (Array.isArray(items) ? items : []).map((event) => ({ event, data: getEvent(event) }));
  const states = records.filter(({ data }) => typeof data?.online === 'boolean').sort((a, b) => getEventStart(a.data) - getEventStart(b.data));
  if (!states.length) return records;

  const ranges = [];
  for (const state of states) {
    const start = getEventStart(state.data);
    if (!Number.isFinite(start)) continue;
    const previous = ranges.at(-1);
    if (previous?.data.online === state.data.online) continue;
    if (previous) {
      previous.event.endTime = previous.data.endTime = start;
      previous.continuesAtAnchor = false;
    }
    const data = { ...state.data, time: start, endTime, status: state.data.online ? 'operational' : 'outage', label: state.data.label ?? (state.data.online ? 'Online' : 'Offline') };
    ranges.push({ event: { ...state.event, ...data }, data, continuesAtAnchor: state.data.endedAt == null && state.data.end == null });
  }
  return [...records.filter(({ data }) => typeof data?.online !== 'boolean'), ...ranges];
}

export function createTimeline({ items, interval, total = 90, endTime = Date.now(), defaultStatus = 'unknown', getEvent = (item) => item, getIntervalColor }) {
  const resolvedInterval = resolveInterval(interval);
  const count = normalizeTotal(total, 90);
  const resolvedEndTime = new Date(endTime).getTime();
  if (!resolvedInterval || !Number.isFinite(resolvedEndTime) || count === 0) return [];

  const currentStart = Math.floor(resolvedEndTime / resolvedInterval) * resolvedInterval;
  const firstStart = currentStart - (count - 1) * resolvedInterval;
  const buckets = Array.from({ length: count }, (_, index) => ({
    start: firstStart + index * resolvedInterval,
    end: firstStart + (index + 1) * resolvedInterval,
    events: [],
    occurrences: []
  }));

  for (const { event, data, continuesAtAnchor } of prepareEvents(items, resolvedEndTime, getEvent)) {
    if (!data || typeof data !== 'object') continue;
    const bounds = eventBounds(data, resolvedEndTime);
    if (!bounds || bounds.start > resolvedEndTime) continue;

    const firstBucket = Math.max(0, Math.floor((bounds.start - firstStart) / resolvedInterval));
    const lastTimestamp = bounds.ongoing || continuesAtAnchor ? bounds.end : bounds.end > bounds.start ? bounds.end - 1 : bounds.start;
    const lastBucket = Math.min(count - 1, Math.floor((lastTimestamp - firstStart) / resolvedInterval));
    if (lastBucket < 0 || firstBucket >= count || firstBucket > lastBucket) continue;
    const point = bounds.start === bounds.end;

    for (let index = firstBucket; index <= lastBucket; index += 1) {
      const bucket = buckets[index];
      const start = Math.max(bounds.start, bucket.start);
      const end = point ? start : Math.min(bounds.end, bucket.end, resolvedEndTime);
      bucket.events.push(event);
      bucket.occurrences.push({ event, data, start: new Date(start), end: new Date(end), duration: end - start, point });
    }
  }

  return buckets.map((bucket) => ({
    ...bucket,
    status: highestStatus(bucket.occurrences, defaultStatus),
    color: (getIntervalColor ?? mixIntervalColor)({ ...bucket, end: Math.min(bucket.end, resolvedEndTime), defaultStatus })
  }));
}
