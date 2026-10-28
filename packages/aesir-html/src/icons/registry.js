const toIconName = (name) => {
  if (typeof name !== 'string') return '';
  return name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
};

const fallbackNode = [['circle', { cx: '12', cy: '12', r: '9' }]];
let icons = globalThis.AesirLucideIconNodes ?? {};

export const registerIcons = (nextIcons) => {
  icons = nextIcons ?? {};
};

export const resolveIcon = (name) => icons[toIconName(name)] ?? fallbackNode;
