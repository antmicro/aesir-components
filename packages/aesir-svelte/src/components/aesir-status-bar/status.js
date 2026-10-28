const STATUS_META = {
  operational: {
    label: 'Operational',
    description: 'Operational during this interval.'
  },
  degraded: {
    label: 'Degraded',
    description: 'Degraded performance during this interval.'
  },
  outage: {
    label: 'Outage',
    description: 'Service outage during this interval.'
  },
  maintenance: {
    label: 'Maintenance',
    description: 'Scheduled maintenance during this interval.'
  },
  unknown: {
    label: 'No data',
    description: 'No status data for this interval.'
  }
};

export function getStatusMeta(status) {
  return STATUS_META[status] ?? STATUS_META.unknown;
}

export function pluralizeEvents(count) {
  return `${count} event${count === 1 ? '' : 's'}`;
}
