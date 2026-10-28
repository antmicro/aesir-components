const modifiers = {
  alt: 'altKey',
  option: 'altKey',
  '⌥': 'altKey',
  ctrl: 'ctrlKey',
  control: 'ctrlKey',
  '⌃': 'ctrlKey',
  meta: 'metaKey',
  cmd: 'metaKey',
  command: 'metaKey',
  '⌘': 'metaKey',
  shift: 'shiftKey',
  '⇧': 'shiftKey'
};

const reservedPrimaryKeys = new Set(['a', 'c', 'd', 'f', 'h', 'j', 'l', 'n', 'o', 'p', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']);

const tokens = (shortcut) =>
  (Array.isArray(shortcut)
    ? shortcut
    : String(shortcut)
        .replace(/([⌘⌥⌃⇧])/g, '$1+')
        .split('+')
  )
    .map((token) => String(token).trim())
    .filter(Boolean);

export const isEditableTarget = (target) => target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));

export const isReservedShortcut = (shortcut) => {
  const values = tokens(shortcut).map((token) => token.toLowerCase());
  const hasPrimary = values.some((token) => ['ctrl', 'control', '⌃', 'meta', 'cmd', 'command', '⌘'].includes(token));
  const hasAlt = values.some((token) => ['alt', 'option', '⌥'].includes(token));
  const key = values.find((token) => !modifiers[token]);
  return hasPrimary && !hasAlt && reservedPrimaryKeys.has(key);
};

export const matchesShortcut = (event, shortcut, { allowUnmodified = false } = {}) => {
  if (!shortcut || isReservedShortcut(shortcut)) return false;
  const values = tokens(shortcut);
  const expected = { altKey: false, ctrlKey: false, metaKey: false, shiftKey: false };
  let key = '';
  for (const value of values) {
    const modifier = modifiers[value.toLowerCase()];
    if (modifier) expected[modifier] = true;
    else key = value.toLowerCase();
  }
  if (!key || (!allowUnmodified && !Object.values(expected).some(Boolean))) return false;
  const acceptsImplicitShift = allowUnmodified && /^[a-z]$/i.test(key) && !expected.shiftKey;
  return event.key.toLowerCase() === key && Object.entries(expected).every(([name, enabled]) => (name === 'shiftKey' && acceptsImplicitShift ? true : event[name] === enabled));
};
